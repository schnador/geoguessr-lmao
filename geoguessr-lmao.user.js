// ==UserScript==
// @name         GeoGuessr Liked Maps Advanced Overhaul (LMAO)
// @namespace    https://github.com/schnador/
// @version      1.0.0
// @description  Adds organization to liked maps on GeoGuessr. Add tags and filter them. Integrates with Learnable Meta!
// @author       snador
// @icon         https://github.com/schnador/geoguessr-lmao/raw/main/img/lmao_icon.png
// @downloadURL  https://github.com/schnador/geoguessr-lmao/raw/refs/heads/main/geoguessr-lmao.user.js
// @updateURL    https://github.com/schnador/geoguessr-lmao/raw/refs/heads/main/geoguessr-lmao.user.js
// @match        https://www.geoguessr.com/*
// @connect      learnablemeta.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // --- STYLE INJECTION ---
  ((css) => {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
    } else {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  })(`
    .lmao-full-width-container {
      width: 100%;
      min-width: 100%;
      margin: 0;
    }
    .lmao-likes-container {
      flex: 1;
      min-width: 0;
    }
    .lmao-map-teaser_tag {
      border: .0625rem solid var(--ds-color-white-40);
      border-radius: .3125rem;
      font-size: .8125rem;
      font-style: italic;
      line-height: .875rem;
      padding: .125rem .5rem .25rem;
      text-transform: capitalize;
      background: rgba(0,0,0,0.2);
      max-height: 25px;
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
    .lmao-map-teaser_tag.lmao-region {
      border-color: var(--ds-color-white-40);
      background:rgba(108, 185, 40, 0.30);
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
      max-height: 25px;
      display: block;
      margin-top: 0.25em;
      flex-basis: 100%;
      margin-right: 2rem;
    }
    .lmao-controls {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 15rem;
      min-width: 15rem;
      background: rgb(16 16 28/80%);
      padding: 1em;
      z-index: 1000;
      border-radius: 1rem;
      height: min-content;
      position: sticky;
      top: 2rem;
      max-height: calc(100vh - 4rem);
      overflow-y: auto;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      margin-right: 1rem;
      flex-shrink: 0;
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
      margin-left: 0.25rem;
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
    .lmao-loading-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2em;
      width: 100%;
    }
    .lmao-loading-indicator-text {
      font-size: 1.25em;
    }
    .map-teaser_mapTitleAndTags__iiqiz {
      padding-right: 0.125rem;
    }
    .lmao-settings-button {
      background: var(--ds-color-purple-100);
      border: 1px solid var(--ds-color-white-20);
      border-radius: 0.25rem;
      color: white;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      margin-top: 0.5rem;
      width: 100%;
    }
    .lmao-settings-button:hover {
      background: var(--ds-color-purple-80);
    }
    .lmao-file-input {
      display: none;
    }
    .lmao-clear-filters-button {
      background: var(--ds-color-red-100);
      border: 1px solid var(--ds-color-white-20);
      border-radius: 0.25rem;
      color: white;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
      width: 100%;
    }
    .lmao-clear-filters-button:hover {
      background: var(--ds-color-red-80);
    }
    .lmao-default-bottom-margin {
      margin-bottom: 0.5rem;
    }
    .lmao-no-left-margin {
      margin-left: 0;
    }
    .lmao-header-controls {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      z-index: 1000;
    }
    .lmao-header-button {
      background: var(--ds-color-purple-100);
      border: 1px solid var(--ds-color-white-20);
      border-radius: 0.25rem;
      color: white;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.375rem 0.5rem;
      white-space: nowrap;
    }
    .lmao-header-button:hover {
      background: var(--ds-color-purple-80);
    }
    .lmao-header-button.lmao-clear-button {
      background: var(--ds-color-red-100);
    }
    .lmao-header-button.lmao-clear-button:hover {
      background: var(--ds-color-red-80);
    }
    .lmao-header-search-placeholder {
      width: 200px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.25rem;
      border: 1px solid var(--ds-color-white-20);
      opacity: 0.5;
    }
    .lmao-header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-left: auto;
    }
    .lmao-settings-dropdown {
      position: relative;
      display: inline-block;
    }
    .lmao-settings-dropdown-content {
      display: none;
      position: absolute;
      right: 0;
      background: rgb(16 16 28/95%);
      min-width: 160px;
      border-radius: 0.5rem;
      border: 1px solid var(--ds-color-white-20);
      z-index: 1001;
      backdrop-filter: blur(10px);
    }
    .lmao-settings-dropdown-content.show {
      display: block;
    }
    .lmao-settings-dropdown-item {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.75rem 1rem;
      width: 100%;
      text-align: left;
      border-radius: 0;
    }
    .lmao-settings-dropdown-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .lmao-settings-dropdown-item:first-child {
      border-radius: 0.5rem 0.5rem 0 0;
    }
    .lmao-settings-dropdown-item:last-child {
      border-radius: 0 0 0.5rem 0.5rem;
    }
    .lmao-header-wrapper {
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
      margin-bottom: 1rem !important;
      position: relative;
    }
    .lmao-header-wrapper h1[class*="headline_heading__"] {
      margin: 0 !important;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    .lmao-header-wrapper .lmao-header-actions {
      margin-left: auto;
      flex-shrink: 0;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      z-index: 1;
    }
    .lmao-header-actions .lmao-header-button {
      white-space: nowrap;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
    }
  `);

  var _GM_xmlhttpRequest = /* @__PURE__ */ (() =>
    typeof GM_xmlhttpRequest != 'undefined' ? GM_xmlhttpRequest : void 0)();
  var _unsafeWindow = /* @__PURE__ */ (() =>
    typeof unsafeWindow != 'undefined' ? unsafeWindow : void 0)();

  // --- CONFIGURATION OBJECT ---
  /**
   * Central configuration for LMAO userscript.
   */
  const CONFIG = {
    version: GM_info.script.version ? GM_info.script.version : 'unknown',
    features: {
      debugMode: true
    }
    // validPaths: ['/me/likes', '/maps/community'],
    // validTabs: [undefined, 'liked-maps']
  };

  /**
   * Debug logger for LMAO. Uses console.trace to print the calling function name automatically.
   * @param {...any} args
   */
  function debugLog(...args) {
    if (CONFIG.features.debugMode) {
      // Get the calling function name from the stack
      const stack = new Error().stack;
      let fnName = 'unknown';
      if (stack) {
        const lines = stack.split('\n');
        // The third line is usually the caller (first is Error, second is debugLog)
        if (lines.length > 2) {
          const match = lines[2].match(/at (\w+)/);
          if (match) fnName = match[1];
        }
      }
      console.log(`[LMAO] ${fnName}:`, ...args);
    }
  }

  // --- CONSTANTS & LOCALSTORAGE KEYS ---
  const LOCALSTORAGE_INTERNAL_CONFIG = 'lmaoDevConfig';
  const LOCALSTORAGE_USER_TAGS_KEY = 'lmaoUserTags';
  const LOCALSTORAGE_TAG_VISIBILITY_KEY = 'lmaoTagVisibility';
  const LOCALSTORAGE_FILTER_COLLAPSE_KEY = 'lmaoFilterCollapse';
  const LOCALSTORAGE_SELECTED_TAGS_KEY = 'lmaoSelectedTags';
  const LOCALSTORAGE_ADDITIONAL_MAP_INFO = 'lmaoAdditionalMapInfo';
  const LOCALSTORAGE_GEOMETA_PREFIX = 'geometa:map-info:';
  const USER_TAG_CLASS = 'lmao-map-teaser_tag user-tag';
  const API_TAG_CLASS = 'lmao-map-teaser_tag api-tag';

  // --- GLOBAL STATE ---
  const AppState = {
    maps: [],
    userTagsList: [],
    apiTagsList: [],
    metaTagsList: [],
    selectedTags: [],
    currentUserTags: {},
    tagVisibility: {},
    filterCollapse: {},
    filterMode: 'ALL',
    editMode: false,
    learnableMetaCache: new Set(),
    metaRegionCache: {},
    controlsDiv: null,

    // State management methods
    updateSelectedTags(newTags) {
      this.selectedTags = newTags;
      saveSelectedTags(this.selectedTags);
      this.rebuildControls();
      this.rerender();
    },

    updateTagVisibility(newVisibility) {
      this.tagVisibility = { ...newVisibility };
      saveTagVisibility(this.tagVisibility);
      this.rerender();
    },

    updateFilterCollapse(newCollapse) {
      this.filterCollapse = newCollapse;
      saveFilterCollapse(this.filterCollapse);
      this.rebuildControls();
    },

    updateFilterMode(newMode) {
      this.filterMode = newMode;
      this.rerender();
    },

    updateEditMode(newMode) {
      this.editMode = newMode;
      this.rerender();
    },

    addUserTag(map, tag) {
      const key = getMapKey(map);
      this.currentUserTags[key] = this.currentUserTags[key] || [];
      this.currentUserTags[key].push(tag);
      saveUserTags(this.currentUserTags);
      this.userTagsList = Array.from(new Set(Object.values(this.currentUserTags).flat())).sort();
      this.rebuildControls();
      this.rerender();
    },

    removeUserTag(map, tag) {
      const key = getMapKey(map);
      this.currentUserTags[key] = (this.currentUserTags[key] || []).filter((t) => t !== tag);
      saveUserTags(this.currentUserTags);
      this.userTagsList = Array.from(new Set(Object.values(this.currentUserTags).flat())).sort();
      this.rebuildControls();
      this.rerender();
    },

    rebuildControls() {
      const newControls = createControlsUI();

      // Find the proper container for the sidebar
      // We want to insert it into the likes_map div so it's a sibling of the grid
      const grid = findGridContainer();
      let targetContainer = null;

      if (grid) {
        const likesMapDiv = grid.closest('div[class*="likes_map__"]');
        if (likesMapDiv) {
          targetContainer = likesMapDiv;
          console.log('[LMAO] Using likes_map div as target container');
        }
      }

      if (!targetContainer) {
        targetContainer = findFullHeightContainer();
        console.log('[LMAO] Falling back to main container');
      }

      if (!targetContainer) {
        console.log('[LMAO] No suitable container found for sidebar');
        return;
      }

      newControls.id = 'liked-maps-filter-controls';

      if (this.controlsDiv) {
        this.controlsDiv.replaceWith(newControls);
      } else {
        // Insert the sidebar at the beginning of the container
        if (targetContainer.firstChild) {
          targetContainer.insertBefore(newControls, targetContainer.firstChild);
        } else {
          targetContainer.appendChild(newControls);
        }
      }

      this.controlsDiv = newControls;
      console.log('[LMAO] Sidebar inserted into:', targetContainer);

      // Add header actions
      this.addHeaderActions();
    },

    addHeaderActions() {
      // Check if wrapper already exists
      const existingWrapper = document.querySelector('.lmao-header-wrapper');
      if (existingWrapper) {
        console.log('[LMAO] Header wrapper already exists, skipping');
        return;
      }

      // Find the header area
      const heading = findHeading();
      if (!heading) {
        console.log('[LMAO] Heading not found');
        return;
      }

      // Check if heading is already inside a wrapper (safety check)
      if (heading.closest('.lmao-header-wrapper')) {
        console.log('[LMAO] Heading already in wrapper, skipping');
        return;
      }

      console.log('[LMAO] Found heading:', heading);

      // Create wrapper div
      const headerWrapper = document.createElement('div');
      headerWrapper.className = 'lmao-header-wrapper';
      headerWrapper.style.display = 'flex';
      headerWrapper.style.alignItems = 'center';
      headerWrapper.style.justifyContent = 'space-between';
      headerWrapper.style.width = '100%';
      headerWrapper.style.marginBottom = '1rem';

      // Create and add header actions
      const headerActions = createHeaderActions();

      // Remove h1 from its current position and add to wrapper
      const parent = heading.parentElement;
      if (parent) {
        console.log('[LMAO] Creating header wrapper');

        // Insert wrapper where h1 was
        parent.insertBefore(headerWrapper, heading);

        // Move h1 into wrapper
        headerWrapper.appendChild(heading);

        // Add header actions to wrapper
        headerWrapper.appendChild(headerActions);

        console.log('[LMAO] Header wrapper created with h1 and actions');
      } else {
        console.log('[LMAO] No parent found for heading');
      }
    },

    rerender() {
      patchTeasersWithControls();
    }
  };

  // --- UTILS ---
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getMapKey(map) {
    return map.id;
  }

  function getMapByTeaserHref(maps, href) {
    const idMatch = href && href.match(/\/maps\/([^/?#]+)/);
    if (!idMatch) return null;
    const mapIdOrSlug = idMatch[1];
    // Try to find by id or by slug
    return maps.find((m) => m.id === mapIdOrSlug || m.slug === mapIdOrSlug) || null;
  }

  function saveDevConfig() {
    _unsafeWindow.localStorage.setItem(LOCALSTORAGE_INTERNAL_CONFIG, JSON.stringify(CONFIG));
  }

  /**
   * Fetches map info from the Learnable Meta API.
   * @param {string} url - The API endpoint URL
   * @returns {Promise<Object>} - The map info object
   */
  async function fetchMapInfo(url) {
    debugLog('fetching map info from API with URL', url);
    return new Promise((resolve, reject) => {
      if (typeof _GM_xmlhttpRequest !== 'function') {
        console.error('GM_xmlhttpRequest is not available');
        reject(
          'GM_xmlhttpRequest is not available, please use Version 4.0+ of Tampermonkey or Violentmonkey'
        );
        return;
      }
      _GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: (response) => {
          debugLog('onload', url, response.status);
          if (response.status === 200 || response.status === 404) {
            try {
              const mapInfo = JSON.parse(response.responseText);
              debugLog('fetched map info', mapInfo);
              resolve(mapInfo);
            } catch (e) {
              console.error('failed to parse map info response', e);
              reject('Failed to parse response');
            }
          } else {
            console.error('failed to fetch map info', response);
            reject(`HTTP error! status: ${response.status}`);
          }
        },
        onerror: () => {
          console.error('onerror');
          reject('An error occurred while fetching data');
        }
      });
    });
  }

  /**
   * Gets map info from localStorage or Learnable Meta API.
   * @param {string} geoguessrId - The map ID
   * @param {boolean} [forceUpdate=false] - Force API fetch
   * @returns {Promise<Object>} - The map info object
   */
  async function getMapInfo(geoguessrId, forceUpdate = false) {
    const localStorageMapInfoKey = `${LOCALSTORAGE_GEOMETA_PREFIX}${geoguessrId}`;
    if (!forceUpdate) {
      const savedMapInfo = _unsafeWindow.localStorage.getItem(localStorageMapInfoKey);
      if (savedMapInfo) {
        const mapInfoFromLocalStorage = JSON.parse(savedMapInfo);
        debugLog('loaded from localStorage', mapInfoFromLocalStorage);
        return mapInfoFromLocalStorage;
      }
    }
    const url = `https://learnablemeta.com/api/userscript/map/${geoguessrId}`;
    const mapInfo = await fetchMapInfo(url);
    _unsafeWindow.localStorage.setItem(localStorageMapInfoKey, JSON.stringify(mapInfo));
    return mapInfo;
  }

  /**
   * Fetches and caches Learnable Meta status for a map during initialization.
   * @param {string} mapId - The map ID
   * @returns {Promise<boolean>} - True if Learnable Meta, else false
   */
  async function fetchAndCacheLearnableMeta(mapId) {
    try {
      const mapInfo = await getMapInfo(mapId);
      return mapInfo && mapInfo.mapFound === true;
    } catch (err) {
      debugLog('error', err);
      return false;
    }
  }

  /**
   * Synchronously checks if a map is Learnable Meta using local cache or localStorage.
   * @param {string} mapId - The map ID
   * @param {Set<string>} [learnableMetaCache] - Optional cache set
   * @returns {boolean}
   */
  function isLearnableMetaFromCacheOrLocalStorage(mapId, learnableMetaCache) {
    if (learnableMetaCache && learnableMetaCache.has(mapId)) return true;
    const data = _unsafeWindow.localStorage.getItem(LOCALSTORAGE_GEOMETA_PREFIX + mapId);
    if (!data) return false;
    try {
      const obj = JSON.parse(data);
      debugLog('loaded from localstorage', obj);
      return obj && obj.mapFound === true;
    } catch (err) {
      console.error('error parsing', err);
      return false;
    }
  }

  /**
   * Loads and updates region tags for all Learnable Meta maps at startup.
   * Only fetches regions for maps not present in the cache.
   *
   * @param {string[]} learnableMetaMapIds - Array of GeoGuessr map IDs
   * @returns {Promise<Object<string, string[]>>} Updated region cache
   * @example
   * const cache = await preloadMetaRegions(["abc123", "def456"]);
   * // cache["abc123"] might be ["south america"]
   */
  /**
   * Loads the region tag cache from localStorage.
   * @returns {Object<string, {regions: string[]}>} The region cache object
   */
  function loadMetaRegionCache() {
    try {
      const raw = _unsafeWindow.localStorage.getItem(LOCALSTORAGE_ADDITIONAL_MAP_INFO);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
      return {};
    } catch (e) {
      debugLog('Failed to load meta region cache', e);
      return {};
    }
  }

  /**
   * Saves the region tag cache to localStorage.
   * @param {Object<string, {regions: string[]}>} cache - The region cache object
   */
  function saveMetaRegionCache(cache) {
    try {
      _unsafeWindow.localStorage.setItem(LOCALSTORAGE_ADDITIONAL_MAP_INFO, JSON.stringify(cache));
    } catch (e) {
      debugLog('Failed to save meta region cache', e);
    }
  }

  /**
   * Fetches region tags for a map from the Learnable Meta API.
   * @param {string} mapId - The GeoGuessr map ID
   * @returns {Promise<string[]>} Array of region tags (may be empty)
   */
  async function fetchMetaRegionsFromAPI(mapId) {
    const url = `https://learnablemeta.com/api/maps?geoguessrId=${mapId}`;
    debugLog('Fetching meta regions from API', url);
    return new Promise((resolve, reject) => {
      if (typeof _GM_xmlhttpRequest !== 'function') {
        reject('GM_xmlhttpRequest is not available');
        return;
      }
      _GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: (response) => {
          if (response.status === 200) {
            try {
              const responseData = JSON.parse(response.responseText);
              const data = responseData[0] || {}; // should always be ONE item in the array
              debugLog('Meta regions response', data);
              if (Array.isArray(data.regions)) {
                console.log('[LMAO]  !!!! isArray:', data.regions);
                resolve(data.regions);
              } else {
                resolve([]);
              }
            } catch (e) {
              debugLog('Failed to parse meta regions response', e);
              resolve([]);
            }
          } else if (response.status === 404) {
            resolve([]);
          } else {
            reject(`HTTP error! status: ${response.status}`);
          }
        },
        onerror: () => {
          reject('An error occurred while fetching meta regions');
        }
      });
    });
  }

  /**
   * Loads and updates region tags for all Learnable Meta maps at startup.
   * Only fetches regions for maps not present in the cache.
   *
   * @param {string[]} learnableMetaMapIds - Array of GeoGuessr map IDs
   * @returns {Promise<Object<string, {regions: string[]}>>} Updated region cache
   * @example
   * const cache = await preloadMetaRegions(["abc123", "def456"]);
   * // cache["abc123"] might be { regions: ["south america"] }
   */
  async function preloadMetaRegions(learnableMetaMapIds) {
    const cache = loadMetaRegionCache();
    debugLog('Loaded meta region cache', cache);
    let updated = false;
    for (const mapId of learnableMetaMapIds) {
      if (!cache.hasOwnProperty(mapId)) {
        try {
          const regions = await fetchMetaRegionsFromAPI(mapId);
          if (regions?.length) {
            debugLog('Found regions for', mapId, regions);
            cache[mapId] = { regions };
            updated = true;
          }
        } catch (e) {
          debugLog('Failed to fetch regions for', mapId, e);
        }
      }
    }
    if (updated) saveMetaRegionCache(cache);
    return cache;
  }

  // --- LOCALSTORAGE STATE ---
  function loadUserTags() {
    return JSON.parse(_unsafeWindow.localStorage.getItem(LOCALSTORAGE_USER_TAGS_KEY) || '{}');
  }

  function saveUserTags(userTags) {
    debugLog(userTags);
    _unsafeWindow.localStorage.setItem(LOCALSTORAGE_USER_TAGS_KEY, JSON.stringify(userTags));
  }

  function loadTagVisibility() {
    const defaultTagVisibility = {
      showUserTags: true,
      showLearnableMetaTag: true,
      showRegionTags: true,
      showApiTags: false
    };

    try {
      return (
        JSON.parse(_unsafeWindow.localStorage.getItem(LOCALSTORAGE_TAG_VISIBILITY_KEY)) ||
        defaultTagVisibility
      );
    } catch (err) {
      debugLog('error', err);
      return defaultTagVisibility;
    }
  }

  function saveTagVisibility(state) {
    debugLog(state);
    _unsafeWindow.localStorage.setItem(LOCALSTORAGE_TAG_VISIBILITY_KEY, JSON.stringify(state));
  }

  function loadFilterCollapse() {
    try {
      return (
        JSON.parse(_unsafeWindow.localStorage.getItem(LOCALSTORAGE_FILTER_COLLAPSE_KEY)) || {
          user: false,
          api: true,
          meta: false
        }
      );
    } catch (err) {
      debugLog('error', err);
      return { user: false, api: true, meta: false };
    }
  }

  function saveFilterCollapse(state) {
    debugLog(state);
    _unsafeWindow.localStorage.setItem(LOCALSTORAGE_FILTER_COLLAPSE_KEY, JSON.stringify(state));
  }

  function loadSelectedTags() {
    try {
      return JSON.parse(_unsafeWindow.localStorage.getItem(LOCALSTORAGE_SELECTED_TAGS_KEY)) || [];
    } catch (err) {
      debugLog('error loading selected tags', err);
      return [];
    }
  }

  function saveSelectedTags(selectedTags) {
    debugLog('saving selected tags', selectedTags);
    _unsafeWindow.localStorage.setItem(
      LOCALSTORAGE_SELECTED_TAGS_KEY,
      JSON.stringify(selectedTags)
    );
  }

  // --- EXPORT/IMPORT FUNCTIONS ---
  function exportLMAOSettings() {
    const exportData = {
      version: CONFIG.version,
      exportDate: new Date().toISOString(),
      data: {}
    };

    // Collect all localStorage items that start with "lmao" (case-insensitive)
    for (let i = 0; i < _unsafeWindow.localStorage.length; i++) {
      const key = _unsafeWindow.localStorage.key(i);
      if (key && key.toLowerCase().startsWith('lmao')) {
        try {
          const value = _unsafeWindow.localStorage.getItem(key);
          exportData.data[key] = JSON.parse(value);
        } catch (e) {
          // If it's not JSON, store as string
          exportData.data[key] = _unsafeWindow.localStorage.getItem(key);
        }
      }
    }

    return exportData;
  }

  function downloadExportData() {
    try {
      const exportData = exportLMAOSettings();
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `lmao-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      debugLog('Settings exported successfully');
    } catch (error) {
      console.error('[LMAO] Failed to export settings:', error);
      alert('Failed to export settings. Check console for details.');
    }
  }

  function importLMAOSettings(importData) {
    try {
      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error('Invalid import data format');
      }

      // Import only LMAO-specific localStorage keys
      Object.keys(importData.data).forEach((key) => {
        if (key.toLowerCase().startsWith('lmao')) {
          const value =
            typeof importData.data[key] === 'object'
              ? JSON.stringify(importData.data[key])
              : importData.data[key];
          _unsafeWindow.localStorage.setItem(key, value);
        }
      });

      debugLog('Settings imported successfully');
      alert('Settings imported successfully! Please refresh the page to see changes.');
    } catch (error) {
      console.error('[LMAO] Failed to import settings:', error);
      alert('Failed to import settings. Please check the file format.');
    }
  }

  function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importData = JSON.parse(e.target.result);
        importLMAOSettings(importData);
      } catch (error) {
        console.error('[LMAO] Failed to parse import file:', error);
        alert('Invalid file format. Please select a valid LMAO settings file.');
      }
    };
    reader.readAsText(file);
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
  function createCheckbox(labelText, checked, onChange, classList = null) {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    if (classList) {
      cb.classList = classList;
    }

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
      createCheckbox('Show learnable meta tag', tagVisibility.showLearnableMetaTag, (checked) => {
        tagVisibility.showLearnableMetaTag = checked;
        saveTagVisibility(tagVisibility);
        onChange({ ...tagVisibility });
      })
    );

    div.appendChild(
      createCheckbox('Show user tags', tagVisibility.showUserTags, (checked) => {
        tagVisibility.showUserTags = checked;
        saveTagVisibility(tagVisibility);
        onChange({ ...tagVisibility });
      })
    );

    div.appendChild(
      createCheckbox('Show region tags', tagVisibility.showRegionTags, (checked) => {
        tagVisibility.showRegionTags = checked;
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

  function createControlsUI() {
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
          { value: 'ALL', label: 'All tags' },
          { value: 'ANY', label: 'Any tag' }
        ],
        AppState.filterMode,
        'lmao-filter-mode',
        (newMode) => AppState.updateFilterMode(newMode)
      )
    );
    controlsDiv.appendChild(header('Filter'));

    // Show Learnable Meta checkbox (without header) if user has learnable meta maps
    const hasLearnableMeta = AppState.learnableMetaCache.size > 0;
    if (hasLearnableMeta) {
      const learnableMetaCheckbox = createCheckbox(
        'Learnable Meta',
        AppState.selectedTags.includes('Learnable Meta'),
        (checked) => {
          const newTags = checked
            ? [...AppState.selectedTags, 'Learnable Meta']
            : AppState.selectedTags.filter((tag) => tag !== 'Learnable Meta');
          AppState.updateSelectedTags(newTags);
        },
        ['lmao-no-left-margin']
      );
      learnableMetaCheckbox.className = 'lmao-default-bottom-margin';
      controlsDiv.appendChild(learnableMetaCheckbox);
    }

    controlsDiv.appendChild(
      createCollapsibleTagGroup(
        'User tags',
        AppState.userTagsList,
        AppState.selectedTags,
        (newTags) => AppState.updateSelectedTags(newTags),
        AppState.filterCollapse.user,
        (c) => AppState.updateFilterCollapse({ ...AppState.filterCollapse, user: c })
      )
    );

    // Show Regions section only if user has learnable meta maps and there are region tags
    const regionTags = AppState.metaTagsList.filter((tag) => tag !== 'Learnable Meta');
    if (hasLearnableMeta && regionTags.length > 0) {
      controlsDiv.appendChild(
        createCollapsibleTagGroup(
          'Regions',
          regionTags,
          AppState.selectedTags,
          (newTags) => AppState.updateSelectedTags(newTags),
          AppState.filterCollapse.meta,
          (c) => AppState.updateFilterCollapse({ ...AppState.filterCollapse, meta: c })
        )
      );
    }

    controlsDiv.appendChild(
      createCollapsibleTagGroup(
        'Default tags',
        AppState.apiTagsList,
        AppState.selectedTags,
        (newTags) => AppState.updateSelectedTags(newTags),
        AppState.filterCollapse.api,
        (c) => AppState.updateFilterCollapse({ ...AppState.filterCollapse, api: c })
      )
    );
    controlsDiv.appendChild(header('Tag Visibility'));
    controlsDiv.appendChild(
      createTagVisibilityToggles(AppState.tagVisibility, (newVisibility) =>
        AppState.updateTagVisibility(newVisibility)
      )
    );
    controlsDiv.appendChild(header('Edit Mode'));
    controlsDiv.appendChild(
      createCheckbox('Edit tags', AppState.editMode, (newMode) => AppState.updateEditMode(newMode))
    );

    // Settings buttons moved to header - removed from sidebar

    return controlsDiv;
  }

  function createHeaderActions() {
    const headerActions = document.createElement('div');
    headerActions.className = 'lmao-header-actions';

    // Clear filters button
    const clearFiltersBtn = document.createElement('button');
    clearFiltersBtn.textContent = 'Clear Filters';
    clearFiltersBtn.className = 'lmao-header-button lmao-clear-button';
    clearFiltersBtn.onclick = () => AppState.updateSelectedTags([]);
    headerActions.appendChild(clearFiltersBtn);

    // Settings dropdown
    const settingsDropdown = document.createElement('div');
    settingsDropdown.className = 'lmao-settings-dropdown';

    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️'; // Cogwheel icon
    settingsBtn.className = 'lmao-header-button';
    settingsBtn.onclick = (e) => {
      e.stopPropagation();
      const dropdown = settingsDropdown.querySelector('.lmao-settings-dropdown-content');
      dropdown.classList.toggle('show');
    };

    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'lmao-settings-dropdown-content';

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Settings';
    exportBtn.className = 'lmao-settings-dropdown-item';
    exportBtn.onclick = () => {
      downloadExportData();
      dropdownContent.classList.remove('show');
    };

    // Import button and hidden file input
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import Settings';
    importBtn.className = 'lmao-settings-dropdown-item';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.className = 'lmao-file-input';
    fileInput.onchange = (e) => {
      handleImportFile(e);
      dropdownContent.classList.remove('show');
    };

    importBtn.onclick = () => fileInput.click();

    dropdownContent.appendChild(exportBtn);
    dropdownContent.appendChild(importBtn);
    settingsDropdown.appendChild(settingsBtn);
    settingsDropdown.appendChild(dropdownContent);
    settingsDropdown.appendChild(fileInput);

    headerActions.appendChild(settingsDropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsDropdown.contains(e.target)) {
        dropdownContent.classList.remove('show');
      }
    });

    return headerActions;
  }

  // --- PATCH TEASERS ---
  function patchTeasersWithControls() {
    const grid = findGridContainer();
    if (!grid) return;
    const teasers = findMapTeaserElements(grid);
    teasers.forEach((teaser) => {
      const href = teaser.getAttribute('href');
      const map = getMapByTeaserHref(AppState.maps, href);
      if (!map) return;

      const mapKey = getMapKey(map);
      // Compute all tags (user, api, meta)
      const allTags = [
        ...new Set([...(map.tags || []), ...(AppState.currentUserTags[mapKey] || [])])
      ];
      if (
        isLearnableMetaFromCacheOrLocalStorage(mapKey, AppState.learnableMetaCache) &&
        !allTags.includes('Learnable Meta')
      )
        allTags.push('Learnable Meta');
      if (map.isUserMap === false) allTags.push('Official');

      // Filter logic
      if (AppState.selectedTags.length > 0) {
        if (AppState.filterMode === 'ALL') {
          if (!AppState.selectedTags.every((tag) => allTags.includes(tag))) {
            teaser.closest('li').style.display = 'none';
            return;
          }
        } else {
          if (!AppState.selectedTags.some((tag) => allTags.includes(tag))) {
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
      if (AppState.tagVisibility.showApiTags && allTags.includes('Official')) {
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
          child.style.display = AppState.tagVisibility.showApiTags ? '' : 'none';
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

      // Add Learnable Meta tag if present
      if (
        AppState.tagVisibility.showLearnableMetaTag &&
        isLearnableMetaFromCacheOrLocalStorage(mapKey, AppState.learnableMetaCache)
      ) {
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

      // Add region tags if learnable meta
      if (
        AppState.tagVisibility.showRegionTags &&
        AppState.learnableMetaCache.has(mapKey) &&
        AppState.metaRegionCache &&
        AppState.metaRegionCache[mapKey] &&
        Array.isArray(AppState.metaRegionCache[mapKey].regions)
      ) {
        AppState.metaRegionCache[mapKey].regions.forEach((region) => {
          const tagDiv = document.createElement('span');
          tagDiv.className = USER_TAG_CLASS + ' lmao-region';
          tagDiv.textContent = region;
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
        });
      }

      // Add user tags if enabled
      if (AppState.tagVisibility.showUserTags) {
        (AppState.currentUserTags[mapKey] || []).forEach((tag) => {
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
          if (AppState.editMode) {
            const rmBtn = document.createElement('button');
            rmBtn.textContent = '×';
            rmBtn.title = 'Remove tag';
            rmBtn.className = 'lmao-tag-remove-btn';
            rmBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              debugLog('patchTeasersWithControls', 'Removing tag', tag, 'from map', map.id);
              AppState.removeUserTag(map, tag);
            };
            tagDiv.appendChild(rmBtn);
          }
          tagsContainer.appendChild(tagDiv);
        });
      }

      // Add tag input if in edit mode
      if (AppState.editMode) {
        const datalistId = 'lmao-user-tags-datalist';
        let datalist = document.getElementById(datalistId);

        if (!datalist) {
          datalist = document.createElement('datalist');
          datalist.id = datalistId;
          AppState.userTagsList.forEach((tag) => {
            const option = document.createElement('option');
            option.value = tag;
            datalist.appendChild(option);
          });
          document.body.appendChild(datalist);
        } else {
          datalist.innerHTML = '';
          AppState.userTagsList.forEach((tag) => {
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
          AppState.userTagsList
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
              !(
                (AppState.currentUserTags[mapKey] || []).includes(val) ||
                (map.tags || []).includes(val)
              )
            ) {
              AppState.addUserTag(map, val);
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

  function findLikesMapDiv() {
    return document.querySelector('div[class*="likes_map__"]');
  }

  function findHeading() {
    return document.querySelector('h1[class*="headline_heading__"]');
  }

  function findFullHeightContainer() {
    return document.querySelector('main');
  }

  /**
   * Extracts action buttons from existing controls for relocation to header
   * @param {HTMLElement} controlsContainer The current controls container
   * @returns {Object} Object containing extracted button elements and file input
   */
  function extractActionButtons(controlsContainer) {
    if (!controlsContainer) return { buttons: [], fileInput: null };

    const extractedElements = {
      clearButton: null,
      exportButton: null,
      importButton: null,
      fileInput: null
    };

    // Find clear filters button
    const clearBtn = controlsContainer.querySelector('.lmao-clear-filters-button');
    if (clearBtn) {
      extractedElements.clearButton = clearBtn.cloneNode(true);
      // Preserve the onclick handler
      extractedElements.clearButton.onclick = clearBtn.onclick;
    }

    // Find export button
    const exportBtn = controlsContainer.querySelector(
      'button[onclick*="downloadExportData"], button:contains("Export Settings")'
    );
    if (!exportBtn) {
      // Alternative search by text content
      const buttons = controlsContainer.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent && btn.textContent.includes('Export Settings')) {
          extractedElements.exportButton = btn.cloneNode(true);
          extractedElements.exportButton.onclick = btn.onclick;
          break;
        }
      }
    } else {
      extractedElements.exportButton = exportBtn.cloneNode(true);
      extractedElements.exportButton.onclick = exportBtn.onclick;
    }

    // Find import button and associated file input
    const importBtn = controlsContainer.querySelector('button:contains("Import Settings")');
    if (!importBtn) {
      // Alternative search by text content
      const buttons = controlsContainer.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent && btn.textContent.includes('Import Settings')) {
          extractedElements.importButton = btn.cloneNode(true);
          extractedElements.importButton.onclick = btn.onclick;
          break;
        }
      }
    } else {
      extractedElements.importButton = importBtn.cloneNode(true);
      extractedElements.importButton.onclick = importBtn.onclick;
    }

    // Find the hidden file input
    const fileInput = controlsContainer.querySelector('.lmao-file-input');
    if (fileInput) {
      extractedElements.fileInput = fileInput.cloneNode(true);
      extractedElements.fileInput.onchange = fileInput.onchange;
    }

    return extractedElements;
  }

  /**
   * Creates a header container with proper positioning for action buttons
   * @param {HTMLElement} headerArea The detected header area element
   * @returns {HTMLElement} The created header controls container
   */
  function createHeaderContainer(headerArea) {
    if (!headerArea) return null;

    // Check if header container already exists
    let headerContainer = document.querySelector('.lmao-header-controls');
    if (headerContainer) {
      return headerContainer;
    }

    // Create new header container
    headerContainer = document.createElement('div');
    headerContainer.className = 'lmao-header-controls';

    // Ensure the header area has relative positioning for absolute positioning of controls
    const headerAreaStyle = window.getComputedStyle(headerArea);
    if (headerAreaStyle.position === 'static') {
      headerArea.style.position = 'relative';
    }

    // Position the container in the top-right of the header area
    headerContainer.style.position = 'absolute';
    headerContainer.style.top = '1rem';
    headerContainer.style.right = '1rem';
    headerContainer.style.display = 'flex';
    headerContainer.style.gap = '0.5rem';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.zIndex = '1000';

    // Append to header area
    headerArea.appendChild(headerContainer);

    return headerContainer;
  }

  /**
   * Test function to verify header detection utilities work correctly
   * This function can be called from browser console for debugging
   */
  function testHeaderDetectionUtilities() {
    debugLog('Testing header detection utilities...');

    // Test header area detection
    const headerArea = findLikesMapDiv();
    debugLog('Header area found:', headerArea);

    if (headerArea) {
      // Test header container creation
      const headerContainer = createHeaderContainer(headerArea);
      debugLog('Header container created:', headerContainer);

      // Test button extraction (if controls exist)
      const controlsDiv = document.querySelector('.lmao-controls');
      if (controlsDiv) {
        const extractedButtons = extractActionButtons(controlsDiv);
        debugLog('Extracted buttons:', extractedButtons);
      } else {
        debugLog('No existing controls found for button extraction test');
      }
    }

    return {
      headerArea,
      headerContainer: document.querySelector('.lmao-header-controls')
    };
  }

  /**
   * Shows a loading indicator in the likes container.
   */
  function showLoadingIndicator() {
    const container = findLikesMapDiv();
    if (!container) return;
    let loader = document.getElementById('lmao-loading-indicator');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'lmao-loading-indicator';
      loader.className = 'lmao-loading-indicator';
      loader.innerHTML = `<span class="lmao-loading-indicator-text">⏳ Checking for learnable meta maps...</span>`;
      container.parentNode.insertBefore(loader, container);
    }
  }

  /**
   * Removes the loading indicator from the likes container.
   */
  function removeLoadingIndicator() {
    const loader = document.getElementById('lmao-loading-indicator');
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }

  // --- MAIN ---
  async function init() {
    showLoadingIndicator();
    try {
      const userTags = loadUserTags();
      const maps = await fetchAllLikedMaps();
      // Group tags for filter UI
      const userTagsSet = new Set();
      const apiTagsSet = new Set();
      const metaTagsSet = new Set();
      const learnableMetaCache = new Set();

      // Await fetchAndCacheLearnableMeta only during init, then cache result in learnableMetaCache
      const learnableMetaMapIds = [];
      for (const map of maps) {
        (userTags[getMapKey(map)] || []).forEach((t) => userTagsSet.add(t));
        (map.tags || []).forEach((t) => apiTagsSet.add(t));
        if (await fetchAndCacheLearnableMeta(getMapKey(map))) {
          metaTagsSet.add('Learnable Meta');
          learnableMetaCache.add(getMapKey(map));
          learnableMetaMapIds.push(getMapKey(map));
        }
        if (map.isUserMap === false) apiTagsSet.add('Official');
      }

      // get regions from Learnable Meta API
      const metaRegionCache = await preloadMetaRegions(learnableMetaMapIds);
      Object.values(metaRegionCache).forEach((regionData) => {
        if (regionData && Array.isArray(regionData.regions)) {
          regionData.regions.forEach((region) => metaTagsSet.add(region));
        }
      });

      // Initialize AppState
      AppState.maps = maps;
      AppState.userTagsList = Array.from(userTagsSet).sort();
      AppState.apiTagsList = Array.from(apiTagsSet).sort();
      AppState.metaTagsList = Array.from(metaTagsSet).sort();
      AppState.selectedTags = loadSelectedTags();
      AppState.currentUserTags = { ...userTags };
      AppState.tagVisibility = loadTagVisibility();
      AppState.filterCollapse = loadFilterCollapse();
      AppState.filterMode = 'ALL';
      AppState.editMode = false;
      AppState.learnableMetaCache = learnableMetaCache;
      AppState.metaRegionCache = metaRegionCache;
      const grid = findGridContainer();
      if (!grid) return;

      const container = grid.closest('div[class*="container_content__"]');
      if (container && !container.className.includes('lmao-full-width-container'))
        container.classList.add('lmao-full-width-container');

      const likesMapDiv = grid.closest('div[class*="likes_map__"]');
      if (likesMapDiv) {
        likesMapDiv.style.display = 'flex';
        likesMapDiv.style.alignItems = 'flex-start';
        likesMapDiv.style.gap = '0';
        likesMapDiv.style.marginTop = '1rem';
      }

      const likesMapContainer = likesMapDiv.parentElement;
      if (likesMapContainer && !likesMapContainer.className.includes('lmao-likes-container')) {
        likesMapContainer.classList.add('lmao-likes-container');
      }

      AppState.controlsDiv = document.getElementById('liked-maps-filter-controls');

      if (!AppState.controlsDiv) AppState.rebuildControls();
      grid.style.flexGrow = '1';
      AppState.rerender();

      console.log('[LMAO] Initialization complete.');
    } finally {
      removeLoadingIndicator();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  /**
   * Checks if the current page is one where the script should activate.
   * @returns {boolean}
   */
  function isActivePage() {
    const { pathname, search } = window.location;
    if (pathname === '/me/likes') return true;
    // disabled for now - would need handle the different class names to make it work.
    // if (pathname === '/maps/community') {
    //   const params = new URLSearchParams(search);
    //   return params.get('tab') === 'liked-maps';
    // }
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
     * Remove controls if not on the correct page.
     */
    function tryInit() {
      try {
        if (!isActivePage()) {
          gridInitialized = false;
          // Remove controls panel if present
          const controlsDiv = document.getElementById('liked-maps-filter-controls');
          if (controlsDiv && controlsDiv.parentNode) {
            controlsDiv.parentNode.removeChild(controlsDiv);
          }
          return;
        }
        const grid = document.querySelector('div[class*="grid_grid__"]');
        // debugLog('[LMAO] grid alive:', !!grid, 'initialized:', !!gridInitialized);
        if (!grid) {
          gridInitialized = false;
          // Keep retrying until grid appears (for SPA back/forward navigation)
          // debugLog('[LMAO] Grid not found. Retrying...');
          setTimeout(tryInit, 100);
          return;
        }
        if (!gridInitialized) {
          gridInitialized = true;
          console.log('[LMAO] initializing');
          init();

          saveDevConfig();
        }
      } catch (e) {
        console.error('[LMAO] Error during tryInit:', e);
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
