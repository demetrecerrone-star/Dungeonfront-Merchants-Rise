# Dungeonfront: Merchant's Rise

A gritty, landscape Android pixel-art fantasy shopkeeping game by Dabski.

## Current prototype (v0.1)

The first playable prototype is packaged separately as `Dungeonfront-Merchants-Rise-v0.1-Android-Project.zip`. It includes:
- A shop by a dangerous dungeon, with visiting adventurers, inventory and pricing.
- Dungeon loot, basic crafting, shop upgrades, gold, reputation, events and offline saves.
- Landscape layout with Android system navigation and cutout safe areas.
- The original six-second Dabski intro MP4 supplied by the creator (the exact asset, not a recreation).

## Add the game source to this repository

1. Extract **Dungeonfront-Merchants-Rise-v0.1-Android-Project.zip**.
2. Open the extracted `dungeonfront_project` directory.
3. Upload **the contents** of that directory into the **root** of this repository, retaining all subfolders, including `.github`, `app`, `tests`, and `gradle`.
4. The key video file must be `app/src/main/assets/dabski_intro.mp4`. Don't upload the ZIP itself as a substitute for the extracted project files.
5. Commit the upload to `main`. The Android build workflow will run automatically when app source files are present.

## Download the debug APK

Open **Actions** → **Build Dungeonfront APK** → latest successful run → **Artifacts** → `Dungeonfront-v0.1-debug-APK`. Extract the artifact ZIP to obtain `app-debug.apk` for Android testing.

## Future milestone

Random special visitors may ask to join the shop as hired dungeon adventurers (e.g., a wandering paladin). This is a later feature, **not** part of the v0.1 prototype.

For the full technical notes, see the README bundled in the Android project archive.
