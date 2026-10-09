# Dungeonfront: Merchant's Rise — Android v0.5

A gritty landscape pixel-art shopkeeping game set beside **The Hollow Descent**, a dangerous fantasy dungeon. Equip travelers, craft goods and expand Last Light Provisions.

## Playable prototype
- Adventurers arrive, buy equipment and consumables, and bring back dungeon materials.
- Manage stock, gold, changing prices, shop upgrades and crafting recipes.
- Dungeon floors, reputation, raiding events, and transaction ledger.
- Procedurally drawn pixel-art shop with improved scenery and class-specific walking adventurer animations; fully offline with local saves.
- Daily guild supply orders: fulfill requests from existing stock for extra gold and reputation. Existing saves remain compatible.
- Dynamic, streamlined HUD with live stock warnings, a market-day progress bar, cleaner panels, tab icons, and transaction feedback.
- Four special visitor encounters (herbalist, wounded ranger, scrap trader, pilgrim) with resource and reputation decisions; automatic save and one encounter per game day.
- Clickable shop portal opens a side-scrolling, eight-floor dungeon watch: inspect adventurers and monsters, swipe horizontally, use floor controls, and watch simple combat and salvage progress. Shop sales send equipped adventurers into the dungeon; dungeon data saves with the existing local merchant save.
- Landscape orientation and Android system navigation safe areas.
- Dabski intro: original uploaded 1920×1080 MP4, unchanged. Player-interface startup fix retained.
- Version **0.5** (Android versionCode **6**).

## Build APK

1. Open [Actions](https://github.com/demetrecerrone-star/Dungeonfront-Merchants-Rise/actions/workflows/build-android.yml).
2. Select the latest successful **Build Dungeonfront APK** run on main.
3. Download its artifact and extract the APK.

A debug APK is produced automatically if signing secrets haven't been set; **debug signing keys are temporary and may require uninstalling older builds, which can erase local saves**.

### Reusable signing (recommended for v0.2 onward)

Create an Android keystore privately and back it up securely. Under **Repository Settings → Secrets and variables → Actions**, set all four repository secrets:

- `DUNGEONFRONT_KEYSTORE_BASE64`: base64-encoded contents of the keystore file.
- `DUNGEONFRONT_STORE_PASSWORD`: keystore password.
- `DUNGEONFRONT_KEY_ALIAS`: key alias.
- `DUNGEONFRONT_KEY_PASSWORD`: key password.

Never commit a keystore, key password, or secrets text file to this public repository. After adding all four secrets, run the workflow again and install the **persistently signed release APK**. Keep the signing key backed up: losing it prevents future updates from using the same signing identity.

If a previous APK used another signing key, uninstalling it before the first persistently signed build may be necessary once. Future releases signed with the same keystore can install over one another while retaining app data.

## Project architecture
- `MainActivity.java`: Android WebView wrapper, system insets and offline loading.
- `app/src/main/assets/index.html` / `styles.css`: responsive landscape interface and skippable intro.
- `app/src/main/assets/game.js`: shop and side-on dungeon canvas, camera and floor controls, customer movement, auto-save and game events.
- `app/src/main/assets/dungeon.js`: persistent bounded dungeon expeditions, monster encounters and salvage rewards.
- `app/src/main/assets/economy.js`: inventory, pricing, recipes, upgrades, expedition salvage.
- `.github/workflows/build-android.yml`: APK build with reusable release signing when configured.

SHA-256 of original cinematic:
`075832e834948055122d81d901a30c97b3c898667f20e0935c5c664cd7af756d`

## Future features

[Issue #1](https://github.com/demetrecerrone-star/Dungeonfront-Merchants-Rise/issues/1): occasional visitors, such as paladins, offering to join your dungeon expedition roster via random encounters — planned after core shop polish, not part of v0.4.
