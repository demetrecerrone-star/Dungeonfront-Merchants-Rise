# Dungeonfront: Merchant's Rise — Android v0.8.0

A gritty landscape pixel-art shopkeeping game set beside **The Hollow Descent**, a dangerous fantasy dungeon. Equip travelers, craft goods and expand Last Light Provisions.

## v0.8 release — animated dungeon discoveries, guild roster, and class combat

**Android smoke-test milestone:** [Emulator QA workflow](.github/workflows/android-visual-qa.yml) and [phone-specific test checklist](docs/ANDROID_QA.md). The emulator uses a Galaxy S23 FE-sized landscape display; screenshots/logs are uploaded as an artifact. It does not publish a game APK or substitute for hands-on Samsung testing.


**Pixel-art production plan:** [Asset directory layout, frame counts, file naming and implementation checklist](docs/SPRITE_PRODUCTION_PLAN.md).

**Visual Batch A is in the repo:** 18 original class animation PNG sheets (idle/walk/attack, six classes), fallback-aware sprite renderer, and PNG validation tests. [Preview all 18 animation sheets](docs/SPRITE_PREVIEW.md). These art assets are included in the v0.8.0 release source.

**Visual Batches C/D are now implemented:** nine distinct monster designs with 46 animated PNG sheets (including the Abyssal Sovereign's signature attack and death) and eight combat effect sheets. The dungeon uses these actual sprites and retains procedural fallback. [Preview monsters and effects](docs/MONSTER_SPRITE_PREVIEW.md). A [GitHub Actions run](https://github.com/demetrecerrone-star/Dungeonfront-Merchants-Rise/actions/runs/37921981641) contains the downloadable `Dungeonfront-Monster-Boss-Effects-Sprites` ZIP. Both sprite and combat regression suites passed.


**Visual Batch E is implemented:** five animated dungeon discovery types, six class emblems, four injury/readiness icons, and three rarity markers. Roster and contract cards now display condition, rank and extraction progress. [Preview the events and guild icons](docs/DUNGEON_EVENT_PREVIEW.md). The development branch contains **95 PNG sprites/icons** in total, and are bundled into v0.8.0.

This work was developed on branch `work/v0.8-roster-combat-treasure`; the GitHub release workflow signs and publishes v0.8.0 after tests pass.

- **Adventurer Roster:** Open the ⚔ icon by the parchment Contract Board emblem or the ROSTER button on the board. Inspect persistent levels, experience, traits, weapon/armor/shield/supply slots, fatigue and wounds. Stage up to five hires for contracts and issue gear from shop stock.
- **Class-based combat:** Knights intercept attacks close to weaker teammates, clerics heal injured party members with limited charges, rangers and mages strike from range, rogues attack faster and can critically hit, while groups slow down for stragglers and couriers.
- **Expanded merchant catalog:** Chainmail, steel shields, hunter bows, arcane staves and restorative elixirs, with class-specific customer demand. Existing local saves gain missing stock/price entries without losing currency or prior inventory.
- **Dungeon discoveries:** Every floor features treasure chests, traps, healing shrines, hidden chambers and wandering traders. Heroes trigger discoveries during exploration; treasure is credited to the correct dungeon instance and discoveries cannot be repeatedly farmed by the same hero.
- **Fatigue/injuries:** Successful extraction imposes fatigue and can leave persistent wounds. Injured/exhausted hires cannot start new contracts until treated with medical stock or rested through in-game days; death on a hired mission remains permanent.
- **Existing extraction rules remain:** Exit portals at the *start* of every floor, onward passages at the ends of floors 1–7 and no forward passage on the raid floor; contract rewards and the completion popup stay locked until survivors return.

Development tests: `node tests/v08.test.js` and all previous JavaScript regression suites run in CI without producing an APK.

## Playable prototype
- Adventurers arrive, buy equipment and consumables, and bring back dungeon materials.
- Manage stock, gold, changing prices, shop upgrades and crafting recipes.
- Dungeon floors, reputation, raiding events, and transaction ledger.
- Procedurally drawn pixel-art shop with improved scenery and class-specific walking adventurer animations; fully offline with local saves.
- Daily guild supply orders: fulfill requests from existing stock for extra gold and reputation. Existing saves remain compatible.
- Dynamic, streamlined HUD with live stock warnings, a market-day progress bar, cleaner panels, tab icons, and transaction feedback.
- A parchment C button opens a dedicated Contract Board with rotating work orders, applicants, a hired roster and saved expeditions. Select one to five hired adventurers, start a job and tap WATCH to enter its own automatically followed dungeon instance; normal dungeon adventurers and combat never mix with contracted parties. Claim gold and recovered salvage after success, with a completion report.
- Nine special visitor encounters, seven focused on adventurers selling dungeon loot to your merchant, plus occasional aid requests with resource and reputation decisions; automatic save and one encounter per game day.
- Stability improvements: rate-limited canvas drawing and batched shop-panel refreshes prevent unnecessary sidebar DOM replacement during tab navigation.
- While watching the dungeon, shop transactions continue silently and roadside visitor events wait until the player returns to the shop. No commerce popups cover the dungeon camera.
- Tap the shop portal to open an immersive, side-scrolling dungeon with one full-screen chamber per floor. Horizontal swipes explore within each floor; vertical swipes or the pull-up FLOORS menu change floors. The redundant left/right buttons have been removed. Tap a hero to follow them automatically as they travel down to deeper floors.
- Dungeon encounters are denser (eight regular monsters per floor) and respawn faster (3–5 seconds). An adventurer must clear at least one encounter before descending; floor eight requires a raid boss victory. Group wins count for present teammates, and compact party inspections show every member, current floor, level, health, and status with selectable follow controls. Parties contain up to five adventurers, including migrated older saves, while solos remain.
- Mixed solo adventurers and persistent named parties explore eight floors with multiple roaming enemies. Floor eight features the Abyssal Sovereign raid boss with 480 HP, raid-victory rewards and a respawn timer. Hero victories grant XP, level-ups and crafting materials. Older dungeon saves migrate forward without clearing merchant progress.
- Landscape orientation and Android system navigation safe areas.
- Dabski intro: original uploaded 1920×1080 MP4, unchanged. Player-interface startup fix retained.
- Version **0.8.0** (Android versionCode **13**).

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
