# Dungeonfront: Merchant's Rise — Ranger V2 concept approval

**Status: CONCEPT PREVIEW ONLY.** Do NOT add Ranger V2 sprites to the APK or enable Ranger in the `approvedClasses` renderer allowlist until the user approves the visual design. The Knight .4 build is tested and unchanged.

## Intent
The **Verdant Wayfinder** Ranger is the next visual class after the approved side-facing Knight. Match the Knight's cleaner modern anime-inspired, illustrated 2D mobile RPG finish, sculpted shapes and subtle metallic accents, but make Ranger immediately recognizable as agile long-range adventurer.

## Look for review
- Original character design; neither a recognizable franchise character nor a medieval pixel sprite.
- Athletic adult archer, approximately 6.5–7 head proportions; weathered pine-green hood, layered asymmetrical green cloak that trails behind movement, dark brown fitted leather and linen, lightweight engraved shoulder guards, travel boots and visible fingerless archery glove.
- Prominent curved wood-and-brass fantasy longbow; prominent arrow/quiver on back. No two-handed melee sword, no excessively bulky armor.
- Signature palette: deep forest green #254d43, sage #789c75, brown leather #624633, muted brass #c3a16a, subtle emerald magical energy #83d8ad.
- Clearly side-facing **RIGHT** base pose, with head/hood pointed right, longbow in front, cape/quiver visibly trailing left. Avoid front-facing sprites merely mirrored by canvas flipping; it caused the Knight's earlier walking-backwards issue.
- Bow naturally points at a nearby target during combat; mirrored for monsters to the left; no archery motion backward.
- Distinguishable 2D animation silhouettes at a small 72 × 108 logical-pixel draw size.

## Requested first look before implementation
Show a clean side-by-side modern RPG **design/game-scale review image**, with (1) full-resolution character reference (2) in-game right-facing idle (3) side-facing walk (4) drawn bow attack with emerald trail (5) left-facing mirror example. Put character art against a neutral dark fantasy environment, with uncluttered text and no fake gameplay UI.

## Future technical contract, AFTER visual approval
- Same v2 file organization as Knight: `app/src/main/assets/sprites/actors_v2/ranger/{idle,walk,attack,hurt,death,special}.png`
- 128 × 192 RGBA transparent animation frames with consistent feet pivot at (64, 191), packaged as single-row PNG strips.
- Frame counts: idle 8, walk 10, attack 12, hurt 5, death 12, special 12. Do not treat concept art as valid spritesheets.
- Static PNGs baked prior to Android package build; do not use giant SVG data URIs in WebView.
- Shop movement/queue; public dungeon and contract dungeon; hero target-facing selection; retreating upright toward entrance even at 0 HP.
- Extend preview toggle and allowlist only after approved PNGs are produced and Android verified.
- Keep `dungeonfront_merchants_rise_save_v1`, existing app ID, signing, inventory, contract extraction, portal positions and battle balance untouched.
- Fallback safely to legacy class sprites for all not-yet-ready actions or rendering failures.
- Follow the Knight .4 QA pattern: browser tests, Android 15 emulator, 5 instrumentation checks plus new bow-facing assertions. Then user Galaxy S23 FE Android 16 test.

**Gate:** No Ranger art in any APK without approval of concept image and a review of exported production frames.
