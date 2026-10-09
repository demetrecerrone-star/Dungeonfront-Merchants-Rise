# Modern Dungeonfront character art — implementation contract

**Phase:** renderer foundation on a separate development branch. **No v2 character art is currently in the APK. The concept lineup is illustrative only, not a frame atlas.**
**Review requirement:** the user sees and approves each redesigned character before any new v2 imagery is turned on in a preview APK.

## File-by-file implementation

1. **`app/src/main/assets/modern-sprites.js`** — independent v2 sprite player with 128 × 192 transparent cells, configurable frame rate and action counts, cached image sources, correct bottom-center pivot, optional anti-aliased sampling, and error-safe `false` fallback. **OFF by default**, including when assets happen to exist.
2. **`app/src/main/assets/index.html`** — load v2 module after the existing renderer but before `game.js`. No UI/toolbar is added to the stable build.
3. **`app/src/main/assets/game.js`** — for dungeon heroes only, ask v2 to draw at the existing baseline. If unavailable or off, draw the original `DFSprites` atlas at its established scale, or procedural fallback. **No changed game logic**. Shop visitors stay on their previous style until after art review and phone testing.
4. **`app/src/main/assets/sprites/actors_v2/`** — future transparent RGBA animation sheets in per-class folders. They are intentionally **not** fabricated from concept art. Add only after reviewing each class prototype.
5. **`tests/modern-sprites.test.js`** — validate defaults, no-load mode, unknown/invalid input, lazy loading, cache reuse, expected dimensions, class/action switching, frame sequencing, draw safety, mirroring and regression anchors.
6. **`.github/workflows/test-contract-refinements.yml`** — lint v2 module and run all existing node tests alongside the new ones automatically.
7. **`docs/ADVENTURER_REDESIGN_V2.md`** — approved visual specification is the art brief, not executable gameplay code.

## Public build guarantees

- Public release remains **v0.8.1** while the shop-preview/art work is on private-in-progress GitHub branches.
- Keep Android application ID, APK signer, save key, roster data, character stats, class IDs, quest timings, reward rules, portal coordinates and boss extraction code untouched.
- Add no new asset dependencies or synchronous image decodes in the game loop. Cached PNGs are only requested when the v2 renderer is explicitly opted into.
- Incomplete or missing sheets always return `false`; control returns to v1 for that hero and action. A renderer failure must never blank the game scene.
- V2 visual motion must never alter simulated attack cadence. Idle/walk rely on render clock and attacks use current short swing pulse only until a separate non-gameplay visual action clock is approved.
- Client renders at legacy 800 × 440 world coordinates; v2 draws a 128 × 192 frame at approximately 72 × 108 canvas px with feet aligned at y=355.
- The first test uses a Knight proof-of-concept atlas generated from **approved** character art. The user will see it prior to any APK asset swap.

## Release progression

**Foundation branch (now) → Knight concept approval → real Knight atlas + alpha/registration testing → opt-in Android preview APK → all six classes → shop visitors → enemies/bosses → visual QA and full replacement only after approval.**
