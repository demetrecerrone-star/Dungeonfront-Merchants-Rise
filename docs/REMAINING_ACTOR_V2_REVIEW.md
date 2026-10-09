# Dungeonfront: Merchant's Rise — Remaining five classes (V2)

**STATUS: REVIEW-ONLY ART PROTOTYPES.** The Knight .4 preview remains the last Android-verified playable character build. **None of the new class assets are enabled in an APK.**

This branch prepares **only** the five existing missing v2 classes: **Ranger, Mage, Cleric, Rogue and Mercenary**. It does not add a Summoner, Dark Knight, Berserker or any extra classes appearing in style mood boards.

## Art direction

All five characters use the Knight's right-facing profile convention (flip to the left only when the character travels or attacks left), controlled shading and a matching 128 × 192 RGBA frame cell with consistent foot pivot. The final high-detail art should refine these prototypes rather than copy the vector look without review.

| Existing class | Theme / colors | Main weapon | Character-specific VFX |
|---|---|---|---|
| Ranger | Green hood, forest traveling cloak, leather, brass | Curved longbow + quiver | Emerald arrow / Piercing Volley |
| Mage | Deep indigo robes, violet trim, arcane orb | Crystal-tipped staff | Violet-blue arcane bolt |
| Cleric | Ivory traveling mantle, gold trim and crest | Radiant staff | Soft golden healing / sanctuary |
| Rogue | Burgundy/charcoal light leather, dagger-ready hood | Twin daggers | Crimson crossed slash |
| Mercenary | Heavy russet armor, scarred steel and reinforced boots | Two-handed war axe | Broad amber steel impact |

## Real asset preparation done

- **Generator:** `tools/generate_remaining_actor_art.js` returns consistent 128 × 192 transparent SVG frame strips with class-specific silhouettes and six distinct actions.
- **Baker:** `tools/build_remaining_actor_atlases.py` converts them into compressed transparent RGBA PNGs *offline*. The Android renderer **never** decodes SVG data URIs.
- **Animation matrix:** idle 8, walk 10, attack 12, hurt 5, death 12, special 12 frames — **59 frames per class; 295 frames and 30 sheets**.
- **Source sizes:** idle 1024 × 192, walk 1280 × 192, attack 1536 × 192, hurt 640 × 192, death 1536 × 192, special 1536 × 192.
- **Baked artifact:** `art-previews/Dungeonfront-Remaining-Five-Class-Animation-Previews.zip`, with manifest and a visual comparison sheet `art-previews/remaining-classes-v2/class-animation-preview.png`.
- **Test:** `tests/remaining-actors-v2.test.js` verifies class identity, animation counts, right-facing poses, frame registries and **no accidental APK activation**.
- **CI:** `.github/workflows/build-v2-art-review.yml` builds and uploads these assets for review **without building an APK**.

## Mandatory design review

**These sprites are editable animated prototypes, not final anime-illustrated characters.** Before installing them into the game, review and improve the full-size class designs to match the user's preferred modern fantasy detail. In particular check bow draw, dagger strikes, spell effects, axe weight, and wound/death silhouettes.

After user approval, stage PNGs in `app/src/main/assets/sprites/actors_v2/<lowercase-class>/<action>.png`, leave the Knight PNGs unchanged, then enable one class at a time in `approvedClasses` and update the shop/dungeon renderer. Maintain right/left enemy targeting and upright 0 HP retreat.

Run full JavaScript regressions and Android emulator tests for shop, public dungeon, contract dungeon, large party combat, dungeon progression and saving; only then produce a **signed preview APK**. Public release stays unchanged until physical Samsung Galaxy S23 FE Android 16 approval.

**Unchanged:** package `com.dabski.dungeonfront`, `dungeonfront_merchants_rise_save_v1` key, signed upgrade path, contracts, monster AI, portals and extraction, chest rewards, sale/shop state and original Dabski intro.
