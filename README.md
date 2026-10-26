# CUBE//UNBOUND

**What if every square on a Rubik's Cube could move on its own?**

CUBE//UNBOUND is an interactive 3D Rubik's Cube that runs in the browser. Instead of turning whole layers, every one of the 54 tiles can be twisted, scattered, and recolored on its own. A **Weirdness Meter** measures how far the cube has drifted from normal, and when it hits 100% the page celebrates.

The project started as a single HTML file built during a club activity. It is now organized into separate HTML, CSS, and JavaScript files and served by a small [Express](https://expressjs.com/) server.

## Features

- **3D cube** rendered with Three.js, with lighting, soft shadows, and floating dust.
- **Twist any tile:** click (or touch) and drag a tile to spin it around its own center.
- **Orbit the camera:** drag empty space to look around. The cube drifts slowly until you touch it.
- **Mix it up:** randomly tilts a set of tiles.
- **Break reality:** blows every tile outward, with a screen flash and shake.
- **Color chaos:** repaints the cube with a random palette (Neon, Pastel, Sunset, Cyberpunk, Candy). Tap tiles first to select them and only those get repainted.
- **Undo** (button or Ctrl/Cmd+Z, up to 60 steps) and **Reset** back to the original cube.
- **Weirdness Meter:** scores each tile's rotation and distance from home, shows a status label and a quip, and launches confetti at 100%.
- **Responsive layout** for desktop and phones, and it respects "reduce motion" settings.

## Technologies

- **Node.js + Express 5:** serves the site.
- **HTML, CSS, JavaScript (ES modules):** the frontend, with no build step.
- **Three.js 0.160** loaded from the jsDelivr CDN through an import map.
- **Google Fonts:** Unbounded, IBM Plex Sans, IBM Plex Mono.
- **Node's built-in test runner** (`node --test`) for the server tests.

## Project structure

```
Unbound/
├── public/              # Everything the browser loads
│   ├── index.html       # Page structure
│   ├── css/
│   │   └── style.css    # All styling
│   └── js/
│       └── main.js      # Three.js scene, cube logic, buttons, Weirdness Meter
├── test/
│   └── server.test.js   # Checks that Express serves the app
├── server.js            # Express server
├── package.json
├── .gitignore
└── README.md
```

## How Express is used

`server.js` creates an Express app that:

- serves everything in `public/` with `express.static` (so `/` returns `index.html`, plus `/css/style.css` and `/js/main.js`)
- returns a 404 page for any path that isn't a file in `public/`
- has an error handler that logs errors and returns a 500
- reads the port from the `PORT` environment variable (default `3000`) and prints a clear message if that port is already in use

The app has no API routes, database, or login. All cube behavior runs in the browser.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (npm comes with it)
- A modern browser with WebGL (Chrome, Edge, Firefox, Safari)
- An internet connection, because Three.js and the fonts load from CDNs

## Installation

```bash
cd Unbound
npm install
```

## Running locally

```bash
npm start
```

Then open <http://localhost:3000>.

To use a different port (for example, if another project is already on 3000):

```bash
# macOS / Linux / Git Bash
PORT=4000 npm start
```

```powershell
# Windows PowerShell
$env:PORT=4000; npm start
```

During development, `npm run dev` restarts the server automatically when `server.js` changes. Frontend files need only a browser refresh.

## Testing

Automated server tests:

```bash
npm test
```

These start the Express app on a random free port and check that:

- `/` returns the page
- `/css/style.css` and `/js/main.js` are served with the right content types
- unknown paths return 404

Manual browser check (after `npm start`):

1. Open <http://localhost:3000>. The cube appears and slowly rotates.
2. Drag a tile to twist it. The Weirdness Meter goes up.
3. Click **Mix it up**, then **Break reality**. The meter should reach 100%, followed by the celebration.
4. Click a few tiles to select them (cyan frames), then **Color chaos**. Only those tiles change color.
5. Press **Undo** (or Ctrl+Z), then **Reset**. The meter returns to 0%.
6. Narrow the browser window or use device mode in DevTools to check the phone layout.

## Limitations and future improvements

- Three.js and the fonts come from CDNs, so the page needs internet access. Bundling them locally would make it work offline.
- WebGL is required. Browsers without it show a message instead of the cube.
- Cube arrangements aren't saved. Refreshing the page starts a new cube.
- Possible additions: saving or sharing a cube arrangement, a "solve" animation, sound effects.
