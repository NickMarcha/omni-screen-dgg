# Destiny.gg extension for Omni Screen

This extension adds [Destiny.gg](https://www.destiny.gg) chat, live embeds, emotes, and flairs to [Omni Screen](https://github.com/NickMarcha/omni-screen).

## Install

1. Make sure [Omni Screen](https://github.com/NickMarcha/omni-screen) is installed.
2. Click the link below. Your system will open Omni Screen and install the extension.

   [Install in Omni Chat](omnichat://install?url=https://raw.githubusercontent.com/NickMarcha/omni-screen-dgg/refs/heads/main/manifest.json)

3. If prompted, allow Omni Screen to open. After install, you can reload extensions from the app menu (**Extensions → Reload extensions**) or restart the app.

## Update URL

The extension declares an update URL so Omni Screen can check for new versions. The manifest is at:

- `https://raw.githubusercontent.com/NickMarcha/omni-screen-dgg/refs/heads/main/manifest.json`

## Development

- `manifest.json` — Extension metadata (id, name, version, updateUrl, entry, capabilities).
- `bundle.js` — Entry bundle downloaded on install; future runtime registration will use this.

## License

Same as the Omni Screen project, or as specified in this repo.
