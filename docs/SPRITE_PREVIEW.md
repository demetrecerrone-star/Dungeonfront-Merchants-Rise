# Dungeonfront — Adventurer Sprite Preview

These are the **actual shipped PNG sprite sheets** on the unreleased development branch, not concept images. Each sheet contains horizontally aligned transparent 32×48 frames. GitHub may display them at their native small size; open an image for full-resolution inspection.

| Class | Idle (4 frames) | Walk (6 frames) | Attack (6 frames) |
|:--|:--|:--|:--|
| **Knight** | ![knight idle](../app/src/main/assets/sprites/actors/knight/idle.png) | ![knight walk](../app/src/main/assets/sprites/actors/knight/walk.png) | ![knight attack](../app/src/main/assets/sprites/actors/knight/attack.png) |
| **Ranger** | ![ranger idle](../app/src/main/assets/sprites/actors/ranger/idle.png) | ![ranger walk](../app/src/main/assets/sprites/actors/ranger/walk.png) | ![ranger attack](../app/src/main/assets/sprites/actors/ranger/attack.png) |
| **Mage** | ![mage idle](../app/src/main/assets/sprites/actors/mage/idle.png) | ![mage walk](../app/src/main/assets/sprites/actors/mage/walk.png) | ![mage attack](../app/src/main/assets/sprites/actors/mage/attack.png) |
| **Cleric** | ![cleric idle](../app/src/main/assets/sprites/actors/cleric/idle.png) | ![cleric walk](../app/src/main/assets/sprites/actors/cleric/walk.png) | ![cleric attack](../app/src/main/assets/sprites/actors/cleric/attack.png) |
| **Rogue** | ![rogue idle](../app/src/main/assets/sprites/actors/rogue/idle.png) | ![rogue walk](../app/src/main/assets/sprites/actors/rogue/walk.png) | ![rogue attack](../app/src/main/assets/sprites/actors/rogue/attack.png) |
| **Mercenary** | ![mercenary idle](../app/src/main/assets/sprites/actors/mercenary/idle.png) | ![mercenary walk](../app/src/main/assets/sprites/actors/mercenary/walk.png) | ![mercenary attack](../app/src/main/assets/sprites/actors/mercenary/attack.png) |

The game loads these assets via `sprite-system.js`, using current hand-drawn silhouettes as a fallback if any sprites fail. Animations currently cover idle, walking/returning, and basic attacks; hurt, death, and class-specific signature sheets will follow.

**Quality checks:** `node tests/sprites.test.js` verifies the PNG signature, each frame-grid dimension, indexed transparency, and meaningful differences between animation frames.

**APK status:** no Android APK built for this development-only art pass.
