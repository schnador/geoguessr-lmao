// ==UserScript==
// @name         GeoGuessr Liked Maps Advanced Overhaul (LMAO)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds folder organization to liked maps on GeoGuessr
// @author       snador
// @match        https://www.geoguessr.com/me/likes
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // --- LOCALSTORAGE KEYS ---
  const LOCALSTORAGE_USER_TAGS_KEY = "lmaoUserTags";
  const LOCALSTORAGE_TAG_VISIBILITY_KEY = "lmaoTagVisibility";
  const LOCALSTORAGE_FILTER_COLLAPSE_KEY = "lmaoFilterCollapse";
  const LOCALSTORAGE_GEOMETA_PREFIX = "geometa:map-info:";

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function fetchAllLikedMaps() {
    const allMaps = [];
    let paginationToken = null;
    let url = "https://www.geoguessr.com/api/v3/likes/maps?limit=50";

    while (true) {
      const res = await fetch(paginationToken ? ${url}&paginationToken=${encodeURIComponent(paginationToken)} : url, {
        credentials: "include", // ensures cookies (including _ncfa) are sent
      });

      if (!res.ok) {
        console.error("Failed to fetch liked maps:", res.status);
        break;
      }

      const data = await res.json();
      allMaps.push(...data.items);

      if (!data.paginationToken) break;
      paginationToken = data.paginationToken;
    }

    return allMaps;
  }

  function loadUserTags() {
    return JSON.parse(localStorage.getItem(LOCALSTORAGE_USER_TAGS_KEY) || "{}");
  }
  function saveUserTags(userTags) {
    localStorage.setItem(LOCALSTORAGE_USER_TAGS_KEY, JSON.stringify(userTags));
  }

  function loadTagVisibility() {
    try {
      return JSON.parse(localStorage.getItem(LOCALSTORAGE_TAG_VISIBILITY_KEY)) || { showUserTags: true, showApiTags: true, showLearnableMetaTags: true };
    } catch {
      return { showUserTags: true, showApiTags: true, showLearnableMetaTags: true };
    }
  }
  function saveTagVisibility(state) {
    localStorage.setItem(LOCALSTORAGE_TAG_VISIBILITY_KEY, JSON.stringify(state));
  }

  function loadFilterCollapse() {
    // { user: false, api: true, meta: false }
    try {
      return JSON.parse(localStorage.getItem(LOCALSTORAGE_FILTER_COLLAPSE_KEY)) || { user: false, api: true, meta: false };
    } catch {
      return { user: false, api: true, meta: false };
    }
  }
  function saveFilterCollapse(state) {
    localStorage.setItem(LOCALSTORAGE_FILTER_COLLAPSE_KEY, JSON.stringify(state));
  }

  function isLearnableMeta(mapId) {
    // Get geometa:map-info:<mapid>
    // TODO: implement API call to check if map is learnable meta if not found.
    let data = localStorage.getItem(LOCALSTORAGE_GEOMETA_PREFIX + mapId);
    if (!data) return false;
    try {
      const obj = JSON.parse(data);
      return obj && obj.mapFound === true;
    } catch {
      return false;
    }
  }

  function getAllTags(maps, userTags) {
    const tagSet = new Set();
    maps.forEach((map) => {
      (map.tags || []).forEach((t) => tagSet.add(t));
      (userTags[map.id] || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }

  // --- CONFIG ---
  const USER_TAG_CLASS = "lmao-map-teaser_tag user-tag";
  const API_TAG_CLASS = "lmao-map-teaser_tag api-tag";

  // --- UI STATE ---
  let editMode = false;
  let filterMode = "ANY"; // 'ANY' or 'ALL'

  // --- SETTINGS PERSISTENCE ---
  const TAG_VISIBILITY_KEY = "geoguessrLikedMapTagVisibility";
  function loadTagVisibility() {
    try {
      return JSON.parse(localStorage.getItem(TAG_VISIBILITY_KEY)) || { showUserTags: true, showApiTags: true };
    } catch {
      return { showUserTags: true, showApiTags: true };
    }
  }
  function saveTagVisibility(state) {
    localStorage.setItem(TAG_VISIBILITY_KEY, JSON.stringify(state));
  }

  // --- UI CONTROLS ---
  function createTagFilterUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onChange, filterCollapse, onCollapseChange) {
    const filterDiv = document.createElement("div");
    filterDiv.style.margin = "1rem 0";
    filterDiv.style.display = "flex";
    filterDiv.style.flexDirection = "column";

    const filtersTitle = document.createElement("strong");
    filtersTitle.textContent = "Filters";
    filtersTitle.style.marginBottom = "0.5rem";
    filterDiv.appendChild(filtersTitle);

    // Learnable Meta group
    filterDiv.appendChild(
      createCollapsibleTagGroup("Learnable Meta", metaTagsList, selectedTags, onChange, filterCollapse.meta, (collapsed) => {
        onCollapseChange({ ...filterCollapse, meta: collapsed });
      })
    );
    // User tags group
    filterDiv.appendChild(
      createCollapsibleTagGroup("User tags", userTagsList, selectedTags, onChange, filterCollapse.user, (collapsed) => {
        onCollapseChange({ ...filterCollapse, user: collapsed });
      })
    );
    // API tags group
    filterDiv.appendChild(
      createCollapsibleTagGroup("Default tags", apiTagsList, selectedTags, onChange, filterCollapse.api, (collapsed) => {
        onCollapseChange({ ...filterCollapse, api: collapsed });
      })
    );
    return filterDiv;
  }

  function createCollapsibleTagGroup(title, tags, selectedTags, onChange, collapsed, onCollapseToggle) {
    const groupDiv = document.createElement("div");
    groupDiv.style.marginBottom = "0.5rem";
    const header = document.createElement("div");
    header.style.fontWeight = "bold";
    header.style.cursor = "pointer";
    header.style.userSelect = "none";
    header.style.display = "flex";
    header.style.alignItems = "center";
    const arrow = document.createElement("span");
    arrow.textContent = collapsed ? "▶" : "▼";
    arrow.style.marginRight = "0.3em";
    header.appendChild(arrow);
    header.appendChild(document.createTextNode(title));
    header.onclick = () => {
      onCollapseToggle(!collapsed);
    };
    groupDiv.appendChild(header);
    const tagsDiv = document.createElement("div");
    tagsDiv.style.display = collapsed ? "none" : "flex";
    tagsDiv.style.flexDirection = "column";
    tags.forEach((tag) => {
      const label = document.createElement("label");
      label.style.margin = "0.2em 0";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = tag;
      cb.checked = selectedTags.includes(tag);
      cb.addEventListener("change", () => {
        if (cb.checked) selectedTags.push(tag);
        else selectedTags.splice(selectedTags.indexOf(tag), 1);
        onChange([...selectedTags]);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + tag));
      tagsDiv.appendChild(label);
    });
    groupDiv.appendChild(tagsDiv);
    return groupDiv;
  }

  function createFilterModeToggle(onToggle) {
    const div = document.createElement("div");
    div.style.margin = "0.5em 0";
    const labelAny = document.createElement("label");
    const radioAny = document.createElement("input");
    radioAny.type = "radio";
    radioAny.name = "lmao-filter-mode";
    radioAny.value = "ANY";
    radioAny.checked = filterMode === "ANY";
    radioAny.addEventListener("change", () => {
      if (radioAny.checked) {
        filterMode = "ANY";
        onToggle("ANY");
      }
    });
    labelAny.appendChild(radioAny);
    labelAny.appendChild(document.createTextNode(" Any tag"));
    const labelAll = document.createElement("label");
    labelAll.style.marginLeft = "1em";
    const radioAll = document.createElement("input");
    radioAll.type = "radio";
    radioAll.name = "lmao-filter-mode";
    radioAll.value = "ALL";
    radioAll.checked = filterMode === "ALL";
    radioAll.addEventListener("change", () => {
      if (radioAll.checked) {
        filterMode = "ALL";
        onToggle("ALL");
      }
    });
    labelAll.appendChild(radioAll);
    labelAll.appendChild(document.createTextNode(" All tags"));
    div.appendChild(labelAny);
    div.appendChild(labelAll);
    return div;
  }

  function createEditModeToggle(onToggle) {
    const div = document.createElement("div");
    div.style.margin = "0.5em 0";
    const label = document.createElement("label");
    label.style.cursor = "pointer";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = editMode;
    cb.addEventListener("change", () => {
      editMode = cb.checked;
      onToggle(editMode);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" Edit mode"));
    div.appendChild(label);
    return div;
  }

  function createTagVisibilityToggles(tagVisibility, onChange) {
    const div = document.createElement("div");
    div.style.margin = "0.5rem 0";
    // User tags
    const userLabel = document.createElement("label");
    userLabel.style.marginRight = "1em";
    const userCb = document.createElement("input");
    userCb.type = "checkbox";
    userCb.checked = tagVisibility.showUserTags;
    userCb.addEventListener("change", () => {
      tagVisibility.showUserTags = userCb.checked;
      saveTagVisibility(tagVisibility);
      onChange({ ...tagVisibility });
    });
    userLabel.appendChild(userCb);
    userLabel.appendChild(document.createTextNode(" Show user tags"));
    div.appendChild(userLabel);

    // API tags
    const apiLabel = document.createElement("label");
    apiLabel.style.marginRight = "1em";
    const apiCb = document.createElement("input");
    apiCb.type = "checkbox";
    apiCb.checked = tagVisibility.showApiTags;
    apiCb.addEventListener("change", () => {
      tagVisibility.showApiTags = apiCb.checked;
      saveTagVisibility(tagVisibility);
      onChange({ ...tagVisibility });
    });
    apiLabel.appendChild(apiCb);
    apiLabel.appendChild(document.createTextNode(" Show default tags"));
    div.appendChild(apiLabel);

    // Learnable meta tags
    const learnableMetaLabel = document.createElement("label");
    learnableMetaLabel.style.marginRight = "1em";
    const learnableMetaCb = document.createElement("input");
    learnableMetaCb.type = "checkbox";
    learnableMetaCb.checked = tagVisibility.showLearnableMetaTags;
    learnableMetaCb.addEventListener("change", () => {
      tagVisibility.showLearnableMetaTags = learnableMetaCb.checked;
      saveTagVisibility(tagVisibility);
      onChange({ ...tagVisibility });
    });
    learnableMetaLabel.appendChild(learnableMetaCb);
    learnableMetaLabel.appendChild(document.createTextNode(" Show learnable meta tags"));
    div.appendChild(learnableMetaLabel);
    div.appendChild(apiLabel);
    return div;
  }

  function createControlsUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onTagFilterChange, onEditModeToggle, tagVisibility, onTagVisibilityChange, onFilterModeToggle, filterCollapse, onCollapseChange) {
    const controlsDiv = document.createElement("div");
    controlsDiv.style.margin = "0 1rem 0 0";
    controlsDiv.style.display = "flex";
    controlsDiv.style.flexDirection = "column";
    controlsDiv.style.alignItems = "flex-start";
    controlsDiv.style.minWidth = "220px";
    controlsDiv.style.background = "rgb(16 16 28/80%)";
    controlsDiv.style.padding = "1em 1em 1em 1em";
    controlsDiv.style.zIndex = "1000";
    controlsDiv.style.borderRadius = "1rem 1rem 1rem 1rem";

    controlsDiv.appendChild(createEditModeToggle(onEditModeToggle));
    controlsDiv.appendChild(createFilterModeToggle(onFilterModeToggle));
    controlsDiv.appendChild(createTagFilterUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onTagFilterChange, filterCollapse, onCollapseChange));

    const tagVisibilityToggles = createTagVisibilityToggles(tagVisibility, onTagVisibilityChange);
    tagVisibilityToggles.style.display = "flex";
    tagVisibilityToggles.style.flexDirection = "column";
    tagVisibilityToggles.style.gap = "0.2em";

    const togglesTitle = document.createElement("strong");
    togglesTitle.textContent = "Tag Visibility";
    controlsDiv.appendChild(togglesTitle);
    controlsDiv.appendChild(tagVisibilityToggles);
    return controlsDiv;
  }

  // --- PATCH TEASERS ---
  function patchTeasersWithControls(maps, userTags, selectedTags, tagVisibility, userTagsList, onTagAdd, onTagRemove) {
    injectStaticTagStyle();
    const grid = findGridContainer();
    if (!grid) return;
    const teasers = findMapTeaserElements(grid);
    teasers.forEach((teaser) => {
      // Get map id from href
      const href = teaser.getAttribute("href");
      const idMatch = href && href.match(/\/maps\/([a-zA-Z0-9]+)/);
      if (!idMatch) return;
      const mapId = idMatch[1];
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      // Compute all tags (user, api, meta)
      const allTags = [...new Set([...(map.tags || []), ...(userTags[mapId] || [])])];
      if (isLearnableMeta(mapId) && !allTags.includes("Learnable Meta")) {
        allTags.push("Learnable Meta");
      }
      // Filter logic: hide if not matching selected tags
      if (selectedTags.length > 0) {
        if (filterMode === "ALL") {
          // AND: must have all selected tags
          if (!selectedTags.every((tag) => allTags.includes(tag))) {
            teaser.closest("li").style.display = "none";
            return;
          }
        } else {
          // ANY: must have at least one
          if (!selectedTags.some((tag) => allTags.includes(tag))) {
            teaser.closest("li").style.display = "none";
            return;
          }
        }
      }
      teaser.closest("li").style.display = "";
      const tagsContainer = findTagsContainer(teaser);
      if (!tagsContainer) return;
      // Remove only our own controls
      tagsContainer.querySelectorAll(".lmao-map-teaser_tag, .lmao-tag-input").forEach((e) => e.remove());
      // Hide or show native API tags based on toggle (do not use random classnames)
      Array.from(tagsContainer.children).forEach((child) => {
        if (child.tagName === "DIV" && child.className && child.className.includes("map-teaser_tag") && !child.className.includes("user-tag") && !child.className.includes("api-tag") && !child.className.includes("lmao-tag-input")) {
          child.style.display = tagVisibility.showApiTags ? "" : "none";
        }

        child.style.cursor = "default";

        // Make unclickable (stop link navigation)
        child.addEventListener(
          "mousedown",
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        child.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
      });
      // Add user tags if enabled
      if (tagVisibility.showUserTags) {
        (userTags[mapId] || []).forEach((tag) => {
          const tagDiv = document.createElement("span");
          tagDiv.className = USER_TAG_CLASS;
          tagDiv.style.cursor = "default";
          tagDiv.setAttribute("data-lmao-usertag", "1");
          tagDiv.textContent = tag;
          // Make unclickable (stop link navigation), but allow rmBtn
          tagDiv.addEventListener(
            "mousedown",
            (e) => {
              if (e.target === tagDiv) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            true
          );
          tagDiv.addEventListener(
            "click",
            (e) => {
              if (e.target === tagDiv) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            true
          );

          if (editMode) {
            // Remove button for user tags
            const rmBtn = document.createElement("button");
            rmBtn.textContent = "×";
            rmBtn.title = "Remove tag";
            rmBtn.style.marginLeft = "0.2em";
            rmBtn.style.fontSize = "1em";
            rmBtn.style.color = "#ffffff";
            rmBtn.style.cursor = "pointer";
            rmBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[LMAO] Removing tag", tag, "from map", map.id);
              onTagRemove(map, tag);
            };
            tagDiv.appendChild(rmBtn);
          }
          tagsContainer.appendChild(tagDiv);
        });
      }
      // Add Learnable Meta tag if present
      if (tagVisibility.showLearnableMetaTags && isLearnableMeta(mapId)) {
        const tagDiv = document.createElement("span");
        tagDiv.className = USER_TAG_CLASS + " lmao-learnable-meta";
        tagDiv.textContent = "Learnable Meta";
        tagDiv.style.cursor = "default";

        tagDiv.addEventListener(
          "mousedown",
          (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true
        );
        tagDiv.addEventListener(
          "click",
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
        // Create a datalist for user tags
        const datalistId = "lmao-user-tags-datalist";
        let datalist = document.getElementById(datalistId);
        if (!datalist) {
          datalist = document.createElement("datalist");
          datalist.id = datalistId;
          userTagsList.forEach((tag) => {
            const option = document.createElement("option");
            option.value = tag;
            datalist.appendChild(option);
          });
          document.body.appendChild(datalist);
        } else {
          // Update datalist options
          datalist.innerHTML = "";
          userTagsList.forEach((tag) => {
            const option = document.createElement("option");
            option.value = tag;
            datalist.appendChild(option);
          });
        }
        const addTagInput = document.createElement("input");
        addTagInput.placeholder = "Add tag";
        addTagInput.className = "lmao-tag-input";
        addTagInput.style.width = "7em";
        addTagInput.style.marginLeft = "0.5em";
        addTagInput.setAttribute("list", datalistId);
        // Prevent navigation on mousedown/click only, but allow focus
        ["mousedown", "click"].forEach((evt) => {
          addTagInput.addEventListener(evt, (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.target.focus();
          });
        });
        // Filter datalist as user types (case-insensitive)
        addTagInput.addEventListener("input", function () {
          const val = addTagInput.value.toLowerCase();
          datalist.innerHTML = "";
          userTagsList
            .filter((tag) => tag.toLowerCase().startsWith(val))
            .forEach((tag) => {
              const option = document.createElement("option");
              option.value = tag;
              datalist.appendChild(option);
            });
        });
        addTagInput.addEventListener("keydown", (e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            const val = addTagInput.value.trim();
            if (val && !((userTags[mapId] || []).includes(val) || (map.tags || []).includes(val))) {
              console.log("[LMAO] Adding tag", val, "to map", map.id);
              onTagAdd(map, val);
              addTagInput.value = "";
            }
          }
        });
        tagsContainer.appendChild(addTagInput);
      }
    });
  }

  // Utility: Find the grid container by partial class name
  function findGridContainer() {
    // Looks for a div with a class containing 'grid_grid__'
    const grid = document.querySelector('div[class*="grid_grid__"]');
    if (!grid) {
      // Debug: log all divs with class containing 'grid_'
      const allGridDivs = Array.from(document.querySelectorAll('div[class*="grid_"]'));
      console.log(
        "[LMAO] No grid_grid__ found. Found these grid-like divs:",
        allGridDivs.map((div) => div.className)
      );
    }
    return grid;
  }

  // Utility: Find all map teaser elements in the grid
  function findMapTeaserElements(grid) {
    // Looks for li > a with class containing 'map-teaser_mapTeaser__'
    return Array.from(grid.querySelectorAll('li > a[class*="map-teaser_mapTeaser__"]'));
  }

  // Utility: Find the tags container in a map teaser
  function findTagsContainer(mapTeaser) {
    // Looks for a div with class containing 'map-teaser_tagsContainer__'
    return mapTeaser.querySelector('div[class*="map-teaser_tagsContainer__"]');
  }

  // --- CSS ---
  function injectStaticTagStyle() {
    if (document.getElementById("liked-maps-tag-style")) return;
    const style = document.createElement("style");
    style.id = "liked-maps-tag-style";
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
        `;
    document.head.appendChild(style);
  }

  // --- MAIN ---
  async function init() {
    console.log("[LMAO] Initializing");
    const userTags = loadUserTags();
    const maps = await fetchAllLikedMaps();
    // Group tags for filter UI
    const userTagsSet = new Set();
    const apiTagsSet = new Set();
    const metaTagsSet = new Set();
    maps.forEach((map) => {
      (userTags[map.id] || []).forEach((t) => userTagsSet.add(t));
      (map.tags || []).forEach((t) => apiTagsSet.add(t));
      if (isLearnableMeta(map.id)) metaTagsSet.add("Learnable Meta");
    });
    let userTagsList = Array.from(userTagsSet).sort();
    const apiTagsList = Array.from(apiTagsSet).sort();
    const metaTagsList = metaTagsSet.has("Learnable Meta") ? ["Learnable Meta"] : [];
    let selectedTags = [];
    let currentUserTags = { ...userTags };
    let tagVisibility = loadTagVisibility();
    let filterCollapse = loadFilterCollapse();
    // Find the grid
    const grid = findGridContainer();
    if (!grid) {
      console.warn("[LMAO] Could not find main grid");
      return;
    }
    // Patch parent likes_map__ container to display:flex
    const likesMapDiv = grid.closest('div[class*="likes_map__"]');
    if (likesMapDiv) {
      likesMapDiv.style.display = "flex";
    }
    // Insert controls as a sidebar
    let controlsDiv = document.getElementById("liked-maps-folders-controls");
    if (!controlsDiv) {
      controlsDiv = createControlsUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onTagFilterChange, onEditModeToggle, tagVisibility, onTagVisibilityChange, onFilterModeToggle, filterCollapse, onCollapseChange);
      controlsDiv.id = "liked-maps-folders-controls";
      grid.parentNode.insertBefore(controlsDiv, grid);
    }

    // Make grid take up full width (flex-grow: 1)
    grid.style.flexGrow = "1";
    function rerender() {
      console.log("[LMAO] Rerendering UI");
      patchTeasersWithControls(maps, currentUserTags, selectedTags, tagVisibility, userTagsList, onTagAdd, onTagRemove);
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
      // Rebuild controls UI to update collapse state and reattach all handlers
      const newControls = createControlsUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onTagFilterChange, onEditModeToggle, tagVisibility, onTagVisibilityChange, onFilterModeToggle, filterCollapse, onCollapseChange);
      newControls.id = "liked-maps-folders-controls";
      controlsDiv.replaceWith(newControls);
      controlsDiv = newControls;
    }
    function onTagAdd(map, tag) {
      currentUserTags[map.id] = currentUserTags[map.id] || [];
      currentUserTags[map.id].push(tag);
      saveUserTags(currentUserTags);
      // Update userTagsList and re-render controls
      userTagsList = Array.from(new Set(Object.values(currentUserTags).flat())).sort();
      const newControls = createControlsUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onTagFilterChange, onEditModeToggle, tagVisibility, onTagVisibilityChange, onFilterModeToggle, filterCollapse, onCollapseChange);
      newControls.id = "liked-maps-folders-controls";
      controlsDiv.replaceWith(newControls);
      controlsDiv = newControls;
      rerender();
    }

    function onTagRemove(map, tag) {
      currentUserTags[map.id] = (currentUserTags[map.id] || []).filter((t) => t !== tag);
      saveUserTags(currentUserTags);
      // Update userTagsList and re-render controls
      userTagsList = Array.from(new Set(Object.values(currentUserTags).flat())).sort();
      const newControls = createControlsUI(userTagsList, apiTagsList, metaTagsList, selectedTags, onTagFilterChange, onEditModeToggle, tagVisibility, onTagVisibilityChange, onFilterModeToggle, filterCollapse, onCollapseChange);
      newControls.id = "liked-maps-folders-controls";
      controlsDiv.replaceWith(newControls);
      controlsDiv = newControls;
      rerender();
    }
    rerender();
  }

  // --- PAGE NAVIGATION HANDLING ---
  function setupPageNavigationWatcher() {
    let lastUrl = location.href;
    const check = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        if (location.pathname === "/me/likes") {
          setTimeout(init, 500);
        }
      }
    };
    setInterval(check, 500);
  }

  // Wait for the page content to settle
  const waitForLoad = async () => {
    console.log("[LMAO] Waiting for grid container");
    while (!document.body || !document.querySelector("#_next") || !document.querySelector('div[class*="grid_grid_"]')) {
      await sleep(300);
    }
    console.log("[LMAO] Grid container found, initializing...");
    init();
    setupPageNavigationWatcher();
  };

  waitForLoad();
})();