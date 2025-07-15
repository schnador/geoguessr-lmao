// ==UserScript==
// @name         GeoGuessr Liked Maps Advanced Overhaul (LMAO)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds folder organization to liked maps on GeoGuessr
// @author       snador
// @match        https://www.geoguessr.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // --- CONFIGURATION OBJECT ---
  /**
   * Central configuration for LMAO userscript.
   */
  const CONFIG = {
    version: '1.0.0',
    features: {
      enhancedUI: true,
      debugMode: true
    },
    validPaths: ['/me/likes', '/maps/community'],
    validTabs: [undefined, 'liked-maps']
  };

  /**
   * Debug logger for LMAO.
   * @param {...any} args
   */
  function debugLog(...args) {
    if (CONFIG.features.debugMode) {
      console.log('[LMAO Debug]', ...args);
    }
  }

  // --- CONSTANTS & LOCALSTORAGE KEYS ---
  const LOCALSTORAGE_USER_TAGS_KEY = 'lmaoUserTags';
  const LOCALSTORAGE_TAG_VISIBILITY_KEY = 'lmaoTagVisibility';
  const LOCALSTORAGE_FILTER_COLLAPSE_KEY = 'lmaoFilterCollapse';
  const LOCALSTORAGE_GEOMETA_PREFIX = 'geometa:map-info:';
  const USER_TAG_CLASS = 'lmao-map-teaser_tag user-tag';
  const API_TAG_CLASS = 'lmao-map-teaser_tag api-tag';

  // --- UTILS ---
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getMapKey(map) {
    // Always use the map's id (UUID or slug) as the key for user tags
    return map.id;
  }

  function getMapByTeaserHref(maps, href) {
    const idMatch = href && href.match(/\/maps\/([^/?#]+)/);
    if (!idMatch) return null;
    const mapIdOrSlug = idMatch[1];
    // Try to find by id or by slug
    return maps.find((m) => m.id === mapIdOrSlug || m.slug === mapIdOrSlug) || null;
  }

  function isLearnableMeta(mapId) {
    let data = localStorage.getItem(LOCALSTORAGE_GEOMETA_PREFIX + mapId);
    if (!data) return false;
    try {
      const obj = JSON.parse(data);
      return obj && obj.mapFound === true;
    } catch {
      return false;
    }
  }

  // --- LOCALSTORAGE STATE ---
  function loadUserTags() {
    return JSON.parse(localStorage.getItem(LOCALSTORAGE_USER_TAGS_KEY) || '{}');
  }

  function saveUserTags(userTags) {
    localStorage.setItem(LOCALSTORAGE_USER_TAGS_KEY, JSON.stringify(userTags));
  }

  function loadTagVisibility() {
    try {
      return (
        JSON.parse(localStorage.getItem(LOCALSTORAGE_TAG_VISIBILITY_KEY)) || {
          showUserTags: true,
          showLearnableMetaTags: true,
          showApiTags: false
        }
      );
    } catch {
      return { showUserTags: true, showLearnableMetaTags: true, showApiTags: false };
    }
  }

  function saveTagVisibility(state) {
    localStorage.setItem(LOCALSTORAGE_TAG_VISIBILITY_KEY, JSON.stringify(state));
  }

  function loadFilterCollapse() {
    try {
      return (
        JSON.parse(localStorage.getItem(LOCALSTORAGE_FILTER_COLLAPSE_KEY)) || {
          user: false,
          api: true,
          meta: false
        }
      );
    } catch {
      return { user: false, api: true, meta: false };
    }
  }

  function saveFilterCollapse(state) {
    localStorage.setItem(LOCALSTORAGE_FILTER_COLLAPSE_KEY, JSON.stringify(state));
  }

  // --- API ---
  async function fetchAllLikedMaps() {
    const allMaps = [];
    let paginationToken = null;
    let url = 'https://www.geoguessr.com/api/v3/likes/maps?limit=50';
    while (true) {
      const res = await fetch(
        paginationToken ? `${url}&paginationToken=${encodeURIComponent(paginationToken)}` : url,
        { credentials: 'include' }
      );

      if (!res.ok) {
        console.error('[LMAO] Failed to fetch liked maps:', res.status);
        break;
      }

      const data = await res.json();
      allMaps.push(...data.items);

      if (!data.paginationToken) break;

      paginationToken = data.paginationToken;
    }

    return allMaps;
  }

  // --- UI HELPERS ---
  function createCheckbox(labelText, checked, onChange) {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + labelText));
    return label;
  }

  function createRadioGroup(options, selected, name, onChange) {
    const div = document.createElement('div');
    options.forEach((opt) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = name;
      radio.value = opt.value;
      radio.checked = selected === opt.value;
      radio.addEventListener('change', () => {
        if (radio.checked) onChange(opt.value);
      });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + opt.label));
      label.style.marginRight = '1em';
      div.appendChild(label);
    });

    return div;
  }

  function createCollapsibleTagGroup(
    title,
    tags,
    selectedTags,
    onChange,
    collapsed,
    onCollapseToggle
  ) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'lmao-collapsible-tag-group';

    // Header
    const header = document.createElement('div');
    header.className = 'lmao-collapsible-header';

    const arrow = document.createElement('span');
    arrow.className = 'lmao-collapsible-arrow';
    arrow.textContent = collapsed ? '▶' : '▼';
    header.appendChild(arrow);
    header.appendChild(document.createTextNode(title));
    header.onclick = () => onCollapseToggle(!collapsed);
    groupDiv.appendChild(header);

    // Tags
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'lmao-collapsible-tags' + (collapsed ? ' lmao-collapsed' : '');
    tags.forEach((tag) => {
      const label = document.createElement('label');
      label.className = 'lmao-collapsible-tag-label';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = tag;
      cb.checked = selectedTags.includes(tag);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTags.push(tag);
        else selectedTags.splice(selectedTags.indexOf(tag), 1);
        onChange([...selectedTags]);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + tag));
      tagsDiv.appendChild(label);
    });
    groupDiv.appendChild(tagsDiv);
    return groupDiv;
  }

  function createTagVisibilityToggles(tagVisibility, onChange) {
    const div = document.createElement('div');
    div.className = 'lmao-tag-visibility-toggles';

    div.appendChild(
      createCheckbox('Show user tags', tagVisibility.showUserTags, (checked) => {
        tagVisibility.showUserTags = checked;
        saveTagVisibility(tagVisibility);
        onChange({ ...tagVisibility });
      })
    );

    div.appendChild(
      createCheckbox('Show learnable meta tags', tagVisibility.showLearnableMetaTags, (checked) => {
        tagVisibility.showLearnableMetaTags = checked;
        saveTagVisibility(tagVisibility);
        onChange({ ...tagVisibility });
      })
    );

    div.appendChild(
      createCheckbox('Show default tags', tagVisibility.showApiTags, (checked) => {
        tagVisibility.showApiTags = checked;
        saveTagVisibility(tagVisibility);
        onChange({ ...tagVisibility });
      })
    );
    return div;
  }

  function createControlsUI(
    userTagsList,
    apiTagsList,
    metaTagsList,
    selectedTags,
    onTagFilterChange,
    onEditModeToggle,
    tagVisibility,
    onTagVisibilityChange,
    onFilterModeToggle,
    filterCollapse,
    onCollapseChange,
    filterMode,
    editMode
  ) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'lmao-controls';

    const header = (title) => {
      const s = document.createElement('strong');
      s.textContent = title;
      s.className = 'lmao-controls-header';
      return s;
    };

    const headerFilterMode = header('Filtermode');
    headerFilterMode.style.marginTop = '0.25rem';
    controlsDiv.appendChild(headerFilterMode);
    controlsDiv.appendChild(
      createRadioGroup(
        [
          { value: 'ANY', label: 'Any tag' },
          { value: 'ALL', label: 'All tags' }
        ],
        filterMode,
        'lmao-filter-mode',
        onFilterModeToggle
      )
    );
    controlsDiv.appendChild(header('Filter'));
    controlsDiv.appendChild(
      createCollapsibleTagGroup(
        'User tags',
        userTagsList,
        selectedTags,
        onTagFilterChange,
        filterCollapse.user,
        (c) => onCollapseChange({ ...filterCollapse, user: c })
      )
    );
    controlsDiv.appendChild(
      createCollapsibleTagGroup(
        'Learnable Meta',
        metaTagsList,
        selectedTags,
        onTagFilterChange,
        filterCollapse.meta,
        (c) => onCollapseChange({ ...filterCollapse, meta: c })
      )
    );
    controlsDiv.appendChild(
      createCollapsibleTagGroup(
        'Default tags',
        apiTagsList,
        selectedTags,
        onTagFilterChange,
        filterCollapse.api,
        (c) => onCollapseChange({ ...filterCollapse, api: c })
      )
    );
    controlsDiv.appendChild(header('Tag Visibility'));
    controlsDiv.appendChild(createTagVisibilityToggles(tagVisibility, onTagVisibilityChange));
    controlsDiv.appendChild(header('Edit Mode'));
    controlsDiv.appendChild(createCheckbox('Edit tags', editMode, onEditModeToggle));
    return controlsDiv;
  }

  // --- PATCH TEASERS ---
  function patchTeasersWithControls(
    maps,
    userTags,
    selectedTags,
    tagVisibility,
    userTagsList,
    onTagAdd,
    onTagRemove,
    filterMode,
    editMode
  ) {
    injectStaticTagStyle();
    const grid = findGridContainer();
    if (!grid) return;
    const teasers = findMapTeaserElements(grid);
    teasers.forEach((teaser) => {
      const href = teaser.getAttribute('href');
      const map = getMapByTeaserHref(maps, href);
      if (!map) return;

      const mapKey = getMapKey(map);
      // Compute all tags (user, api, meta)
      const allTags = [...new Set([...(map.tags || []), ...(userTags[mapKey] || [])])];
      if (isLearnableMeta(mapKey) && !allTags.includes('Learnable Meta'))
        allTags.push('Learnable Meta');
      if (map.isUserMap === false) allTags.push('Official');

      // Filter logic
      if (selectedTags.length > 0) {
        if (filterMode === 'ALL') {
          if (!selectedTags.every((tag) => allTags.includes(tag))) {
            teaser.closest('li').style.display = 'none';
            return;
          }
        } else {
          if (!selectedTags.some((tag) => allTags.includes(tag))) {
            teaser.closest('li').style.display = 'none';
            return;
          }
        }
      }
      teaser.closest('li').style.display = '';

      const tagsContainer = findTagsContainer(teaser);
      if (!tagsContainer) {
        console.warn('[LMAO] Tags container not found for map', map.slug);
        return;
      }

      // Clear existing tags
      tagsContainer
        .querySelectorAll('.lmao-map-teaser_tag, .lmao-tag-input')
        .forEach((e) => e.remove());

      // Add Official tag as a default tag if present and showApiTags is true
      if (tagVisibility.showApiTags && allTags.includes('Official')) {
        const tagDiv = document.createElement('span');
        tagDiv.className = API_TAG_CLASS;
        tagDiv.textContent = 'Official';
        tagDiv.style.cursor = 'default';
        tagDiv.addEventListener(
          'mousedown',
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        tagDiv.addEventListener(
          'click',
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        tagsContainer.appendChild(tagDiv);
      }

      // Hide or show native API tags based on toggle
      Array.from(tagsContainer.children).forEach((child) => {
        if (
          child.tagName === 'DIV' &&
          child.className &&
          child.className.includes('map-teaser_tag') &&
          !child.className.includes('user-tag') &&
          !child.className.includes('api-tag') &&
          !child.className.includes('lmao-tag-input')
        ) {
          child.style.display = tagVisibility.showApiTags ? '' : 'none';
        }
        child.style.cursor = 'default';
        child.addEventListener(
          'mousedown',
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        child.addEventListener(
          'click',
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
      });

      // Add user tags if enabled
      if (tagVisibility.showUserTags) {
        (userTags[mapKey] || []).forEach((tag) => {
          const tagDiv = document.createElement('span');
          tagDiv.className = USER_TAG_CLASS;
          tagDiv.style.cursor = 'default';
          tagDiv.setAttribute('data-lmao-usertag', '1');
          tagDiv.textContent = tag;
          tagDiv.addEventListener(
            'mousedown',
            (e) => {
              if (e.target === tagDiv) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            true
          );
          tagDiv.addEventListener(
            'click',
            (e) => {
              if (e.target === tagDiv) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            true
          );
          if (editMode) {
            const rmBtn = document.createElement('button');
            rmBtn.textContent = '×';
            rmBtn.title = 'Remove tag';
            rmBtn.className = 'lmao-tag-remove-btn';
            rmBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              debugLog('[LMAO] Removing tag', tag, 'from map', map.id);
              onTagRemove(map, tag);
            };
            tagDiv.appendChild(rmBtn);
          }
          tagsContainer.appendChild(tagDiv);
        });
      }

      // Add Learnable Meta tag if present
      if (tagVisibility.showLearnableMetaTags && isLearnableMeta(mapKey)) {
        const tagDiv = document.createElement('span');
        tagDiv.className = USER_TAG_CLASS + ' lmao-learnable-meta';
        tagDiv.textContent = 'Learnable Meta';
        tagDiv.style.cursor = 'default';
        tagDiv.addEventListener(
          'mousedown',
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        tagDiv.addEventListener(
          'click',
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        tagsContainer.appendChild(tagDiv);
      }

      // Add tag input if in edit mode
      if (editMode && tagVisibility.showUserTags) {
        const datalistId = 'lmao-user-tags-datalist';
        let datalist = document.getElementById(datalistId);

        if (!datalist) {
          datalist = document.createElement('datalist');
          datalist.id = datalistId;
          userTagsList.forEach((tag) => {
            const option = document.createElement('option');
            option.value = tag;
            datalist.appendChild(option);
          });
          document.body.appendChild(datalist);
        } else {
          datalist.innerHTML = '';
          userTagsList.forEach((tag) => {
            const option = document.createElement('option');
            option.value = tag;
            datalist.appendChild(option);
          });
        }

        const addTagInput = document.createElement('input');
        addTagInput.placeholder = 'Add tag';
        addTagInput.className = 'lmao-tag-input';
        addTagInput.setAttribute('list', datalistId);

        ['mousedown', 'click'].forEach((evt) => {
          addTagInput.addEventListener(evt, (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.target.focus();
          });
        });

        addTagInput.addEventListener('input', function () {
          const val = addTagInput.value.toLowerCase();
          datalist.innerHTML = '';
          userTagsList
            .filter((tag) => tag.toLowerCase().startsWith(val))
            .forEach((tag) => {
              const option = document.createElement('option');
              option.value = tag;
              datalist.appendChild(option);
            });
        });

        addTagInput.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            const val = addTagInput.value.trim();
            if (
              val &&
              !((userTags[mapKey] || []).includes(val) || (map.tags || []).includes(val))
            ) {
              onTagAdd(map, val);
              addTagInput.value = '';
            }
          }
        });
        tagsContainer.appendChild(addTagInput);
      }
    });
  }

  // --- DOM FINDERS ---
  function findGridContainer() {
    return document.querySelector('div[class*="grid_grid__"]');
  }

  function findMapTeaserElements(grid) {
    return Array.from(grid.querySelectorAll('li > a[class*="map-teaser_mapTeaser__"]'));
  }

  function findTagsContainer(mapTeaser) {
    return mapTeaser.querySelector('div[class*="map-teaser_tagsContainer__"]');
  }

  // --- CSS ---
  function injectStaticTagStyle() {
    if (document.getElementById('liked-maps-tag-style')) return;
    const style = document.createElement('style');
    style.id = 'liked-maps-tag-style';
    style.textContent = `
    .lmao-map-teaser_tag {
      border: .0625rem solid var(--ds-color-white-40);
      border-radius: .3125rem;
      font-size: .8125rem;
      font-style: italic;
      line-height: .875rem;
      padding: .125rem .5rem .25rem;
      text-transform: capitalize;
      margin-right: 0.25em;
      background: rgba(0,0,0,0.2);
    }

    .lmao-map-teaser_tag.api-tag {
      color: var(--ds-color-white-60);
      border-color: var(--ds-color-white-40);
      background: rgba(0,0,0,0.2);
    }

    .lmao-map-teaser_tag.user-tag {
      color: #fff;
      border-color: #ffb347;
      background: rgba(255,179,71,0.15);
    }

    .lmao-map-teaser_tag.lmao-learnable-meta {
      border-color: var(--ds-color-white-40);
      background:rgba(76, 175, 80, 0.30);
    }
    .lmao-tag-remove-btn {
      margin-left: 0.2em;
      font-size: 1em;
      color: #ffffff;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0 0.2em;
    }

    .lmao-tag-input {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background: 0.75rem;
      border: 0;
      border-radius: .5rem;
      box-shadow: inset 0 0 0.0625rem 0 hsla(0, 0%, 100%, .9);
      box-sizing: border-box;
      color: #fff;
      font-family: var(--default-font);
      font-size: 0.875rem;
      outline: none;
      padding: 0.75rem 0.75rem;
      resize: none;
      width: auto;
    }

    .lmao-controls {
      margin: 0 1rem 0 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 220px;
      background: rgb(16 16 28/80%);
      padding: 1em;
      z-index: 1000;
      border-radius: 1rem;
    }

    .lmao-collapsible-tag-group {
      margin-bottom: 0.5rem;
    }

    .lmao-collapsible-header {
      font-size: var(--font-size-16);
      font-weight: bold;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
    }

    .lmao-collapsible-arrow {
      margin-right: 0.3em;
    }

    .lmao-collapsible-tags {
      display: flex;
      flex-direction: column;
    }

    .lmao-collapsible-tags.lmao-collapsed {
      display: none;
    }

    .lmao-collapsible-tag-label {
      margin: 0.2em 0;
    }

    .lmao-tag-visibility-toggles {
      display: flex;
      flex-direction: column;
      gap: 0.2em;
    }

    .lmao-controls-header {
      margin-top: 0.75rem;
      margin-bottom: 0.25rem;
      font-size: var(--font-size-18);
    }

    .lmao-checkbox-input {
      border: .0625rem solid #ddd;
      box-sizing: border-box;
      outline: none;
      padding: .625rem;
    }

    .lmao-checkbox-mark {
      background: var(--ds-color-purple-100);
      border-radius: .25rem;
      box-shadow: var(--shadow-1);
      left: 0;
      top: 0;
      border: .0625rem solid var(--ds-color-white-20);
    }
  `;
    document.head.appendChild(style);
  }

  // --- MAIN ---
  async function init() {
    const userTags = loadUserTags();
    const maps = await fetchAllLikedMaps();
    // Group tags for filter UI
    const userTagsSet = new Set();
    const apiTagsSet = new Set();
    const metaTagsSet = new Set();

    maps.forEach((map) => {
      (userTags[getMapKey(map)] || []).forEach((t) => userTagsSet.add(t));
      (map.tags || []).forEach((t) => apiTagsSet.add(t));
      if (isLearnableMeta(getMapKey(map))) metaTagsSet.add('Learnable Meta');
      if (map.isUserMap === false) apiTagsSet.add('Official');
    });

    let userTagsList = Array.from(userTagsSet).sort();
    const apiTagsList = Array.from(apiTagsSet).sort();
    const metaTagsList = metaTagsSet.has('Learnable Meta') ? ['Learnable Meta'] : [];
    let selectedTags = [];
    let currentUserTags = { ...userTags };
    let tagVisibility = loadTagVisibility();
    let filterCollapse = loadFilterCollapse();
    let filterMode = 'ANY';
    let editMode = false;
    const grid = findGridContainer();
    if (!grid) return;

    const container = grid.closest('div[class*="container_content__"]');
    if (container) container.style.maxWidth = '100%';

    const likesMapDiv = grid.closest('div[class*="likes_map__"]');
    if (likesMapDiv) { likesMapDiv.style.display = 'flex'; likesMapDiv.marginTop = '1rem'; }

    let controlsDiv = document.getElementById('liked-maps-folders-controls');

    function rerender() {
      patchTeasersWithControls(
        maps,
        currentUserTags,
        selectedTags,
        tagVisibility,
        userTagsList,
        onTagAdd,
        onTagRemove,
        filterMode,
        editMode
      );
    }

    function onTagFilterChange(newTags) {
      selectedTags = newTags;
      rerender();
    }

    function onEditModeToggle(newEditMode) {
      editMode = newEditMode;
      rerender();
    }

    function onTagVisibilityChange(newVisibility) {
      tagVisibility = newVisibility;
      rerender();
    }

    function onFilterModeToggle(newMode) {
      filterMode = newMode;
      rerender();
    }

    function onCollapseChange(newCollapse) {
      filterCollapse = newCollapse;
      saveFilterCollapse(filterCollapse);
      rebuildControls();
    }

    function onTagAdd(map, tag) {
      const key = getMapKey(map);
      currentUserTags[key] = currentUserTags[key] || [];
      currentUserTags[key].push(tag);
      saveUserTags(currentUserTags);
      userTagsList = Array.from(new Set(Object.values(currentUserTags).flat())).sort();
      rebuildControls();
      rerender();
    }

    function onTagRemove(map, tag) {
      const key = getMapKey(map);
      currentUserTags[key] = (currentUserTags[key] || []).filter((t) => t !== tag);
      saveUserTags(currentUserTags);
      userTagsList = Array.from(new Set(Object.values(currentUserTags).flat())).sort();
      rebuildControls();
      rerender();
    }

    function rebuildControls() {
      const newControls = createControlsUI(
        userTagsList,
        apiTagsList,
        metaTagsList,
        selectedTags,
        onTagFilterChange,
        onEditModeToggle,
        tagVisibility,
        onTagVisibilityChange,
        onFilterModeToggle,
        filterCollapse,
        onCollapseChange,
        filterMode,
        editMode
      );
      newControls.id = 'liked-maps-folders-controls';
      if (controlsDiv) controlsDiv.replaceWith(newControls);
      else grid.parentNode.insertBefore(newControls, grid);
      controlsDiv = newControls;
    }
    if (!controlsDiv) rebuildControls();
    grid.style.flexGrow = '1';
    rerender();
  }

  /**
   * Checks if the current page is one where the script should activate.
   * @returns {boolean}
   */
  function isActivePage() {
    const { pathname, search } = window.location;
    if (pathname === '/me/likes') return true;
    if (pathname === '/maps/community') {
      const params = new URLSearchParams(search);
      return params.get('tab') === 'liked-maps';
    }
    return false;
  }

  // --- PAGE NAVIGATION HANDLING ---
  /**
   * Observe URL and DOM changes to trigger script activation on SPA navigation.
   */
  function observePageAndGrid() {
    let lastUrl = location.href;
    let gridInitialized = false;

    /**
     * Try to initialize the script if on the correct page and grid is present.
     */
    function tryInit() {
      if (!isActivePage()) {
        gridInitialized = false;
        return;
      }
      const grid = document.querySelector('div[class*="grid_grid__"]');
      if (grid && !gridInitialized) {
        gridInitialized = true;
        init();
      }
    }

    // Observe URL changes (pushState, replaceState, popstate)
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    history.pushState = function (...args) {
      origPushState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
    };

    history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
    };

    window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
    window.addEventListener('locationchange', () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        gridInitialized = false;
        tryInit();
      }
    });

    // Observe DOM changes for grid
    const observer = new MutationObserver(() => {
      tryInit();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check
    tryInit();
  }

  // --- WAIT FOR PAGE (MutationObserver version) ---
  const waitForLoad = async () => {
    while (!document.body) {
      await sleep(100);
    }
    observePageAndGrid();
  };

  waitForLoad();
})();
