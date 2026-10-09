# Dungeonfront — Dungeon Events & Guild Interface Art

These are the **23 actual transparent pixel-art PNGs** added for the v0.8 development branch: ten animated event sheets (five idle and five activated), six class emblems, four condition icons and three rarity icons. This is an unreleased development build; no Android APK was generated.

## Encounter animations

| Discovery | Idle (4 frames) | Activated (6 frames) |
|:--|:--|:--|
| **Treasure chest** | ![Treasure chest idle](../app/src/main/assets/sprites/events/chest/idle.png) | ![Treasure chest activated](../app/src/main/assets/sprites/events/chest/activate.png) |
| **Crypt trap** | ![Crypt trap idle](../app/src/main/assets/sprites/events/trap/idle.png) | ![Crypt trap activated](../app/src/main/assets/sprites/events/trap/activate.png) |
| **Healing shrine** | ![Healing shrine idle](../app/src/main/assets/sprites/events/shrine/idle.png) | ![Healing shrine activated](../app/src/main/assets/sprites/events/shrine/activate.png) |
| **Hidden chamber** | ![Hidden chamber idle](../app/src/main/assets/sprites/events/hidden/idle.png) | ![Hidden chamber activated](../app/src/main/assets/sprites/events/hidden/activate.png) |
| **Wandering merchant** | ![Wandering merchant idle](../app/src/main/assets/sprites/events/merchant/idle.png) | ![Wandering merchant activated](../app/src/main/assets/sprites/events/merchant/activate.png) |

Chest lids open, traps spring, shrine runes light up, secret walls reveal their entrances, and wandering traders raise their lanterns. A discovery uses a **brief per-event activation timer**, while its reward is still tracked separately per adventurer.

## Class emblems

| Class | Icon | Class | Icon |
|:--|:--|:--|:--|
| knight | ![knight](../app/src/main/assets/sprites/ui/classes/knight.png) | cleric | ![cleric](../app/src/main/assets/sprites/ui/classes/cleric.png) |
| ranger | ![ranger](../app/src/main/assets/sprites/ui/classes/ranger.png) | rogue | ![rogue](../app/src/main/assets/sprites/ui/classes/rogue.png) |
| mage | ![mage](../app/src/main/assets/sprites/ui/classes/mage.png) | mercenary | ![mercenary](../app/src/main/assets/sprites/ui/classes/mercenary.png) |

## Condition and rarity markers

| Condition | Icon | Loot rarity | Icon |
|:--|:--|:--|:--|
| ready | ![ready](../app/src/main/assets/sprites/ui/condition/ready.png) | uncommon | ![uncommon](../app/src/main/assets/sprites/ui/rarity/uncommon.png) |
| busy | ![busy](../app/src/main/assets/sprites/ui/condition/busy.png) | rare | ![rare](../app/src/main/assets/sprites/ui/rarity/rare.png) |
| injured | ![injured](../app/src/main/assets/sprites/ui/condition/injured.png) | epic | ![epic](../app/src/main/assets/sprites/ui/rarity/epic.png) |
| exhausted | ![exhausted](../app/src/main/assets/sprites/ui/condition/exhausted.png) | — | — |

## Interface improvements

- The guild contract board shows **rank-colored contracts**, expedition type, class emblems and party readiness.
- Hired adventurers show **fatigue bars**, injury/ready seals, class icons and traits. The roster can still be controlled by touch.
- Contract cards include an **extraction progress meter**, and payment remains locked until surviving adventurers actually exit through the portal at the **beginning** of the floor.
- Loot rarity icons are displayed in the merchant's resale inventory.
- The event renderer retains the previous simple shapes as a fallback if a PNG is unavailable.

**Production:** `python3 tools/generate_event_art.py` uses Python's standard library only. `node tests/sprites.test.js` validates all **95 PNG sheets/icons**; `node tests/events-art.test.js` checks one-time discovery, party-state isolation, and the interface.
