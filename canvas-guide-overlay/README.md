# 🎱 8 Ball Pool Helper

A lightweight Chrome extension that draws a **transparent practice overlay** on top of the page so you can sketch aim guide lines and visualize **cushion-reflection angles** while practicing.

> **It is a manual tool.** You place every point by hand with your mouse — the extension does **not** read the game, inspect the canvas, detect ball positions, or automate aiming. Think of it as a digital ruler / protractor laid over your screen.

---

## ✨ Features

- **Aim lines** — click a starting point, move the mouse, and draw a straight guide line.
- **Cushion reflections** — define a rectangle (the table), and your aim line bounces off the walls using real 2D vector reflection (configurable number of bounces).
- **Live angle & distance readout** — see the exact angle (°) and pixel length as you aim.
- **Angle snapping** — hold `Shift` (or tick *Snap*) to lock the aim to 15° increments.
- **Multiple lines** — lock several guide lines at once; undo or clear anytime.
- **Adjustable opacity** so the overlay never gets in the way.
- **Keyboard-first** workflow for fast, precise input.
- **Click-through by default** — when you're not drawing, the overlay ignores the mouse so the page works normally.

---

## 📦 Installation (Load Unpacked)

This extension is distributed as source. To install it in Chrome / Edge / Brave:

1. **Download** this repository
   - Click the green **`Code`** button → **Download ZIP**, then unzip it,
   - *or* clone it:
     ```bash
     git clone https://github.com/Iliamgeladze1998/8-ball-pool-helper.git
     ```
2. Open your browser and go to **`chrome://extensions/`**
   *(Edge: `edge://extensions/`)*
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the **`canvas-guide-overlay`** folder (the one containing `manifest.json`).
6. The **8 Ball Pool Helper** icon appears in your toolbar. ✅

> To update after changing the code: go back to `chrome://extensions/` and click the **↻ Reload** button on the extension card.

---

## 🚀 How to Use

1. Open the page where you want to practice and click the toolbar icon **or** press **`Alt + G`** to show the overlay.
2. **Define the table** — press **`T`**, then click-drag a rectangle around the play area (the cushions). Your reflections bounce inside this box.
3. **Draw an aim line** — press **`A`**, click your starting point (e.g. the cue ball), then move the mouse to aim. The line reflects off the table you defined.
4. **Lock the line** — click again (or press **`L`**) to keep it on screen. You can draw several.
5. **Adjust** the number of bounces and the opacity from the toolbar, and toggle 15° snapping.
6. Press **`Alt + G`** again to hide the overlay.

### ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Alt + G` | Show / hide the overlay |
| `T` | Table mode — drag to set the rectangle |
| `A` | Aim mode — click origin, move to aim |
| `L` | Lock the current aim line |
| `U` | Undo the last locked line |
| `C` | Clear everything |
| `H` | Show / hide the in-app help panel |
| `Shift` (hold) | Snap aim angle to 15° |
| `Esc` | Exit the current mode |
| Right-click | Cancel the current aim / exit mode |

---

## 🧠 How It Works

The extension injects a transparent `<canvas>` element fixed over the page at a high `z-index`. By default it uses `pointer-events: none`, so all your clicks pass straight through to the page. Only when you enter a drawing mode does it temporarily capture the mouse so you can place points.

Reflections are computed with standard ray–rectangle geometry: the aim direction is reflected across the axis of whichever wall it hits, repeated for the number of bounces you choose. All input points come from your mouse — nothing is read from the page or the game.

### 📁 Project Structure

```
canvas-guide-overlay/
├── manifest.json     # Extension manifest (MV3)
├── background.js     # Service worker — handles the Alt+G command & icon click
├── content.js        # The overlay: drawing, geometry, UI, shortcuts
├── popup.html        # Toolbar popup (toggle button + quick guide)
├── popup.js          # Popup logic
├── make_icons.py     # Script that generates the icons
└── icons/            # 16 / 48 / 128 px PNG icons
```

---

## ⚠️ Responsible Use

This is a **manual practice and learning aid**, best used for offline play, practice-vs-computer modes, or simply learning pool geometry. Using overlays or third-party tools in **live multiplayer matches** generally violates a game's Terms of Service. Please respect the rules of any game or website you use this on. You are responsible for how you use it.

---

## 📄 License

Released under the [MIT License](LICENSE).
