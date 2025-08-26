# [GeoGuessr Liked Maps Advanced Overhaul (LMAO)](https://github.com/schnador/geoguessr-lmao)

<img src="./img/lmao_icon.png" alt="drawing" width="50"/>

A powerful userscript for organizing and enhancing your liked maps on [GeoGuessr](https://www.geoguessr.com/). Add custom tags, filter maps, with instant Learnable Meta integration.

[GITHUB](https://github.com/schnador/geoguessr-lmao)

[DOWNLOAD (GREASYFORK)](https://greasyfork.org/en/scripts/543001-geoguessr-liked-maps-advanced-overhaul-lmao)

---

## Features

- **Tagging:** Add, edit, and filter custom tags for your liked maps.
- **Filtering:** Easily filter maps by their tags - Default tags and custom tags.
- **Searching:** Use the searchbar to find maps by their name, description, author and corresponding tags
- **De-clutter:** You can now hide the barely useful default tags provided by geoguessr. More space for custom tags 😎
- **Learnable Meta Integration:** Instantly see which maps are supported by [Learnable Meta](https://learnablemeta.com/). Regions are also tagged for you.

| Unfiltered                                                                           | Filtered                                                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| ![Unfiltered](https://github.com/schnador/geoguessr-lmao/raw/main/img/activated.png) | ![Filtered](https://github.com/schnador/geoguessr-lmao/raw/main/img/filtered.png) |

---

## Installation

1. **Install a userscript manager:**
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. (if you use chrome/edge/chromium based browser) [Enable developer mode](https://www.tampermonkey.net/faq.php?locale=en#Q209) for Chrome extensions
3. **Install the script:**
   - [Install via GreasyFork](https://greasyfork.org/en/scripts/543001-geoguessr-liked-maps-advanced-overhaul-lmao)

---

## Usage

### General Usage

1. Visit your [Liked Maps page](https://www.geoguessr.com/me/likes) on GeoGuessr.
2. Add tags

   - Enable Editmode (✏️)
   - Add a tag by either entering a text or selecting one from the list of available tags:
     ![Add a tag](https://github.com/schnador/geoguessr-lmao/raw/main/img/add-tag.png)
   - Press enter to confirm
   - Disable Editmode (✏️) when you are done

3. Use the sidebar to:
   - Filter maps by tags
     - "Any"-Mode: Shows maps, which contain ANY of the selected tags.
     - "All"-Mode: Shows maps, which contains ALL of the selected tags.
   - Toggle visibility of user, Learnable Meta, regions and default tags
   - Learnable Meta maps are automatically recognized and tagged along with their regions!

### Clearing the filters

To clear the current filters, just click the 🗑️ button

### Searchpanel

Use the searchpanel to search text in your liked maps.
You can use the button left of the searchpanel to restrict your search to parts of the following categories:

- Map name
- Map description
- Map creator name
- Tags

![Searching](https://github.com/schnador/geoguessr-lmao/raw/main/img/searching.png)

### Reordering your tags

You can easily reorder your tags in the sidebar via drag and drop when in editmode (✏️).

![Reordering](https://github.com/schnador/geoguessr-lmao/raw/main/img/reordering.png)

### Exporting & Importing your tags (+ Backups)

If you play geoguessr on different devices or browsers, you can use the export and import buttons in ⚙️

This simply downloads a json file which you can then import again.

Also useful for making backups!

---

## Future plans

- Add a grid-view instead of the default map teasers
- Create video to show installation and usage
- Integrate with available scripts that work on the liked maps page
- Sort and reorder maps
  - Geoguessrs default behaviour for this is awful. You would have to unlike and then like maps in the reverse order you wish them to be in.
- Keybinds
- Configure visible data in the map teasers
- Display 5k radius
  - Since Mapmakers can choose to set this value manually, it should be visible to the user.
- Filter favourites??

**Feel free to add suggestions under ["Issues"](https://github.com/schnador/geoguessr-lmao/issues/new) with the tag "enhancement".**
**Also, if you want to contribute - please do!**

---

## Permissions & Security

- **@grant GM_xmlhttpRequest** — For Learnable Meta API integration
- **@grant GM_addStyle** — For CSS injection
- **@grant unsafeWindow** — For localStorage access
- **@connect learnablemeta.com** — To fetch Learnable Meta map info

No data is sent anywhere except to the [Learnable Meta](https://learnablemeta.com/) API for map detection.

All tags and settings are fetched from their API and stored locally in your browser.

---

## Learnable Meta API usage

The Learnable Meta integration works by checking maps which don't have a localStorage entry via the Learnable Meta API, just as the Learnable Meta userscript would.
This information is stored locally, and never refetched unless you clean your localStorage to keep the API calls to a minimum.

Additionally, the regions for Learnable Meta maps (World, Europe, Asia, etc..) are also fetched from the Learnable Meta API.

**This functionality is approved by the developer of [Learnable Meta](https://github.com/likeon/geometa)!**

I will do the best to react quickly to any changes in the Learnable Meta userscript to keep the integration seamless.

---

## License

[Licensed under MIT](https://mit-license.org/)

---

## Credits

- Script by [snador](https://github.com/schnador)
- [Learnable Meta](https://learnablemeta.com/) for their great work.

// Copyright (c) 2025 schnador
