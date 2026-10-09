# Dungeonfront: Merchant's Rise — Pixel-Art Production Blueprint

**Status:** Art specification and implementation checklist; **not** a completed sprite pack or an Android release.
**Target branch:** \`work/v0.8-roster-combat-treasure\`
**Target client:** Android WebView, offline, landscape; dungeon canvas **800 × 440**.
**Style:** original gritty medieval fantasy pixel art, high-contrast silhouettes, subdued materials, warm torches, readable at phone size.

## 1. Locked rendering contract

- Every PNG must be original or properly licensed, lossless RGBA, transparent background, no lettering or fake UI.
- **1 animation/action per horizontal sprite sheet**, no padding between cells. Example: six 32 × 48 frames = 192 × 48 PNG.
- Naming: **lowercase ASCII snake_case**, with class/type folder and action filename. Match IDs in gameplay code; avoid filename case issues on Android.
- **Coordinate system:** character/world X at horizontal center; world Y at feet/baseline (currently approximately **355–356** on the 800 × 440 canvas). Pivot is \`{x: frameWidth / 2, y: frameHeight - 1}\`.
- Author facing **right**. Renderer mirrors for left-facing animations using canvas transforms (do not duplicate sheets).
- **Nearest-neighbor only:** \`ctx.imageSmoothingEnabled=false\`; art pixels should remain crisp on landscape phones.
- Default stage size: heroes **32 × 48** canvas pixels at **2×** in the current dungeon (64 × 96 displayed). Common monsters **32 × 32** at **2×** (64 × 64), elites **48 × 48** at **2×**, boss **80 × 80** at **2×** (160 × 160). Adjust scale slightly per phone without stretching aspect ratio.
- Never show full-screen loading or media controls while images load. Load PNGs once, cache images/frames, retain existing procedurally drawn actors if any asset fails.
- Keep animation frame state **outside persisted save data**. No change to \`dungeonfront_merchants_rise_save_v1\`.
- No animated DOM overlays; use canvas for sprites, effects, and particles. Target existing ~30 FPS cap, no unbounded particle arrays.

### Standard actions and sheet sizes

| Action | Frames | Hero sheet | Monster sheet | Playback |
|:--|--:|:--|:--|:--|
| \`idle\` | 4 | 128 × 48 | 128 × 32 | 5 FPS, loop |
| \`walk\` | 6 | 192 × 48 | 192 × 32 | 9 FPS, loop |
| \`attack\` | 6 | 192 × 48 | 192 × 32 | 12 FPS, once per attack |
| \`hurt\` | 2 | 64 × 48 | 64 × 32 | 10 FPS, once |
| \`death\` | 6 | 192 × 48 | 192 × 32 | 9 FPS, stop on last frame |
| \`special\` | 6 | 192 × 48 | 192 × 32 | 10 FPS, action-specific |

\`special\` applies to class actions (below). Elite sheets use the same frame counts at 48 × 48; boss sheets use 80 × 80. Crop source frames precisely, keeping feet fixed so characters don't jump while cycling frames.

## 2. Exact repository structure

Keep images in \`app/src/main/assets/sprites/\` so they're bundled offline in the Android APK. **Folders below are target paths; files do not yet exist.**

\`\`\`text
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
\`\`\`

Examples of *exact filenames*:
- \`sprites/actors/knight/idle.png\`, \`sprites/actors/knight/block.png\`
- \`sprites/actors/mage/cast.png\`, \`sprites/actors/ranger/shoot.png\`
- \`sprites/monsters/abyssal_sovereign/death.png\`
- \`sprites/events/chest/open.png\`, \`sprites/events/trap/trigger.png\`
- \`sprites/effects/magic_bolt.png\`, \`sprites/ui/classes/cleric.png\`

## 3. Character sprite checklist: 6 classes

For **every class**, produce \`idle.png\` (4 frames), \`walk.png\` (6), \`attack.png\` (6), \`hurt.png\` (2), and \`death.png\` (6), all at 32 × 48 **per frame**.

| Class ID (from \`dungeon.js\`) | Shape and material cues | Signature action, 6 frames | Equipment overlays |
|:--|:--|:--|:--|
| Knight | full helm, broad shoulders, steel plate and shield | \`block.png\` | \`shield\`, \`armor\`, \`blade\` |
| Ranger | hood, leather jerkin, asymmetrical cloak, long bow | \`shoot.png\` | \`bow\`, light armor |
| Mage | long robe, angled staff, blue-violet spell light | \`cast.png\` | \`staff\`, magical glow |
| Cleric | ivory mantle, gold emblem, short staff/satchel | \`heal.png\` | \`staff\`, supplies |
| Rogue | low slim silhouette, scarf/hood, two blades | \`backstab.png\` | \`blade\`, cloak |
| Mercenary | patchwork iron/leather armor, heavy weapon | \`heavy.png\` | \`forged\`, \`armor\` |

**Equipment overlay rule:** in first integration, show class-appropriate equipment in base sprite. In second pass, place a visible 16 × 16 weapon/shield overlay at fixed hand anchor points. Choose overlay from \`a.equipment\`; fallback to \`a.gear\` for migrated heroes. Avoid loading a full sprite combination for every item/class.

**Class icon rule:** each class receives a 16 × 16 transparent PNG, named \`sprites/ui/classes/<class>.png\`. Show beside names in contract roster and compact party panel, not above every world character.

### Production quantities

- 6 classes × **5 shared actions = 30 PNG sheets**.
- 6 classes × **1 signature action = 6 more PNG sheets**.
- **6 UI class icons**.
- **First playable delivery:** all 6 \`idle\` + 6 \`walk\` + 6 \`attack\` sheets = **18 class sheets**, with procedural fallback for \`hurt\`, \`death\`, and signature actions until ready.

## 4. Monster sprite checklist: 9 existing types

The game currently uses **8 normal enemy IDs + 1 boss**, indexed 0–8. Sprite mapping must preserve these IDs (do not alter monsters or save schemas just to change art).

| ID | Game name | Folder | Design | Base cell |
|--:|:--|:--|:--|:--|
| 0 | Cave Slime | \`slime\` | translucent cave slime with bright core | 32 × 32 |
| 1 | Goblin Scout | \`goblin\` | hunched spear/knife scout | 32 × 32 |
| 2 | Bone Sentinel | \`skeleton\` | bone warrior, rusted buckler | 32 × 32 |
| 3 | Ember Imp | \`imp\` | ember horns, burning claws | 32 × 32 |
| 4 | Crypt Spider | \`spider\` | low eight-leg shape, glowing eyes | 32 × 32 |
| 5 | Drowned Wraith | \`wraith\` | spectral floating silhouette | 32 × 32 |
| 6 | Abyss Hound | \`hound\` | savage quadruped with red eyes | 32 × 32 |
| 7 | Hollow Guardian | \`guardian\` | large armored brute | 48 × 48 |
| 8 | The Abyssal Sovereign | \`abyssal_sovereign\` | towering crowned void knight, horns and aura | 80 × 80 |

For each monster: \`idle\` 4, \`walk\` 6, \`attack\` 6, \`hurt\` 2, \`death\` 6. **45 monster sheets total.** Make boss telegraphs exaggerated without covering the party HP indicators.

## 5. Event and effect asset checklist

### Dungeon events (5 kinds × 2 sheets = 10)

All event icons use **32 × 32** frames, 4 for \`idle\` and 6 for activation; merchant can use 32 × 48 and align feet with characters.

- [ ] Chest \`idle.png\` + \`open.png\`: bronze clasp, lid visibly opens.
- [ ] Trap \`idle.png\` + \`trigger.png\`: pressure plate/spike burst.
- [ ] Shrine \`idle.png\` + \`activate.png\`: cracked stone, mint/gold pulse.
- [ ] Hidden chamber \`idle.png\` + \`reveal.png\`: rune wall becomes doorway.
- [ ] Wandering merchant \`idle.png\` + \`interact.png\`: bag, lantern, wares.

Map event sprite selection to existing \`d.events[].type\` values \`chest | trap | shrine | hidden | merchant\`. Per-hero \`seenEvents\` already prevents re-triggering a discovery.

### Combat effects (8 sheets, one row each)

| Filename | Cell × frames | Visual cue |
|:--|:--|:--|
| \`slash.png\` | 32 × 32 × 4 | quick bright arc |
| \`heavy_slash.png\` | 48 × 48 × 5 | broad red-gold strike |
| \`arrow.png\` | 32 × 16 × 4 | thin projectile trail |
| \`magic_bolt.png\` | 32 × 32 × 6 | purple/blue magic impact |
| \`healing_pulse.png\` | 48 × 48 × 6 | green-gold rising motes |
| \`hit_flash.png\` | 32 × 32 × 3 | brief white-red contact |
| \`critical.png\` | 48 × 48 × 5 | sharp gold starburst |
| \`death_burst.png\` | 48 × 48 × 6 | dissolve/collapse particles |

Effects render at actor/target world coordinates. Spawn once on event transitions, then expire; never play a full effect on every canvas frame. Use \`special\`, \`swing\`, and target hit state already present in dungeon logic as initial triggers.

### UI indicators

- [ ] 6 × 16 × 16 class icons.
- [ ] 4 × 16 × 16 condition icons: \`ready\`, \`busy\`, \`injured\`, \`exhausted\`.
- [ ] 3 × 16 × 16 rarity icons: \`uncommon\`, \`rare\`, \`epic\`.
- [ ] Optional HUD cleanup: same compact party roster, status colors and contract rank system; **do not** re-expand cards beyond one phone screen.

## 6. Sprite manifest structure (contract, not live art yet)

Implement \`sprites/manifest.json\` when corresponding PNGs exist. Every manifest entry declares the actual shipped path and metadata:

\`\`\`json
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
\`\`\`

The loader should accept missing action/class entries, skip absent image files, and use existing \`drawActor\`/\`drawMonster\` until sprites resolve. A missing image must **never** stop the animation loop. Only load images while the game is active. Cache each source once.

## 7. Integration sequence in the real repo

### Batch A — class-based world actors (**do this first**)

- [ ] Create \`sprite-system.js\` with \`loadManifest\`, \`getFrame\`, \`drawSprite\`, \`drawFallback\`.
- [ ] Produce 18 class sheets (\`idle\`/\`walk\`/\`attack\` for six classes).
- [ ] Connect new script in \`index.html\` before \`game.js\`.
- [ ] Replace only the *dungeon* \`drawActor(...)\` call first; preserve shop customers' current look until tested.
- [ ] Map statuses: \`exploring\`/ \`escorting\`/ \`returning\` → walk; \`fighting\`/ \`swing>0\` → attack; \`healing\` → class special; \`extracted\` never drawn.
- [ ] Keep actor name labels, health bars, party symbols, hit targets, and auto-follow behavior unchanged.
- [ ] Test 5-person parties, floor changes and camera scrolling on an Android phone.

### Batch B — roster icons and visible gear

- [ ] Show \`ui/classes/<class>.png\` beside class/name in roster and party inspection.
- [ ] Add equipment overlay sprites, draw at correct hand anchors.
- [ ] Check narrow phone layouts for clipping and touch-target size.
- [ ] Do not change contract assignment, permanent death or staff XP data.

### Batch C — monsters and boss

- [ ] Add the 8 common enemy sets; render by \`m.kind\` exactly.
- [ ] Add dedicated guardian and Abyssal Sovereign sprites.
- [ ] Verify boss HP bar, hit target and no clipping against top raid banner.
- [ ] Confirm boss death animation stops and raid portal rule remains intact.

### Batch D — combat visual effects

- [ ] Add event-driven slash, arrow, spell, heal, block, crit and death visuals.
- [ ] Cap live transient effects (e.g. 40 concurrent effects) and expire them fast.
- [ ] Keep numerical combat in \`dungeon.js\` authoritative; visuals do not modify damage.
- [ ] Avoid canvas shake or screen-covering flash by default on mobile.

### Batch E — events and final UI pass

- [ ] Replace simple dungeon event squares with chest, trap, shrine, secret and trader sprites.
- [ ] Show opened/discovered variants according to per-hero event state where applicable.
- [ ] Check condition indicators for injury, fatigue, returning, and permanent death.
- [ ] Ensure **no contract claim popup before the last survivor enters the start portal**.
- [ ] Keep Floor 8's far end intentionally empty until more floors are developed.

## 8. Must-pass acceptance checks before making an APK

- [ ] Existing local save loads and upgrades; no lost gold/roster/contracts.
- [ ] The original \`dabski_intro.mp4\` has identical SHA-256: \`075832e834948055122d81d901a30c97b3c898667f20e0935c5c664cd7af756d\`.
- [ ] Sprite manifests point to real bundled PNGs and image dimensions divide evenly into frames.
- [ ] Missing / slow / corrupt sprite does not freeze an active game; procedural fallback appears.
- [ ] Shop tab switching remains responsive with multiple parties on different floors.
- [ ] Max 5 characters per party (including escorted courier); UI remains compact.
- [ ] Regular dungeon and contract dungeon remain separate.
- [ ] Exiting a floor uses the portal at the **left / beginning**; right side of floors 1–7 leads onward.
- [ ] Raid floor right side stays blank; after boss defeat, survivors exit at left, never loop boss.
- [ ] Contract claim/report stays hidden while returning, appears only after all survivors extract.
- [ ] Existing JS tests plus \`tests/sprites.test.js\` succeed; finally build a signed APK **only when requested**.

## Immediate next concrete deliverable

Create the **18 primary class sprite sheets** and a fallback-aware renderer as **Batch A**. After that, visual inspection and one-device playtesting can be used to tune proportions before the remaining monster and effect production.
