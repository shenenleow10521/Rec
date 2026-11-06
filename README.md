# Pick & Place — Group 4

Pitch landing page for the **REC Team 2026/27 Recruitment 2 Pick and Place Robot Competition** (Faculty of Engineering, Universiti Malaya).

| Department  | Members                      |
|-------------|------------------------------|
| Mechanical  | Siew Boon Yu, Eng Jun Quan   |
| Electronics | Tan Sze Xian, Tan Yun En     |
| Programming | Wong Tze San, Leow Shen En   |

## Presenting

Open the GitHub Pages site in a browser. The presentation uses `index.html` plus locally hosted assets in `assets/`; the 3D showroom requires WebGL 2 and has a static model fallback. No CDN is required.

For local viewing, serve the repository over HTTP (ES modules do not run reliably from `file://`):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

- `→` / `Space` / `↓` — next slide (or click the robot button, bottom right)
- `←` / `↑` — previous slide
- `F` — full screen
- Any key or click skips the opening boot sequence

To host it, enable GitHub Pages on the `main` branch (root folder).

## Editing

Edit `src/index.src.html`, then rebuild so the images are inlined:

```bash
python3 build.py
```

Images live in `src/assets/`.

## Robot showroom (slide 2)

A photo-derived display reconstruction, not a fabrication CAD model. The model is generated from meshes in `src/showroom/model.js`; the viewer lives in `src/showroom/showroom.js`. Features include drag/orbit, keyboard rotation and zoom, front/top presets, system close-ups, exploded assembly, and coupled rack/pinion animation. Animation stops offscreen and in hidden tabs. Reduced-motion preferences disable automatic rotation and continuous motion.

Rebuild the local bundle after editing the 3D source:

```bash
npm ci
npm run build
npm run check:model
```

The checked-in `assets/showroom.js` is built with pinned Three.js and esbuild versions; GitHub Pages does not need Node. Three.js license notices are in `assets/`.

To regenerate the static fallback, install Blender 4.x and run `npm run render:model`. This exports the same procedural geometry to a temporary GLB, then renders `assets/robot-preview.webp` under studio lighting. Temporary GLB/Blender files are not published.
