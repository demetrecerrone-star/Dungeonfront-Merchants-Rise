# Dungeonfront: Merchant's Rise — Adventurer Redesign v2

**Status: CONCEPT PREVIEW ONLY — artwork is NOT approved, not a production sprite sheet, and MUST NOT be bundled into an APK until the user reviews and approves the class designs.**

**Target branch:** `work/v0.9-character-art-v2` from the v0.9 shop-layout preview.  
**Style:** original high-detail, anime-inspired modern fantasy 2D; modern mobile RPG rather than retro pixel. Transparent, hand-painted/cel-shaded sprites with clean anti-aliased outlines and controlled magical effects.
**Platform:** offline Android WebView; landscape gameplay canvas 800 × 440.

## Class-by-class character direction

| Class | Concept name | Shape and equipment | Materials and accents | Signature animation |
|---|---|---|---|---|
| **Knight** | Argent Bulwark | Broad plated shoulders, decorated steel shield, one-hand longsword, knightly cape; feet planted | Worn steel, midnight blue, warm gold, restrained cyan guard glow | **Aegis Guard:** shield-braced blue-gold barrier |
| **Ranger** | Verdant Wayfinder | Athletic hooded archer, asymmetric traveling cloak, elaborate longbow and quiver | Pine green, earthy brown, muted brass, emerald arrow trail | **Piercing Volley:** draw, aim and launch luminous green arrow |
| **Mage** | Astral Weaver | Sweeping layered robe, pointed/angled hat option, crystalline staff, visible hand gesture | Indigo, midnight blue, royal violet, sapphire magic | **Arcane Nova:** rotating sigil and blue-violet blast |
| **Cleric** | Dawnkeeper | Ivory mantle, sun medallion, ornate staff, ceremonial split robes | Ivory, champagne gold, pearl, honey and soft amber | **Sanctuary Pulse:** golden healing circle and rising motes |
| **Rogue** | Crimson Shadow | Fitted leather, thin hood/scarf, twin blades, lightweight layered cloth | Charcoal, wine red, polished dark steel, crimson slash | **Shadowstep:** swift blur and crossed red-magenta strike |
| **Mercenary** | Iron Vanguard | Rugged armor, heavy broad axe, thick scarf, old dents and reinforced boots | Gunmetal, dark russet, weathered bronze, orange-red attack streak | **Breaker Strike:** arcing heavy weapon sweep and sparks |

These are **visual reference names only**. The actual game identifiers stay `Knight`, `Ranger`, `Mage`, `Cleric`, `Rogue`, `Mercenary`, including their corresponding save data and class behavior.

## Design coherence checklist

- Characters from the same game: consistent stylized adult anatomical proportions (roughly 6.5–7 heads), clean shapes, detailed yet readable clothing and weapons.
- Keep silhouettes unique in black-and-white thumbnail. Weapons must not merge into limbs or clothing.
- Lighting upper-left warm key, secondary cool edge; magical accents bright only during actions.
- Facial hair, hair length, skin tones and presenting gender should support future variations; no class must be locked to one appearance.
- No copyrighted characters or reused franchise symbols; original visual language.
- Each exported animation frame must have true transparent alpha. Do not bake dungeon scenery, names, UI or fake motion blur into the artwork.
- Avoid fine details that disappear at the target on-screen render size; check thumbnails against both bright shop and dark dungeon backgrounds.
- Art must look smooth rather than nearest-neighbor/pixelated.

## Proposed technical sprite contract (pending validation)

| Action | Frames | Nominal FPS | Horizontal sheet at 128 × 192 per frame |
|---|---:|---:|---:|
| Idle | 8 | 8 | 1024 × 192 |
| Walk | 10 | 12 | 1280 × 192 |
| Attack | 12 | 20 | 1536 × 192 |
| Hurt | 5 | 15 | 640 × 192 |
| Death | 12 | 14 | 1536 × 192 |
| Special | 12 | 18 | 1536 × 192 |

Total: **36 action sheets**, **354 frames** across six classes. These are *specifications*, not currently generated assets.

- Transparent RGBA PNG source. One action per horizontal strip; frames packed tightly and uniformly.
- Consistent feet position: image pivot at (64,191). All source characters face **right**, and draw code may flip left-facing actors.
- Nominal logical display target approximately **72 × 108** at a uniform scale, tuned to on-screen legibility and crowding with five-member parties; never change gameplay colliders to match artwork.
- Proposed new file paths: `app/src/main/assets/sprites/actors_v2/<class>/<action>.png`. Keep v1 `sprites/actors/` files until v2 is working.
- Renderer must be upgraded to accept per-asset frame dimensions, per-action counts and smooth image sampling for these assets. Current renderer hardcodes 32 × 48 and only three hero actions, so simply copying 128 × 192 sheets would **not work**.
- Combat animation playback and damage resolution remain separate; a longer wind-up should not silently change battle damage rates or contract timings.
- Preserve legacy/class fallback when an optional frame is absent or not loaded.
- Guard draw performance and texture memory on Samsung Galaxy S23 FE Android 16, especially simultaneous adventurers, dungeon monsters, VFX and open shop.
- **Keep existing applicationId, signing identity, save key `dungeonfront_merchants_rise_save_v1`, portal and contract/extraction rules.**

## Review gates — mandatory before APK integration

1. Present one lineup showing all six characters in the same finished art style.
2. Let user approve or request changes to each class's look, silhouette, colors, outfit and weapon.
3. Only after approval: produce single-character turnaround/hero pose references and a small representative idle-walk-attack test atlas.
4. Validate silhouette consistency, frame continuity and alpha/sprite pivot via automated checks.
5. Implement the **opt-in v2 renderer** with seamless fallback to v1 on a separate preview branch.
6. Run full JavaScript regressions and Android emulator screenshot/animation tests, then provide a **review APK** without automatically replacing a public release.
7. Only publish a normal update after user accepts mobile preview.

## Monster art note

The generated **concept preview may include example creatures or example bosses that are not part of the currently implemented enemy roster**. They are purely illustrative and do not authorize adding new gameplay enemies. Existing monster IDs remain: `slime`, `goblin`, `skeleton`, `imp`, `spider`, `wraith`, `hound`, `guardian`, `abyssal_sovereign`. Once adventurer art is approved, create a corresponding monster redesign sheet for precisely these nine creatures.

## Immediate next action

**Wait for feedback on the six-character visual concept before generating final gameplay sprites or changing APK art.**
