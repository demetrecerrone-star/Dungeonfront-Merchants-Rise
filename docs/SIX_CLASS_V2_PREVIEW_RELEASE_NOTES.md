# Six-Class Modern Character Preview 0.9.0-classes-preview.1

**Status:** independently signed install-over development preview; NOT a public/stable release. Branch `work/v0.9-six-class-preview`.

## Implemented
- All six existing playable classes use high-resolution RGBA frame strips when **SIX CLASSES V2** is toggled ON: Knight (original approved .4 PNGs), Ranger, Mage, Cleric, Rogue and Mercenary (approved-for-prototype integration first-pass vector prototypes).
- All six action sheets present for every class: idle (8), walk (10), attack (12), hurt (5), death (12), special (12) — **36 atlases, 354 frames**.
- On preview APK build, `tools/build_knight_atlas.py` and `tools/build_remaining_actor_atlases.py` render original source art to PNG; `tools/stage_remaining_actor_atlases.py --approved` copies the five review-approved prototype bundles into Android assets.
- The previous long SVG data URI runtime pathway remains disabled. All Android artwork is delivered as cached PNGs, with v1 fallback for failed or missing assets.
- Shop visitors (waiting, entering/leaving counter) and dungeon heroes share the same class artwork. Regular, private contract and boss floors call the same renderer.
- Combat facing uses the real monster location, with class-correct targeting distance (**Knight/Rogue/Cleric/Mercenary 43**, Ranger **115**, Mage **145**); retreat and return always face toward floor entrance even with zero HP.
- Shop hit-test zones adjust for larger sprites when v2 toggle is on.
- A user-visible **SIX CLASSES V2: OFF/ON** non-persistent toggle controls preview. Modern art also can be enabled with `?actorPreview=1`, and legacy `?knightPreview=1` remains supported.
- All class stats, effects, upgrades, inventory state, sale transactions, portals, contract settlement, dungeon AI, loot, saves, signing identity and appId are unchanged.

## QA gates
- JavaScript suites: contracts, shop, sprite fallback, frame geometry, art pack, combat/dungeon extraction, economy/encounters.
- Emulator Android 15 Pixel 6 landscape smoke tests: 5 instrumentation tests including v2 PNG loads for all six classes, real draw calls, left/right movement, ranged target facing, toggling back to legacy, and shop/dungeon/roster/contracts.
- Preview .1 APK versionCode **20**, Android package `com.dabski.dungeonfront`, persisted save key `dungeonfront_merchants_rise_save_v1`. Installs over versionCode 19 Knight Preview .4 when both use same signing identity.
- Public release gate in GitHub Actions remains disabled. Do not promote until physical Galaxy S23 FE (Android 16) is tested.

## Next art quality pass
Production prototypes remain more stylized/simple than the approved high-detail character references. Prioritize Ranger bow readability, Mage casting staff animation, Cleric healing, Rogue dual dagger crossing, Mercenary axe wind-up, overall sprite silhouette consistency, FX timing and WebView real-phone frame-rate profiling.
