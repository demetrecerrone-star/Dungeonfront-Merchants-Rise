# Dungeonfront: Merchant's Rise — Pixel-Art Production Blueprint

**Status:** Visual batches A, C, D and E are implemented: 18 hero, 46 monster/boss, 8 combat-effect, 10 animated event and 13 interface icon PNGs (**95 assets**) with fallback-aware rendering. Class signature poses, equipment overlays, and Android device playtesting are still pending; **no APK has been released**.
**Target branch:** `work/v0.8-roster-combat-treasure`
**Target client:** Android WebView, offline, landscape; dungeon canvas **800 × 440**.
**Style:** original gritty medieval fantasy pixel art, high-contrast silhouettes, subdued materials, warm torches, readable at phone size.

## 1. Locked rendering contract

- Every PNG must be original or properly licensed, lossless RGBA, transparent background, no lettering or fake UI.
- **1 animation/action per horizontal sprite sheet**, no padding between cells. Example: six 32 × 48 frames = 192 × 48 PNG.
- Naming: **lowercase ASCII snake_case**, with class/type folder and action filename. Match IDs in gameplay code; avoid filename case issues on Android.
- **Coordinate system:** character/world X at horizontal center; world Y at feet/baseline (currently approximately **355–356** on the 800 × 440 canvas). Pivot is `{x: frameWidth / 2, y: frameHeight - 1}`.
- Author facing **right**. Renderer mirrors for left-facing animations using canvas transforms (do not duplicate sheets).
- **Nearest-neighbor only:** `ctx.imageSmoothingEnabled=false`; art pixels should remain crisp on landscape phones.
- Default stage size: heroes **32 × 48** canvas pixels at **2×** in the current dungeon (64 × 96 displayed). Common monsters **32 × 32** at **2×** (64 × 64), elites **48 × 48** at **2×**, boss **80 × 80** at **2×** (160 × 160). Adjust scale slightly per phone without stretching aspect ratio.
- Never show full-screen loading or media controls while images load. Load PNGs once, cache images/frames, retain existing procedurally drawn actors if any asset fails.
- Keep animation frame state **outside persisted save data**. No change to `dungeonfront_merchants_rise_save_v1`.
- No animated DOM overlays; use canvas for sprites, effects, and particles. Target existing ~30 FPS cap, no unbounded particle arrays.

### Standard actions and sheet sizes

| Action | Frames | Hero sheet | Monster sheet | Playback |
|:--|--:|:--|:--|:--|
| `idle` | 4 | 128 × 48 | 128 × 32 | 5 FPS, loop |
| `walk` | 6 | 192 × 48 | 192 × 32 | 9 FPS, loop |
| `attack` | 6 | 192 × 48 | 192 × 32 | 12 FPS, once per attack |
| `hurt` | 2 | 64 × 48 | 64 × 32 | 10 FPS, once |
| `death` | 6 | 192 × 48 | 192 × 32 | 9 FPS, stop on last frame |
| `special` | 6 | 192 × 48 | 192 × 32 | 10 FPS, action-specific |

`special` applies to class actions (below). Elite sheets use the same frame counts at 48 × 48; boss sheets use 80 × 80. Crop source frames precisely, keeping feet fixed so characters don't jump while cycling frames.

## 2. Exact repository structure

Keep images in `app/src/main/assets/sprites/` so they're bundled offline in the Android APK. **Folders below are target paths; files do not yet exist.**

```text
app/src/main/assets/
├── game.js                  # existing shop and dungeon canvas
├── dungeon.js               # existing combat/state logic
├── contracts.js             # existing roster, fatigue and contracts
├── sprite-system.js         # NEW: preloader, frame resolver, fallback draw
└── sprites/
    ├── manifest.json        # NEW, deployed only when first art is ready
    ├── actors/
    │   ├── knight/          # idle, walk, attack, hurt, death, block
    │   ├── ranger/          # idle, walk, attack, hurt, death, shoot
    │   ├── mage/            # idle, walk, attack, hurt, death, cast
    │   ├── cleric/          # idle, walk, attack, hurt, death, heal
    │   ├── rogue/           # idle, walk, attack, hurt, death, backstab
    │   └── mercenary/       # idle, walk, attack, hurt, death, heavy
    ├── monsters/
    │   ├── slime/           # idle, walk, attack, hurt, death
    │   ├── goblin/          # idle, walk, attack, hurt, death
    │   ├── skeleton/        # idle, walk, attack, hurt, death
    │   ├── imp/             # idle, walk, attack, hurt, death
    │   ├── spider/          # idle, walk, attack, hurt, death
    │   ├── wraith/          # idle, walk, attack, hurt, death
    │   ├── hound/           # idle, walk, attack, hurt, death
    │   ├── guardian/        # idle, walk, attack, hurt, death (48 × 48)
    │   └── abyssal_sovereign/ # idle, walk, attack, hurt, death (80 × 80)
    ├── events/
    │   ├── chest/           # idle, open
    │   ├── trap/            # idle, trigger
    │   ├── shrine/          # idle, activate
    │   ├── hidden/          # idle, reveal
    │   └── merchant/        # idle, interact
    ├── effects/
    │   ├── slash.png
    │   ├── heavy_slash.png
    │   ├── arrow.png
    │   ├── magic_bolt.png
    │   ├── healing_pulse.png
    │   ├── hit_flash.png
    │   ├── critical.png
    │   └── death_burst.png
    └── ui/
        ├── classes/         # knight, ranger, mage, cleric, rogue, mercenary
        ├── condition/       # ready, busy, injured, exhausted
        └── rarity/          # uncommon, rare, epic
docs/
└── SPRITE_PRODUCTION_PLAN.md # this file
tests/
└── sprites.test.js          # NEW: validation and fallback tests
```

Examples of *exact filenames*:
- `sprites/actors/knight/idle.png`, `sprites/actors/knight/block.png`
- `sprites/actors/mage/cast.png`, `sprites/actors/ranger/shoot.png`
- `sprites/monsters/abyssal_sovereign/death.png`
- `sprites/events/chest/open.png`, `sprites/events/trap/trigger.png`
- `sprites/effects/magic_bolt.png`, `sprites/ui/classes/cleric.png`

## 3. Character sprite checklist: 6 classes

For **every class**, produce `idle.png` (4 frames), `walk.png` (6), `attack.png` (6), `hurt.png` (2), and `death.png` (6), all at 32 × 48 **per frame**.

| Class ID (from `dungeon.js`) | Shape and material cues | Signature action, 6 frames | Equipment overlays |
|:--|:--|:--|:--|
| Knight | full helm, broad shoulders, steel plate and shield | `block.png` | `shield`, `armor`, `blade` |
| Ranger | hood, leather jerkin, asymmetrical cloak, long bow | `shoot.png` | `bow`, light armor |
| Mage | long robe, angled staff, blue-violet spell light | `cast.png` | `staff`, magical glow |
| Cleric | ivory mantle, gold emblem, short staff/satchel | `heal.png` | `staff`, supplies |
| Rogue | low slim silhouette, scarf/hood, two blades | `backstab.png` | `blade`, cloak |
| Mercenary | patchwork iron/leather armor, heavy weapon | `heavy.png` | `forged`, `armor` |

**Equipment overlay rule:** in first integration, show class-appropriate equipment in base sprite. In second pass, place a visible 16 × 16 weapon/shield overlay at fixed hand anchor points. Choose overlay from `a.equipment`; fallback to `a.gear` for migrated heroes. Avoid loading a full sprite combination for every item/class.

**Class icon rule:** each class receives a 16 × 16 transparent PNG, named `sprites/ui/classes/<class>.png`. Show beside names in contract roster and compact party panel, not above every world character.

### Production quantities

- 6 classes × **5 shared actions = 30 PNG sheets**.
- 6 classes × **1 signature action = 6 more PNG sheets**.
- **6 UI class icons**.
- **First playable delivery:** all 6 `idle` + 6 `walk` + 6 `attack` sheets = **18 class sheets**, with procedural fallback for `hurt`, `death`, and signature actions until ready.

## 4. Monster sprite checklist: 9 existing types

The game currently uses **8 normal enemy IDs + 1 boss**, indexed 0–8. Sprite mapping must preserve these IDs (do not alter monsters or save schemas just to change art).

| ID | Game name | Folder | Design | Base cell |
|--:|:--|:--|:--|:--|
| 0 | Cave Slime | `slime` | translucent cave slime with bright core | 32 × 32 |
| 1 | Goblin Scout | `goblin` | hunched spear/knife scout | 32 × 32 |
| 2 | Bone Sentinel | `skeleton` | bone warrior, rusted buckler | 32 × 32 |
| 3 | Ember Imp | `imp` | ember horns, burning claws | 32 × 32 |
| 4 | Crypt Spider | `spider` | low eight-leg shape, glowing eyes | 32 × 32 |
| 5 | Drowned Wraith | `wraith` | spectral floating silhouette | 32 × 32 |
| 6 | Abyss Hound | `hound` | savage quadruped with red eyes | 32 × 32 |
| 7 | Hollow Guardian | `guardian` | large armored brute | 48 × 48 |
| 8 | The Abyssal Sovereign | `abyssal_sovereign` | towering crowned void knight, horns and aura | 80 × 80 |

For each monster: `idle` 4, `walk` 6, `attack` 6, `hurt` 2, `death` 6. **45 monster sheets total.** Make boss telegraphs exaggerated without covering the party HP indicators.

## 5. Event and effect asset checklist

### Dungeon events (5 kinds × 2 sheets = 10)

All event icons use **32 × 32** frames, 4 for `idle` and 6 for activation; merchant can use 32 × 48 and align feet with characters.

- [ ] Chest `idle.png` + `open.png`: bronze clasp, lid visibly opens.
- [ ] Trap `idle.png` + `trigger.png`: pressure plate/spike burst.
- [ ] Shrine `idle.png` + `activate.png`: cracked stone, mint/gold pulse.
- [ ] Hidden chamber `idle.png` + `reveal.png`: rune wall becomes doorway.
- [ ] Wandering merchant `idle.png` + `interact.png`: bag, lantern, wares.

Map event sprite selection to existing `d.events[].type` values `chest | trap | shrine | hidden | merchant`. Per-hero `seenEvents` already prevents re-triggering a discovery.

### Combat effects (8 sheets, one row each)

| Filename | Cell × frames | Visual cue |
|:--|:--|:--|
| `slash.png` | 32 × 32 × 4 | quick bright arc |
| `heavy_slash.png` | 48 × 48 × 5 | broad red-gold strike |
| `arrow.png` | 32 × 16 × 4 | thin projectile trail |
| `magic_bolt.png` | 32 × 32 × 6 | purple/blue magic impact |
| `healing_pulse.png` | 48 × 48 × 6 | green-gold rising motes |
| `hit_flash.png` | 32 × 32 × 3 | brief white-red contact |
| `critical.png` | 48 × 48 × 5 | sharp gold starburst |
| `death_burst.png` | 48 × 48 × 6 | dissolve/collapse particles |

Effects render at actor/target world coordinates. Spawn once on event transitions, then expire; never play a full effect on every canvas frame. Use `special`, `swing`, and target hit state already present in dungeon logic as initial triggers.

### UI indicators

- [ ] 6 × 16 × 16 class icons.
- [ ] 4 × 16 × 16 condition icons: `ready`, `busy`, `injured`, `exhausted`.
- [ ] 3 × 16 × 16 rarity icons: `uncommon`, `rare`, `epic`.
- [ ] Optional HUD cleanup: same compact party roster, status colors and contract rank system; **do not** re-expand cards beyond one phone screen.

## 6. Sprite manifest structure (contract, not live art yet)

Implement `sprites/manifest.json` when corresponding PNGs exist. Every manifest entry declares the actual shipped path and metadata:

```json
{
  "version": 1,
  "actors": {
    "Knight": {
      "idle": { "src": "sprites/actors/knight/idle.png", "frameW": 32, "frameH": 48, "frames": 4, "fps": 5, "loop": true },
      "walk": { "src": "sprites/actors/knight/walk.png", "frameW": 32, "frameH": 48, "frames": 6, "fps": 9, "loop": true },
      "attack": { "src": "sprites/actors/knight/attack.png", "frameW": 32, "frameH": 48, "frames": 6, "fps": 12, "loop": false }
    }
  }
}
```

The loader should accept missing action/class entries, skip absent image files, and use existing `drawActor`/`drawMonster` until sprites resolve. A missing image must **never** stop the animation loop. Only load images while the game is active. Cache each source once.

## 7. Integration sequence in the real repo

### Batch A — class-based world actors (**do this first**)

- [x] Create `sprite-system.js` with `preload`, `getFrame`, `draw` and safe procedural fallback; store atlas metadata in `sprites/manifest.json`.
- [x] Produce and commit all 18 class PNG sheets (`idle`/`walk`/`attack` for six classes).
- [x] Connect new script in `index.html` before `game.js`.
- [x] Replace only the *dungeon* `drawActor(...)` call first; preserve shop customers' current look until tested.
- [x] Map walking, returning, fighting, and extracted statuses to new animation action/fallback; healing special animation remains for the next signature-sheet pass.
- [ ] Keep actor name labels, health bars, party symbols, hit targets, and auto-follow behavior unchanged.
- [ ] Test 5-person parties, floor changes and camera scrolling on an Android phone.

### Batch B — roster icons and visible gear

- [x] Show class-specific 16px icons in the roster and contract board. Party inspection icons are still planned.
- [ ] Add equipment overlay sprites, draw at correct hand anchors.
- [ ] Check narrow phone layouts for clipping and touch-target size.
- [ ] Do not change contract assignment, permanent death or staff XP data.

### Batch C — monsters and boss

- [x] Add original 8 common enemy animation sets; render by `m.kind` exactly.
- [x] Add dedicated Hollow Guardian and Abyssal Sovereign sprites, including a unique boss special action.
- [ ] Verify boss HP bar, hit target and no clipping against top raid banner.
- [x] Animate boss death briefly and retain entrance-side extraction (automated regression covered).

### Batch D — combat visual effects

- [x] Add simulation-driven slash, arrow, spell, heal, block/contact, crit and death visual effects with existing procedural fallback.
- [x] Use bounded per-entity effect clocks (no separate unbounded particle list) and expire effects promptly.
- [x] Keep numerical combat in `dungeon.js` authoritative; sprites do not modify damage.
- [x] Keep effects localized to actors/targets without screen shake or full-screen flash.

### Batch E — events and final UI pass

- [x] Replace simple dungeon event squares with animated treasure chests, traps, shrines, secret chambers, and wandering trader sprites; preserve procedural fallback.
- [x] Use per-hero seen-event records for visual discovered states, and one-shot activation effects; do not replay treasure rewards.
- [x] Add icons and condition seals for injury/fatigue, rank-colored contract statuses and extraction progress; preserve permanent-death counters.
- [x] Keep the claim action and completion popup gated until every surviving hired adventurer has reached the start portal; automated regression covers this.
- [x] Keep Floor 8's far end empty; leave floor-forward passages on floors 1–7 only.

## 8. Must-pass acceptance checks before making an APK

- [ ] Existing local save loads and upgrades; no lost gold/roster/contracts.
- [ ] The original `dabski_intro.mp4` has identical SHA-256: `075832e834948055122d81d901a30c97b3c898667f20e0935c5c664cd7af756d`.
- [ ] Sprite manifests point to real bundled PNGs and image dimensions divide evenly into frames.
- [ ] Missing / slow / corrupt sprite does not freeze an active game; procedural fallback appears.
- [ ] Shop tab switching remains responsive with multiple parties on different floors.
- [ ] Max 5 characters per party (including escorted courier); UI remains compact.
- [ ] Regular dungeon and contract dungeon remain separate.
- [ ] Exiting a floor uses the portal at the **left / beginning**; right side of floors 1–7 leads onward.
- [ ] Raid floor right side stays blank; after boss defeat, survivors exit at left, never loop boss.
- [ ] Contract claim/report stays hidden while returning, appears only after all survivors extract.
- [ ] Existing JS tests plus `tests/sprites.test.js` succeed; finally build a signed APK **only when requested**.

## Immediate next concrete deliverable

**Visual art passes complete:** [18 hero sheets](SPRITE_PREVIEW.md), [monster/boss and effects](MONSTER_SPRITE_PREVIEW.md), and [animated dungeon discoveries and interface icons](DUNGEON_EVENT_PREVIEW.md). Next: Android device playtesting, equipment overlay sprites, hero signature poses, and remaining UI polish.

## Visual upgrade implementation notes (Batches C/D)

- **46 monster/boss sheets** and **8 effect sheets** are reproducibly generated with Python's standard library: `python3 tools/generate_monster_art.py`. No image service dependency.
- GitHub Actions [generates and commits the sprite assets](../.github/workflows/generate-monster-assets.yml) only on the development branch, not an Android build.
- [Preview the new monsters, raid boss and combat effects](MONSTER_SPRITE_PREVIEW.md).
- `node tests/sprites.test.js` checks all **72** actual PNG sheets for dimensions, transparency, and distinct animation frames; `node tests/visual-combat.test.js` checks boss specials, hits, monster death, heals and raid extraction.
- Next unfinished art batch: **B/E** (class UI icons, event object sheets and visual UI cleanup), then physical Android playtesting and optional final APK on request.

## Event & guild UI production notes (Batch E)

- Original event animation and 16px class/condition/rarity icons are produced by `python3 tools/generate_event_art.py`, integrated through `DFSprites.drawEvent` and normal DOM icon images.
- Each event has idle and activate sprites. The original per-hero `seenEvents` data controls whether a location looks explored; an activation pulse is purely visual.
- The contract board shows the party's extraction progress, rank-colored missions, and explicit payout status while returning. The payment button is still not rendered until extraction finishes.
- [View real animated encounter sheets and icons](DUNGEON_EVENT_PREVIEW.md).
- `node tests/sprites.test.js` now verifies **95** shipped PNG files; `node tests/events-art.test.js` tests activation, event isolation and UI status wiring.
- Phone layout review and Android hardware performance checks are still pending. The signed APK remains on hold.
