# [GeoGuessr Liked Maps Advanced Overhaul (LMAO)](https://github.com/schnador/geoguessr-lmao)

A powerful userscript for organizing and enhancing your liked maps on [GeoGuessr](https://www.geoguessr.com/). Add custom tags, filter maps, with instant Learnable Meta integration.

[GITHUB](https://github.com/schnador/geoguessr-lmao)

[GREASYFORK](https://greasyfork.org/en/scripts/543001-geoguessr-liked-maps-advanced-overhaul-lmao)

---

## Features

- **Tagging:** Add, edit, and filter custom tags for your liked maps.
- **Filtering:** Easily filter maps by their tags - Default tags and custom tags.
- **De-clutter:** You can now hide the barely useful default tags provided by geoguessr. More space for custom tags 😎
- **Learnable Meta Integration:** Instantly see which maps are supported by [Learnable Meta](https://learnablemeta.com/).

Unfiltered:

![Unfiltered](https://github.com/schnador/geoguessr-lmao/raw/main/img/activated.png)

Filtered:

![Filtered](https://github.com/schnador/geoguessr-lmao/raw/main/img/filtered.png)

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

- Visit your [Liked Maps page](https://www.geoguessr.com/me/likes) on GeoGuessr.
- Use the control panel to:
  - Add or remove tags
  - Filter maps by tags
    - "Any"-Mode: Shows maps, which contain ANY of the selected tags.
    - "All"-Mode: Shows maps, which contains ALL of the selected tags.
  - Toggle visibility of user, Learnable Meta, and default tags
  - Learnable Meta maps are automatically recognized and tagged!

Adding a tag:

![Adding a tag](https://github.com/schnador/geoguessr-lmao/raw/main/img/add-tag.png)

---

## Future plans

- Automatically add Learnable Meta category tags from https://learnablemeta.com/maps
  - for example: "World", "Europe", "Asia", etc..
- Rework layout & styling for better usability
- Create video to show installation and usage
- Rework icon

**Feel free to add suggestions under ["Issues"](https://github.com/schnador/geoguessr-lmao/issues/new) with the tag "enhancement"**

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

I will do the best to react quickly to any changes in the Learnable Meta userscript to keep the integration seamless.

---

## License

[Unlicense](https://unlicense.org/) — Public domain, do whatever you want.

---

## Credits

- Script by [snador](https://github.com/schnador)
- [Learnable Meta](https://learnablemeta.com/) for their great work.
