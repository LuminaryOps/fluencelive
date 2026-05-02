# Fluence — fluencelive.com

Static marketing site for Fluence. Plain HTML, modern CSS, no build step. Deploys to Cloudflare Pages.

## Editing locally

Open any `.html` file in a text editor. Open `index.html` in a browser to preview. That's it — no `npm install`, no dev server, no compile step.

If you want a local server (for clean `/features` style URLs that match production):

```
python -m http.server 8000 --directory website
```

Then visit `http://localhost:8000/`.

## File map

```
website/
├── index.html         Home
├── features.html      Features tour
├── gallery.html       Gallery (drop screenshots into assets/screenshots/)
├── download.html      Download / pricing (placeholder until storefront live)
├── docs.html          Docs
├── changelog.html     Release notes
├── 404.html           Custom not-found page
├── styles.css         Design system + all component styles
├── scripts.js         Year stamp + reveal-on-scroll
├── assets/
│   ├── logo.png       Brand mark
│   ├── icon.png       Favicon source
│   └── screenshots/   Gallery + showcase images
├── _headers           Cloudflare security + caching headers
└── _redirects         Pretty URL redirects (e.g. /features → /features.html)
```

## Adding visual content

The pages are designed around placeholders that disappear as soon as you add real images:

- **Hero image**: drop a screenshot or short looping video at `assets/hero.png` (or `.mp4`) and replace the `.hero__visual--placeholder` div in `index.html` with an `<img>` or `<video>` tag.
- **Showcase rows**: each `.showcase__visual` is an empty 16:10 box. Replace with `<img src="assets/your-image.png" alt="..." />`.
- **Gallery**: replace `<div class="gallery__tile gallery__tile--empty">` blocks with the pattern shown in the inline comment in `gallery.html`.

Recommended image specs:

- Hero: 1920×1080 PNG/JPG or H.264 MP4 < 4MB
- Showcase: 1600×1000 PNG/JPG
- Gallery tiles: 1200×900 PNG/JPG

## Deploying to Cloudflare Pages

### One-time setup

1. Push this repo to GitHub (or GitLab).
2. Go to dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
3. Pick the repo, set:
   - **Build command**: *(leave empty)*
   - **Build output directory**: `website`
   - **Root directory**: *(leave empty)*
4. Hit Deploy. Your site goes live at `<project>.pages.dev` within a minute.

### Custom domain

1. In the Pages project → Custom domains → Set up custom domain.
2. Enter `fluencelive.com` and `www.fluencelive.com`.
3. Cloudflare auto-creates the DNS records since the domain is registered with Cloudflare Registrar.
4. SSL certificate provisions automatically in a few minutes.

### Subsequent deploys

`git push` to your main branch. Cloudflare Pages rebuilds and deploys automatically.

## Design system

All tokens live as CSS custom properties at the top of `styles.css`:

- **Palette**: dark base + warm orange accent matching the app logo
- **Type scale**: modular scale (~1.25 ratio), Inter for everything
- **Spacing**: 4-based scale (`--space-1` through `--space-10`)
- **Motion**: respects `prefers-reduced-motion`

Change the palette by editing the variables under `:root` — every component uses tokens, so a single edit cascades everywhere.

## Browser support

Modern evergreen browsers (Chrome/Edge 100+, Firefox 100+, Safari 15+). Gracefully degrades on older browsers — no animations, no `backdrop-filter` blur, but everything still readable.
