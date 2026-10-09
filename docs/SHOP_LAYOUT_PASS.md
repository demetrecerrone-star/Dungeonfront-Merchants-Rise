# Dungeonfront — Shop Visual Layout Pass (Step 1)

Status: **Implemented as a reviewable v0.9.0-preview.1**, NOT yet a production release.

## Goal
Create a readable, lively pixel-shop scene with a clear spatial hierarchy while keeping every gameplay, save and dungeon control intact. High-fidelity animated sprites are intentionally deferred to Steps 2–3.

## Native scene grid
* Canvas: **800 × 440**, pixelated, letterboxed by the existing responsive scene component.
* Dungeon gate / portal tap: center **(145, 267)** with hit ellipse x radius **82**, y radius **99**. **Do not move this hit target**.
* Dungeon approach and portal occupy x=0–288. Shop building occupies x=292–772.
* Shop sign: center x=533, y=102–145.
* Stock shelves: x=328 and x=448, y=159; item displays correspond to actual player inventory.
* Shop owner anchor for future sprite atlas: **(590, 299)**, layered behind counter front.
* Trade counter: x=419–661, y=289–369; customers remain in foreground.
* Customers still enter from x=-25, wait at x=520 and are tapped using their original positions and hit zones.
* Queue lane: x=311–753, y=341–380.
* Lighting: warm lanterns at x=316 and x=647, additional lantern upgrade at x=660; evening tint retains readable signs.
* Upgrades remain visible: extra shelving, forge, guard and lantern.

## Shop management layout
* Right sidebar remains independently scrollable and contains the **Stock / Craft / Build / Ledger** tabs.
* Stronger wood-and-bronze panel contrast, clearer stock quantities, price steppers and accessible tap areas.
* Shop-only CSS is scoped to `.scene-wrap.shop-mode` and `.scene-wrap.shop-mode + .sidebar`; dungeon, private contracts and roster UI stay unchanged.
* On narrow landscape screens, tab heights and padding compact without shrinking essential buttons below the existing practical minimum.

## Non-regression requirements
* Do not replace, reset or rename the local save key `dungeonfront_merchants_rise_save_v1`.
* Maintain the current Android applicationId `com.dabski.dungeonfront` and persistent signing setup.
* Do not change dungeon portal placement, raid-boss extraction, class combat, visitor pop-ups or payment claim gating.
* Live inventory interactions must not lose taps due to background DOM refresh; scrolling must remain usable.
* Same functional guest and merchant anchors are reserved for animated pixel sprites in the next steps.

## Verification
* `tests/shop-ui.test.js` verifies the shop renderer, tab usability, customer view, unchanged portal tap, shop-only theme and returning to the shop.
* The full existing browser tests and Galaxy-size landscape emulator smoke workflow run on the dedicated shop preview branch.
* Preview signed APK uses versionCode **15** and versionName **0.9.0-preview.1**, allowing testing over v0.8.1 without deleting saves.
* **Preview branch intentionally does not publish a new GitHub release.**

## Next stages
**Step 2:** polished shopkeeper sprite with idle / talk animations at anchor (590,299). Use the same resolution and pixel scale as hero atlases (or a matching dedicated merchant sheet).

**Step 3:** apply existing class idle/walk atlases to real shop visitors, adding queue-to-counter transitions and distinct waiting behavior. Later art quality overhaul replaces these atlases with richer designs without moving the scene anchors.
