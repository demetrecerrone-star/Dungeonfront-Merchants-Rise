# Dungeonfront v0.8 — Android Visual QA

**Automated environment:** Android API 35 emulator, Pixel 6 emulator profile resized to 1080×2340 portrait-native display, density 425; Dungeonfront enforces landscape. This approximates the user's Samsung Galaxy S23 FE screen, but is **not physical Samsung hardware** or an Android 16 device.

**Test workflow:** [Android landscape visual QA (no release)](../.github/workflows/android-visual-qa.yml)

**Instrumentation test:** [VisualSmokeTest.java](../app/src/androidTest/java/com/dabski/dungeonfront/VisualSmokeTest.java)

## Automated test checklist
- [ ] Install an unreleased debug build only within the emulator (no public APK/release).
- [ ] Verify original Dabski cinematic hash and unchanged local-storage save key.
- [ ] Load offline WebView, play into shop, and keep a 800×440 canvas in landscape.
- [ ] Verify class sprite textures and animated event textures load on Android.
- [ ] Open and screenshot the contract board, with claim controls hidden before completed extraction.
- [ ] Hire an adventurer; open and screenshot the roster, including readable class icons and fatigue.
- [ ] Enter the dungeon by actual pointer input and capture the frame.
- [ ] Verify no UI frame error and collect approximate requestAnimationFrame FPS.
- [ ] Save shop, contract board, roster, and dungeon PNG screenshots; collect display size, logcat, and JUnit report.

The GitHub Actions run publishes a downloadable artifact called **Dungeonfront-Android-Landscape-QA**, containing available screenshots, device logs, and test results.

## Physical Samsung Galaxy S23 FE acceptance checklist
- [ ] Install a persistently signed update over the current app **after backing up your save**; do not install a differently signed emulator debug APK over the current game.
- [ ] Open the original studio intro and verify fullscreen playback and game startup.
- [ ] Inspect top/bottom system-bar safe areas at default and larger system text sizes.
- [ ] Check contract/roster columns for clipped buttons, readable icons and scrolling.
- [ ] Inspect 3–5 active adventurers in combat, with boss sprites and HP bars unobstructed.
- [ ] Walk through all five dungeon event types and verify animations and once-only rewards.
- [ ] Verify that every floor has a portal at its left entrance; floors 1–7 progress at right.
- [ ] Verify Floor 8's far-right edge has **no onward passage**.
- [ ] Confirm boss victory sends survivors to the entrance portal and never into a repeated boss loop.
- [ ] Confirm contract cards/popups offer claim **only after every survivor extracts**.
- [ ] Test offline play, app resume and saved currency/roster/contracts after restart.
- [ ] Check actual frame-rate stability and battery/heat on the Samsung device.

## What the emulator pass cannot prove

The emulator's GPU, system WebView and platform version may differ from your phone. Its animation frame-rate sample is an approximate WebView value, not a physical-device GPU benchmark. Android QA and phone QA are separate sign-off gates before any public release.
