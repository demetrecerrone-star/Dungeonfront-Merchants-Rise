# Dungeonfront: Merchant's Rise — Android v0.1

A gritty landscape pixel-art shopkeeping game set beside **The Hollow Descent**, a dangerous fantasy dungeon. Keep adventurers supplied, set prices, buy salvage, craft better goods and expand Last Light Provisions.

## Current playable systems

- Adventurers arrive, buy equipment and consumables, and bring back dungeon materials.
- Manage stock, gold, changing prices, four shop upgrades and crafting recipes.
- Day progression, bandit raids, dungeon floors, basic reputation and transaction ledger.
- Procedurally drawn pixel-art shop and dungeon gate; animated visitors.
- Fully offline, with local saves.
- Locked landscape orientation. Visible Android navigation bar with display-cutout/system-bar inset padding and touch-safe controls.
- Original **Dabski intro video** (1920 × 1080, 6.016 seconds), automatically fetched and verified during the APK build. It is the exact uploaded OpenArt MP4 (SHA-256 below), not a recreation.

## Build and install

1. Open [Actions](https://github.com/demetrecerrone-star/Dungeonfront-Merchants-Rise/actions/workflows/build-android.yml).
2. Select the most recent **Build Dungeonfront APK** run on `main`. A new push will trigger a build, or click **Run workflow**.
3. Wait for a **green checkmark**; then open the run and download its artifact **Dungeonfront-v0.1-debug-APK**.
4. Extract that artifact ZIP and install `app-debug.apk` on Android. Updates will retain the app's local saved progress as long as you install with the same signing identity.

The workflow uses Android Gradle Plugin 8.7.3 and Gradle 8.10.2 on JDK 17.

The original video is retrieved from the creator's exact OpenArt generation, with byte-for-byte checksum validation:
`075832e834948055122d81d901a30c97b3c898667f20e0935c5c664cd7af756d`

The workflow also attempts to commit the original MP4 to the repository so builds can eventually be fully self-contained; the APK always includes it after the verification step succeeds.

## Architecture

- `MainActivity.java`: Native Android WebView wrapper, safe system insets and offline loading.
- `app/src/main/assets/index.html` / `styles.css`: Landscape UI, Dabski cinematic, shop panels.
- `game.js`: Interactive canvas scene, transactions, customers, autosaves and game events.
- `economy.js`: Inventory, upgrades, pricing, recipes and dungeon salvage.
- `.github/workflows/build-android.yml`: Reproducible debug APK build.

## Future roadmap

**Random recruitable adventurer events** (a paladin or other special visitor appears and asks to join) are planned **after** the first build; keep this light and event-based rather than a complicated management simulator. See [issue #1](https://github.com/demetrecerrone-star/Dungeonfront-Merchants-Rise/issues/1).

This is an early prototype for testing, not yet a production release. The pixel-art sprites and NPC routines are procedural and simplified, and the economy will need balancing.
