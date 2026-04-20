# Haxademic.js

A personal JavaScript toolkit of general utility and realtime/graphics helper classes. Built for rapid prototyping — drop components into other projects, or browse the full catalog locally and on GitHub Pages with no build step required.

[**Browse the catalog →**](https://cacheflowe.github.io/haxademic.js/)

## Running locally

```bash
npm install
npm run dev       # Vite dev server at https://localhost:8002
```

Open `https://localhost:8002` to browse the catalog. Individual demos are at `https://localhost:8002/demo/#demo-id`.

### Upgrading Vite

```bash
npm upgrade vite
# or
npx vite upgrade
```

## The catalog

`index.html` is a dynamic catalog that fetches `demo/manifest.json` at runtime. It lists all demos (grouped by category) and all bookmarklets (with expandable source viewer and copy-to-clipboard). A search box filters both.

The manifest is a committed JSON file — no build step needed on GitHub Pages or any static host.

**Regenerate the manifest** after adding or modifying demos or bookmarklets:

```bash
npm run catalog
```

## Writing a new demo

Demos live in `demo/demo-*.js`. Use the web component base class:

```js
import DemoBase from "./demo--base-element.js";

class MyThingDemo extends DemoBase {
  static meta = {
    title: "MyThing",            // shown in catalog and page title
    category: "Browser",         // groups demos in the catalog
    description: "What it does", // optional, shown inline in catalog
  };

  init() {
    // called when the element connects to the DOM
    // this.el      → the demo container div
    // this.debugEl → <p> for debug output
  }

  keyDown(key) {
    // optional keyboard handler
  }

  disconnectedCallback() {
    // stop loops, remove listeners, clean up
  }
}

customElements.define("demo-my-thing", MyThingDemo);
if (window.autoInitDemo) document.body.appendChild(document.createElement("demo-my-thing"));
```

Then run `npm run catalog` to add it to the manifest.

### DemoBase helper methods

| Method | Description |
|--------|-------------|
| `this.injectCSS(css)` | Inject a CSS string into the page |
| `this.loadRemoteCSS(url)` | Load an external CSS file |
| `this.injectHTML(html)` | Append an HTML string to `this.el` |
| `this.buildContainer(id, border)` | Create and append a div inside `this.el` |
| `this.addNotyf()` | Load the Notyf toast library |
| `this.notyfSuccess(msg)` / `this.notyfError(msg)` | Show toast notifications |

### Fullscreen demos

```js
static meta = {
  title: "My Fullscreen Demo",
  category: "Draw",
  fullscreen: true,
};
```

## Migrating a legacy demo

Older demos use a plain-class `DemoBase` from `demo--base.js`. To migrate one to the web component pattern:

1. Change the import: `"./demo--base.js"` → `"./demo--base-element.js"`
2. Replace the constructor `super(parentEl, [], title, elId, desc)` with `static meta = { ... }`
3. Remove any manual `this.el = document.getElementById(elId)` — `this.el` is set by the base class
4. Prefix private fields as `this._xxx` to avoid conflicts with the element API
5. Add `disconnectedCallback()` to stop loops and remove listeners
6. Replace the auto-init line:
   ```js
   // before
   if (window.autoInitDemo) window.demo = new XxxDemo(document.body);
   // after
   customElements.define("demo-xxx", XxxDemo);
   if (window.autoInitDemo) document.body.appendChild(document.createElement("demo-xxx"));
   ```
7. Run `npm run catalog`

## Bookmarklets

Bookmarklets live in `bookmarklets/*.js`. They appear in the catalog automatically with a source viewer and copy button. Add metadata to the top of any bookmarklet file:

```js
// @title  Website Dark Mode
// @category  Utility
// @description  Forces an inverted dark mode CSS on any page
```

Then run `npm run catalog`.

## Project structure

```
index.html                  # Dynamic catalog (fetches demo/manifest.json)
demo/
  index.html                # Demo harness — loads a demo by URL hash
  demo--base.js             # Legacy base class (plain class, for un-migrated demos)
  demo--base-element.js     # Web component base class (extends HTMLElement)
  demo-*.js                 # Individual demos (~100+)
  manifest.json             # Generated catalog — commit this
src/
  *.js                      # Utility classes (~87 files)
  components/               # Web components (date-year, app-store-*, etc.)
bookmarklets/
  *.js                      # Browser bookmarklets
server/
  *.mjs                     # Node.js server utilities (HTTP, WebSocket, etc.)
scripts/
  build-manifest.js         # Generates demo/manifest.json
css/                        # Stylesheets (pico.css, haxademic.css, site.css)
data/                       # Media assets (audio, images, video, 3D models)
vendor/                     # Third-party libraries (Three.js, AR.js, ffmpeg.wasm)
```

## GitHub Pages

Everything works on GitHub Pages with no build step. The static files are served as-is:

- Hash-based routing (`/demo/#demo-id`) requires no server-side logic
- `demo/manifest.json` is a committed static file fetched at runtime
- All imports use native ES modules supported by modern browsers

The only thing to remember: run `npm run catalog` and commit `demo/manifest.json` whenever demos are added or updated.

## Server utilities

The `server/` folder contains standalone Node.js scripts for specific tasks (WebSocket relay, dashboard data collection, HTTP server, etc.). These are not part of the Vite build — run them directly with `node server/script-name.mjs`. See each file for usage.

### Server dependencies

```bash
npm install axios cheerio express http fetch desktop websocket ws
```
