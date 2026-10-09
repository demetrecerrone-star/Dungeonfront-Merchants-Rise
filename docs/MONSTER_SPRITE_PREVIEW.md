# Dungeonfront — Monster, Boss & Combat Effect Sprite Preview

These are **actual generated PNG sprite sheets committed to the unreleased development branch**, not concept art. Each PNG is a horizontal strip of animation frames (transparent, indexed pixel art), automatically selected by the dungeon renderer. The original Dabski intro and local save identifier are unchanged.

## 8 regular monsters + raid boss

| Dungeon enemy | Idle (4) | Attack (6) | Death (6) |
|:--|:--|:--|:--|
| **Cave Slime** | ![Cave Slime idle](../app/src/main/assets/sprites/monsters/slime/idle.png) | ![Cave Slime attack](../app/src/main/assets/sprites/monsters/slime/attack.png) | ![Cave Slime death](../app/src/main/assets/sprites/monsters/slime/death.png) |
| **Goblin Scout** | ![Goblin Scout idle](../app/src/main/assets/sprites/monsters/goblin/idle.png) | ![Goblin Scout attack](../app/src/main/assets/sprites/monsters/goblin/attack.png) | ![Goblin Scout death](../app/src/main/assets/sprites/monsters/goblin/death.png) |
| **Bone Sentinel** | ![Bone Sentinel idle](../app/src/main/assets/sprites/monsters/skeleton/idle.png) | ![Bone Sentinel attack](../app/src/main/assets/sprites/monsters/skeleton/attack.png) | ![Bone Sentinel death](../app/src/main/assets/sprites/monsters/skeleton/death.png) |
| **Ember Imp** | ![Ember Imp idle](../app/src/main/assets/sprites/monsters/imp/idle.png) | ![Ember Imp attack](../app/src/main/assets/sprites/monsters/imp/attack.png) | ![Ember Imp death](../app/src/main/assets/sprites/monsters/imp/death.png) |
| **Crypt Spider** | ![Crypt Spider idle](../app/src/main/assets/sprites/monsters/spider/idle.png) | ![Crypt Spider attack](../app/src/main/assets/sprites/monsters/spider/attack.png) | ![Crypt Spider death](../app/src/main/assets/sprites/monsters/spider/death.png) |
| **Drowned Wraith** | ![Drowned Wraith idle](../app/src/main/assets/sprites/monsters/wraith/idle.png) | ![Drowned Wraith attack](../app/src/main/assets/sprites/monsters/wraith/attack.png) | ![Drowned Wraith death](../app/src/main/assets/sprites/monsters/wraith/death.png) |
| **Abyss Hound** | ![Abyss Hound idle](../app/src/main/assets/sprites/monsters/hound/idle.png) | ![Abyss Hound attack](../app/src/main/assets/sprites/monsters/hound/attack.png) | ![Abyss Hound death](../app/src/main/assets/sprites/monsters/hound/death.png) |
| **Hollow Guardian** | ![Hollow Guardian idle](../app/src/main/assets/sprites/monsters/guardian/idle.png) | ![Hollow Guardian attack](../app/src/main/assets/sprites/monsters/guardian/attack.png) | ![Hollow Guardian death](../app/src/main/assets/sprites/monsters/guardian/death.png) |
| **Abyssal Sovereign** | ![Abyssal Sovereign idle](../app/src/main/assets/sprites/monsters/abyssal_sovereign/idle.png) | ![Abyssal Sovereign attack](../app/src/main/assets/sprites/monsters/abyssal_sovereign/attack.png) | ![Abyssal Sovereign death](../app/src/main/assets/sprites/monsters/abyssal_sovereign/death.png) |

Each enemy also has walking and hurt animations. The **Abyssal Sovereign** has a dedicated six-frame special attack:

![Abyssal Sovereign special attack](../app/src/main/assets/sprites/monsters/abyssal_sovereign/special.png)

## Eight combat effects

| Effect | Animated pixel sheet |
|:--|:--|
| **slash** | ![slash](../app/src/main/assets/sprites/effects/slash.png) |
| **heavy slash** | ![heavy_slash](../app/src/main/assets/sprites/effects/heavy_slash.png) |
| **arrow** | ![arrow](../app/src/main/assets/sprites/effects/arrow.png) |
| **magic bolt** | ![magic_bolt](../app/src/main/assets/sprites/effects/magic_bolt.png) |
| **healing pulse** | ![healing_pulse](../app/src/main/assets/sprites/effects/healing_pulse.png) |
| **hit flash** | ![hit_flash](../app/src/main/assets/sprites/effects/hit_flash.png) |
| **critical** | ![critical](../app/src/main/assets/sprites/effects/critical.png) |
| **death burst** | ![death_burst](../app/src/main/assets/sprites/effects/death_burst.png) |

## Runtime integration

- Monster sheets match the nine existing `DFDungeon.monsterKinds` indices; no monster or save reset.
- One-time attack pulses, ranged spells, healing, critical hits, contact flashes and monster deaths are driven by simulation state, not free-running CSS effects.
- Monsters play their death animation briefly while combat still treats them as defeated. Victorious raiders continue toward the entrance-side extraction portal; the final raid floor still has no far-end passage.
- `sprite-system.js` falls back to the existing procedural monster/effect visuals if a PNG cannot be read.
- Tests verify PNG signatures, frame sizes, transparency, unique frames and the existing contract extraction rules. Android device playtesting remains pending.

**Build status:** no Android APK has been generated for this work.
