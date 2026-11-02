---
sticker: lucide//dices
type: prd
project: LocalKit
status: ready-for-build
version: 1.0
updated: 2026-11-02
aliases:
  - LocalKit PRD
  - All-in-one file suite PRD
tags:
  - project
  - prd
  - localkit
---

# LocalKit - Product Requirements Document

**All-in-one, client-side file utilities for everyday work.**

> [!important] Build contract for AI agents
> Build only the P0 scope in this document. Do not add tools, pages, services, AI features, accounts, analytics, or a backend because they seem useful. If it is not in P0, it is not in v1.0.
>
> All file processing must happen in the browser. No file bytes may leave the device. Ever.

## Document control

| Field | Value |
|---|---|
| Status | Ready to build |
| Version | 1.0 |
| Last updated | 2 November 2026 |
| Owner | Dhiraj Arya |
| Working title | LocalKit |
| Source brief | Original content preserved in Appendix A |
| Build target | Fully static web app, no backend |
| Launch scope | P0 only, 19 tools |
| Out of scope for v1.0 | P1, P2, and the Never list |

### How an AI agent should use this document

1. Read sections 1 through 10 completely before writing code.
2. Build P0 in the milestone order defined in section 18.
3. Treat the tool registry as the single source of truth for every tool.
4. Meet every tool's acceptance criteria, not just its happy path.
5. If something is ambiguous, choose the simplest option that preserves privacy and record the decision in `DECISIONS.md`. Do not expand scope.
6. Do not change the stack, add a backend, or add a feature because it is easy.
7. When a conflict exists, follow this order: privacy and non-negotiables, Never list, P0 scope, design rules, copy suggestions.

### Non-negotiable rules

- **No uploads.** File bytes never leave the browser. No server processing, no cloud storage, no file-sharing links.
- **No accounts.** No login, email capture, sync, or database.
- **No trackers.** No analytics, cookies, fingerprinting, ads, or third-party scripts at runtime.
- **No fake product.** No fake testimonials, user counts, logos, ratings, progress bars, or generated preview numbers.
- **No dead controls.** Every visible button, link, filter, and tool works. No placeholder links.
- **No scope creep.** Do not add a tool, page, integration, or "small" feature that is not in P0.
- **No uploads disguised as convenience.** Samples are bundled locally. External requests are limited to the footer profile fetch described in section 8.9.

---

## 1. Product summary

LocalKit is a fast, private, all-in-one file toolbox for everyday tasks. It handles images, PDFs, video, GIFs, and audio in one place. Everything runs in the browser. Files are never uploaded, accounts are never required, and outputs are never watermarked.

The product is a static website. There is no application server, database, authentication layer, or file storage. The browser is the entire backend.

### 1.1 What LocalKit is

- A focused utility belt for common file chores: compress, convert, merge, split, trim, resize, extract, and organize.
- A private alternative to ad-heavy converter sites that upload files to unknown servers.
- A fast, no-sign-up tool that works on the first visit.
- A polished, opinionated product with one job per tool and sensible defaults.
- Free to use, with no paywall, watermark, or upsell.

### 1.2 What LocalKit is not

- Not cloud storage, a file manager, or a sync service.
- Not a full image editor, video editor, or audio workstation.
- Not an AI product, writing assistant, or chatbot.
- Not a SaaS with accounts, teams, billing, or admin dashboards.
- Not a social network, community, or file-sharing platform.
- Not a native desktop or mobile app in v1.0.
- Not a batch automation or workflow builder.

### 1.3 Target users

- Students and office workers who need a PDF merged, split, or compressed before a deadline.
- Creators who need an image compressed for a form, a video trimmed for a chat app, or a GIF made from a clip.
- Developers who need a favicon set, a quick format conversion, or a PDF page removed.
- Privacy-conscious users who do not want personal documents on a stranger's server.
- People on modest laptops who want a fast, uncluttered tool without installing software.

### 1.4 Core jobs to be done

| Job | Tool |
|---|---|
| "This image is too large to upload to a form." | Image Compressor |
| "I need this PNG as a JPG." | Image Converter |
| "I need one PDF from several files." | Merge PDF |
| "I only need pages 3 to 7." | Split PDF |
| "This PDF is too big to email." | Compress PDF |
| "I need to remove or reorder pages." | Organize PDF |
| "This video is too large for WhatsApp." | Video Compressor |
| "I need a GIF from this clip." | Video to GIF |
| "I need this audio as MP3." | Audio Converter |
| "I need a favicon for my site." | Favicon Studio |

### 1.5 Product principles

1. **Local by architecture.** Privacy is enforced by the absence of an upload path, not by a promise.
2. **One tool, one job.** Each page solves a single task well. Related tools are linked, not merged into a mega-editor.
3. **Real output only.** Show computed sizes, actual previews, and honest failures. Never simulate work.
4. **Calm and fast.** Minimal chrome, sensible defaults, no queues, no sign-up walls.
5. **Respect device limits.** State limits clearly. Fail gracefully when memory runs out.
6. **No dark patterns.** No fake urgency, forced sign-up, watermarks, or hidden limits.
7. **Accessible by default.** Keyboard-first, screen-reader sane, usable at 360 px.
8. **Boring technology, carefully used.** Static output, proven libraries, no clever infrastructure.

---

## 2. Goals and success criteria

### 2.1 Product goals

- Let a first-time visitor complete a common file task in under 60 seconds without reading instructions.
- Make every P0 tool genuinely usable on real files, not a demo.
- Make search the fastest route to any tool.
- Earn trust through verifiable privacy and honest UI.
- Ship a landing page that feels designed by a person, not generated from a template.

### 2.2 Non-goals for v1.0

- Maximizing sign-ups, sessions, or page views.
- Supporting every format or codec.
- Matching native desktop performance for video encoding.
- Building a community, blog, changelog, or documentation portal.
- Monetization of any kind.
- Internationalization beyond English.

### 2.3 Success criteria

| Area | Target |
|---|---|
| Task completion | A new user can compress an image or merge two PDFs without help |
| Search | Any P0 tool is found in under 10 seconds using the palette |
| Privacy | Zero file-byte network requests during any processing task |
| Reliability | 95 percent of supported fixture runs succeed on supported browsers |
| Accessibility | WCAG 2.2 AA, zero critical axe violations |
| Performance | Landing Lighthouse mobile: performance 90+, accessibility 100, best practices 100, SEO 100 |
| Quality | All P0 acceptance criteria pass; no visible placeholder content |
| Scope | No P1, P2, or Never-list feature ships in v1.0 |

No analytics are used to measure these. Validation is manual, through fixtures, automated tests, and a five-person usability check.

---

## 3. Scope contract

### 3.1 Priority definitions

| Priority | Meaning | Ships in v1.0 |
|---|---|---|
| P0 | Required for launch | Yes |
| P1 | Planned for release 1.1 | No |
| P2 | Candidate, needs separate PRD | No |
| Never | Explicitly rejected | No |

### 3.2 P0 scope: build now

Exactly 19 tools. No more.

| ID | Tool | Category | Route |
|---|---|---|---|
| IMG-01 | Image Converter | Images | `/tools/image-converter` |
| IMG-02 | Image Compressor | Images | `/tools/image-compressor` |
| IMG-03 | Image Resizer | Images | `/tools/image-resizer` |
| IMG-04 | Favicon Studio | Images | `/tools/favicon-studio` |
| PDF-01 | Merge PDF | PDF | `/tools/merge-pdf` |
| PDF-02 | Split PDF | PDF | `/tools/split-pdf` |
| PDF-03 | Compress PDF | PDF | `/tools/compress-pdf` |
| PDF-04 | PDF to Images | PDF | `/tools/pdf-to-images` |
| PDF-05 | Organize PDF | PDF | `/tools/organize-pdf` |
| PDF-06 | Watermark PDF | PDF | `/tools/watermark-pdf` |
| PDF-07 | PDF Page Numbers | PDF | `/tools/pdf-page-numbers` |
| PDF-08 | Images to PDF | PDF | `/tools/images-to-pdf` |
| VID-01 | Video Compressor | Video | `/tools/video-compressor` |
| VID-02 | Video Trimmer | Video | `/tools/video-trimmer` |
| VID-03 | Video to GIF | Video | `/tools/video-to-gif` |
| GIF-01 | Images to GIF | GIF | `/tools/images-to-gif` |
| GIF-02 | GIF Compressor | GIF | `/tools/gif-compressor` |
| AUD-01 | Audio Converter | Audio | `/tools/audio-converter` |
| AUD-02 | Audio Trimmer | Audio | `/tools/audio-trimmer` |

Category counts shown in the UI must be derived from live tools: Images 4, PDF 8, Video 3, GIF 2, Audio 2. Do not hardcode counts.

### 3.3 P1 scope: release 1.1, do not build in v1.0

| ID | Tool | Category |
|---|---|---|
| IMG-05 | Crop and Rotate Image | Images |
| IMG-06 | Image Metadata Cleaner | Images |
| PDF-09 | Extract PDF Text | PDF |
| PDF-10 | Edit PDF Metadata | PDF |
| VID-04 | Extract Audio from Video | Video |
| VID-05 | Video to Frames | Video |
| VID-06 | Mute Video | Video |
| GIF-03 | GIF to Frames | GIF |
| GIF-04 | GIF to Video | GIF |
| AUD-03 | Normalize Audio | Audio |
| FILE-01 | Create ZIP | Files |
| FILE-02 | Extract ZIP | Files |
| FILE-03 | File Hash Checker | Files |
| FILE-04 | QR Code Generator | Files |
| FILE-05 | Base64 Encoder and Decoder | Files |
| FILE-06 | JSON Formatter | Files |
| FILE-07 | Password Generator | Files |

P1 tools must not appear in navigation, search, the tools directory, or the sitemap until they are fully built in release 1.1. No "coming soon" cards.

### 3.4 P2 scope: not scheduled, needs a separate PRD

- HEIC to JPG conversion.
- SVG to PNG conversion.
- Background remover.
- OCR for images and PDFs.
- Audio transcription.
- PDF password protection and password removal.
- PDF signing.
- Video speed change and rotation.
- Video to WebM (VP9) output.
- GIF cropping.
- Favicon extraction, meaning ICO to PNG. The original brief's "and opposite" is intentionally not in v1.0.
- Color converter, unit converter, timestamp converter, Markdown preview, text diff.
- Progressive web app and offline caching.
- Multi-language interface.

P2 items may be proposed, but must not be implemented under this PRD.

### 3.5 Never build

These are product decisions, not temporary gaps:

- Any upload, server processing, serverless function, API route, database, or file storage.
- Accounts, login, profiles, teams, billing, subscriptions, or admin panels.
- Cloud sync, share links, file history, or "recent files."
- AI chat, AI generation, AI summaries, or AI suggestions.
- Ads, affiliate links, sponsored tools, tracking pixels, analytics, cookies, or fingerprinting.
- Fake testimonials, customer logos, usage counters, ratings, awards, or press mentions.
- Newsletter popups, chat widgets, cookie banners (because no cookies are used), or exit-intent modals.
- Native apps, browser extensions, CLI tools, or public APIs.
- PDF to Word, Excel, PowerPoint, or any conversion that realistically requires a server.
- Password cracking, DRM removal, malware scanning, or file recovery.
- Watermarks, forced sign-up, artificial file limits, or paid tiers.
- Multi-language UI, custom themes beyond light and dark, or a tool builder.
- Placeholder pages, dead links, lorem ipsum, or "coming soon" cards.

### 3.6 Scope rules for agents

- If a feature is not P0, do not build it "while you are there."
- Do not add a dependency that exists only to support a P1 or P2 feature.
- Do not add a backend "for analytics" or "just for OG images." Generate static assets at build time.
- Do not add a new page without a route in section 6.
- Do not add a tool without updating the registry, the tools directory, search, sitemap, and tests.
- Do not show unbuilt tools anywhere in the UI.
- Do not rename tools or routes without updating this document first.

---

## 4. Brand and design

### 4.1 Brand direction

**Working name:** LocalKit. Use it consistently until the owner chooses a final name. Do not invent a different name in UI copy.

**Tagline:** Everyday file tools that never leave your device.

**Positioning:** A precise, private utility instrument. Warm, editorial, and human. Not a neon startup, not a corporate SaaS, not a developer terminal.

**Voice:** Direct, calm, specific. Short sentences. No hype. No exclamation marks. No emoji in the interface. Write like a careful person explaining a tool to a friend.

**Brand mark:** A simple inline SVG: a squared bracket opening to the left with a filled accent dot in the center. Wordmark in the display face, weight 600. No gradient, no 3D, no mascot.

### 4.2 Visual concept

The design language is "well-made paper instrument":

- Warm paper background, near-black ink, one vermilion accent.
- Strong typography and generous whitespace instead of cards with shadows.
- Thin 1 px rules, numbered section labels, and a visible grid rhythm.
- Real product UI in the hero, not an illustration.
- Compact, precise tool workspaces that feel like a workshop, not a dashboard.
- Light theme is the default. Dark theme is a faithful inverse, not a neon variant.

The page should look good in a screenshot with no images except the real demo. Typography and layout carry the design.

### 4.3 Color tokens

Define these as CSS variables in `globals.css` and map them into Tailwind v4 `@theme` tokens. HeroUI components must consume the same variables.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F4F1EA` | `#0E0E0C` | Page background |
| `--surface` | `#FBF9F4` | `#161614` | Panels, inputs |
| `--surface-raised` | `#FFFFFF` | `#1D1D1A` | Dialogs, menus |
| `--ink` | `#171714` | `#F3F0E8` | Primary text |
| `--ink-muted` | `#6A665D` | `#A6A198` | Secondary text |
| `--line` | `#D9D3C7` | `#2D2D28` | Default borders |
| `--line-strong` | `#B8B1A2` | `#46463F` | Hover borders |
| `--accent` | `#C93A12` | `#FF7A4D` | Primary action, focus, active |
| `--accent-ink` | `#FFFFFF` | `#171714` | Text on accent |
| `--success` | `#1E6B45` | `#66D6A3` | Success status only |
| `--danger` | `#A9251A` | `#FF8A7A` | Errors only |
| `--code-bg` | `#ECE8DF` | `#1B1B18` | Format chips, code |

Rules:

- The accent covers no more than about 10 percent of any viewport. It marks actions and focus, not decoration.
- No gradients anywhere. No glow. No colored shadows.
- `--success` and `--danger` are status colors, never brand colors.
- Verify contrast at implementation time. The accent on light backgrounds uses white text only for large text or buttons; if contrast fails, darken the accent, do not add a gradient.
- Selection color: accent at 18 percent opacity.
- Focus ring: 2 px accent with a 2 px offset. On accent surfaces, use ink.

### 4.4 Typography

Load fonts with `next/font/google`, self-hosted at build time. No runtime font requests.

| Role | Face | Weights | Notes |
|---|---|---|---|
| Display | Bricolage Grotesque | 500, 600, 700 | Headings, wordmark |
| Body | Geist | 400, 500, 600 | Paragraphs, controls |
| Mono | Geist Mono | 400, 500 | Labels, sizes, shortcuts, metadata |

Rules:

- Display headings use tight tracking, `-0.035em`, and line height near 0.95 to 1.05.
- Body copy is 16 px with 1.6 line height, max 68 characters per line.
- Labels are 12 px mono, uppercase, tracked 0.08em, muted.
- File sizes use tabular numerals.
- Do not use more than three weights per face.
- Font loading must not cause layout shift. Use `display: swap` and fallbacks with matched metrics.

Type scale:

| Token | Desktop | Mobile | Use |
|---|---|---|---|
| `display-xl` | 96 px | 52 px | Hero only |
| `display-l` | 64 px | 40 px | Major statements |
| `h1` | 48 px | 36 px | Page titles |
| `h2` | 36 px | 28 px | Section titles |
| `h3` | 24 px | 20 px | Tool and card titles |
| `body-l` | 18 px | 17 px | Hero subcopy |
| `body` | 16 px | 16 px | Default |
| `small` | 14 px | 14 px | Helper text |
| `micro` | 12 px | 12 px | Labels, sizes |

### 4.5 Layout, spacing, and surfaces

- Base spacing unit: 4 px.
- Max content width: 1200 px. Desktop gutters: 40 px. Mobile gutters: 20 px.
- Header height: 64 px.
- Section vertical padding: 96 px desktop, 64 px mobile.
- Grid: 12 columns, 24 px gutters desktop, 16 px mobile.
- Radii: 4 px badges, 8 px buttons and inputs, 12 px cards and dialogs. Nothing above 16 px.
- Borders: 1 px solid `--line`. Hover: `--line-strong`.
- Shadows: none, except a single 0 1px 2 px rgba(0,0,0,0.04) on the command palette if needed for separation. Do not use elevation to organize content.
- Background patterns: none. No noise, grid overlays, blobs, or gradients.
- Cards are flat surfaces with rules, not floating tiles.
- Buttons: primary accent with `--accent-ink`, secondary 1 px border on surface, ghost with no border. No pill-shaped buttons. Height 40 px desktop, 44 px mobile.
- Inputs: surface background, 1 px border, 8 px radius, 40 px height. Labels above, not placeholders only.
- Section labels: `01 / Toolbox` in mono, with a short 24 px rule before the label.
- Empty space is part of the design. Do not fill it with badges or illustrations.

### 4.6 Iconography

- Use Pikaicons via `@pikaicons/react`, imported per icon. Do not import the entire icon set.
- Stroke width: 1.5 px. Sizes: 16, 20, 24 px.
- Icons are ink-colored, never accent-colored except the active state.
- Category icons: image, file-text, video, film, audio-lines.
- If a required icon is missing from Pikaicons, draw it as an inline SVG in the same 1.5 px line style. Do not add a second icon library.
- No emoji as icons. No filled icon buttons without labels in tool workspaces.

### 4.7 Motion

- Duration: 120 ms for hover and press, 180 ms for menus and dialogs, 240 ms for panels.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Motion is functional: state changes, progress, menu entry. No scroll-triggered animation, parallax, marquee, cursor follower, or page transition.
- Hover changes border and color, not position. No card lift.
- Respect `prefers-reduced-motion`: remove transforms and set durations to 0.01 ms.
- Progress bars only reflect real work. Never animate a fake percentage.

### 4.8 Theme behavior

- Default follows the operating system.
- A header toggle switches light and dark explicitly. A three-way system/light/dark option may live in the mobile menu, but is not required.
- Persist explicit choice with `next-themes` in localStorage under the default key.
- No flash of the wrong theme. Use the next-themes script in the document head.
- Update `theme-color` meta on theme change: light `#F4F1EA`, dark `#0E0E0C`.
- Tool workspaces, dialogs, and the command palette must be fully themed. No hardcoded white or black surfaces.

### 4.9 Anti-AI-slop rules

The landing page must not look like a generated SaaS template. The following are banned:

- Purple, blue, or pink gradient text, mesh gradients, aurora backgrounds, or glowing orbs.
- Glassmorphism, frosted cards, heavy blur, or translucent floating panels.
- 3D blobs, abstract shapes, generated illustrations, or stock photos of people.
- Fake browser windows, fake dashboards, fake code terminals, or fake analytics.
- Bento grids with arbitrary tile sizes. Use a consistent grid.
- Rounded pills for everything, 24 px card radii, or floating icon bubbles.
- "Trusted by", customer logos, testimonials, star ratings, awards, or user counters.
- Emoji in headings or body copy.
- Marquee strips, scroll-jacking, parallax, tilt cards, or cursor glow.
- Chat widgets, newsletter popups, cookie banners, or exit modals.
- The words "unleash", "supercharge", "seamless", "effortless", "revolutionary", "game-changing", "AI-powered", "next-gen", "empower", "elevate", "cutting-edge", "robust", "transform", or "unlock" in marketing copy.
- Placeholder copy, lorem ipsum, dead links, or "coming soon" cards.
- Fake urgency or scarcity.

Instead: strong type, real UI, precise numbers, one accent, honest copy, and a visible privacy claim that can be verified.

### 4.10 Accessibility requirements

Target WCAG 2.2 AA.

- Every interactive element is reachable and operable by keyboard.
- Visible focus ring on every focusable element. Never `outline: none` without a replacement.
- One H1 per page. Headings are sequential.
- Form controls have persistent labels, not placeholder-only labels. Errors use `aria-invalid` and `aria-describedby`.
- The command palette follows the ARIA combobox/listbox pattern with `aria-activedescendant`.
- Dialogs trap focus, restore focus on close, and close on Escape.
- Drag-and-drop file and page reordering always has button alternatives, including move left, move right, rotate, and remove.
- Processing progress uses `aria-live="polite"` and announces stage changes, not every percent.
- Color is never the only signal. Success and error include text and an icon.
- Canvas previews have `role="img"` and a descriptive `aria-label` containing dimensions and size.
- Touch targets are at least 44 by 44 px on mobile. Desktop controls at least 32 px high.
- Support 200 percent zoom and 320 px reflow with no horizontal scroll.
- Provide a skip link to main content.
- Test with axe DevTools and a keyboard-only pass on every template.

### 4.11 Responsive behavior

Breakpoints: 480, 768, 1024, 1280 px.

- 360 to 767 px: single column, header collapses to menu, hero stacks with the demo below the copy, tools grid is one column, tool options stack below the file area, primary action becomes a sticky bottom bar with safe-area padding.
- 768 to 1023 px: two-column tools grid, hero still stacked, tool workspace is one column.
- 1024 px and up: three-column tools grid, hero is 7/5 split, tool workspace uses a two-column layout with a sticky options panel.
- Command palette becomes a full-screen sheet below 640 px.
- No horizontal scrolling at any width. Tables become stacked cards or scroll within a labeled region.
- Test at 360, 390, 768, 1024, 1440 px in both themes.

---

## 5. Technology and architecture

### 5.1 Stack

Use the stack the owner specified. Do not substitute a different framework or UI kit.

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, React 19 |
| Language | TypeScript, strict mode |
| Styling | Tailwind CSS 4 with CSS-first theme tokens |
| Components | HeroUI 3 (`@heroui/react`) |
| Icons | Pikaicons (`@pikaicons/react`), per-icon imports |
| Themes | `next-themes` |
| Deployment | Static export on Vercel, also deployable to any static host |

Verified package versions on 2 November 2026: Next 16.4.3, React 19.3.1, Tailwind 4.3.3, HeroUI 3.2.7, Pikaicons React 0.1.0. Pin exact versions in the lockfile at implementation time. Use latest patch releases within these majors. If HeroUI 3 or Pikaicons has a breaking compatibility issue with Next 16 or Tailwind 4, document the issue and use the smallest workaround. Do not replace the design system.

### 5.2 Architectural constraints

- **Fully static.** Use `output: "export"`. No API routes, server actions, middleware, ISR, or runtime image optimization.
- **No backend.** No database, auth provider, storage bucket, queue, or serverless function.
- **No runtime third-party scripts.** All JavaScript is bundled and served from the same origin.
- **No CDN at runtime.** Bundle or self-host fonts, workers, and WebAssembly. Never load ffmpeg, pdf.js, or fonts from a public CDN.
- **No file persistence.** Files live in memory and object URLs only. Never write file bytes to localStorage, sessionStorage, IndexedDB, or Cache Storage.
- **Static pages with client islands.** Marketing content is server-rendered. Tool workspaces, search, theme toggle, and demo are client components.
- **No hydration mismatch.** Theme and localStorage reads happen after mount or through next-themes.
- **One job at a time.** A tool processes one job per tab. Disable the primary action while running and offer cancel.
- **Heavy engines load on demand.** ffmpeg, pdf.js, pdf-lib, gifenc, and lamejs are dynamically imported only on pages or interactions that need them.

### 5.3 Client-side libraries

| Purpose | Library | Loaded when |
|---|---|---|
| PDF read, render, text | `pdfjs-dist` | PDF tools |
| PDF write and page manipulation | `pdf-lib` | PDF tools |
| Video, GIF from video, audio extraction | `@ffmpeg/ffmpeg` + `@ffmpeg/util` | Video tools, on first run |
| GIF encoding | `gifenc` | GIF tools |
| GIF decoding | `gifuct-js` | GIF compressor |
| MP3 encoding | `@breezystack/lamejs` | Audio tools, on export |
| Audio decode and PCM | Web Audio API | Audio tools |
| ZIP creation and extraction | `fflate` | Multi-file outputs, P1 ZIP tools |
| Fuzzy search | `fuse.js` | First command palette open |
| QR codes (P1) | `qrcode` | P1 only |
| EXIF read (P1) | `exifr` | P1 only |

Do not add jQuery, Lodash, Moment, Axios, a state-management library, a CSS-in-JS runtime, or a second icon library. React state and context are enough.

### 5.4 Workers and engine rules

- **Image work:** run decoding, resizing, and encoding in a dedicated Web Worker using `OffscreenCanvas` when available. Fall back to the main thread with chunked processing and a loading state. Process at most two images concurrently.
- **PDF rendering:** use the pdf.js worker from the same origin. Configure `GlobalWorkerOptions.workerSrc` with a bundled asset. Set `isEvalSupported: false` and `enableXfa: false`.
- **Video and GIF from video:** use ffmpeg.wasm single-thread core only. Do not require `SharedArrayBuffer`, COOP, or COEP. Serve `ffmpeg-core.js` and `ffmpeg-core.wasm` from `/ffmpeg/` in `public`. Show a loading state with real download progress when the engine initializes.
- **Audio encoding:** run lamejs in a worker or chunked loop. Never block the main thread for more than 50 ms.
- **PDF writing:** pdf-lib runs on the main thread but yields between pages. Show progress for documents over 50 pages.
- **Cancellation:** every long job accepts cancellation. Terminate workers, call `ffmpeg.terminate()`, discard partial output, and return the UI to the ready state.
- **Cleanup:** terminate ffmpeg after a job when the page is reset or unmounted. Revoke every object URL on reset and unmount.

### 5.5 Static data and storage

Allowed localStorage keys:

| Key | Contents | Purpose |
|---|---|---|
| `theme` | `light`, `dark`, or `system` | Theme preference |
| `localkit.recentTools` | Up to 5 `{ slug, at }` records | Command palette recents |
| `localkit.profile` | Cached public footer profile, 6 hour TTL | Avoid repeated footer fetch |

Nothing else is stored. No file names, file data, thumbnails, or settings are persisted. Provide "Clear recent tools" in the command palette and list the keys on the privacy page.

### 5.6 Project structure

```
app/
  layout.tsx
  page.tsx                  landing
  tools/page.tsx            directory
  tools/[slug]/page.tsx     static tool pages
  privacy/page.tsx
  licenses/page.tsx
  not-found.tsx
  sitemap.ts
  robots.ts
components/
  brand/
  landing/
  search/
  tools/
  ui/
lib/
  tools/registry.ts
  tools/<slug>/             tool UI and logic
  engines/image.ts
  engines/pdf.ts
  engines/video.ts
  engines/gif.ts
  engines/audio.ts
  engines/zip.ts
  files/validate.ts
  files/download.ts
  files/format.ts
  search/index.ts
  profile.ts
  constants.ts
workers/
  image.worker.ts
public/
  samples/
  ffmpeg/
  og/
  favicon assets
```

The tool registry is the only place that defines tool names, slugs, categories, descriptions, keywords, accepted formats, limits, priority, and status. Navigation, search, cards, sitemap, and static params all read from it. Tool components are mapped in a static object so dynamic imports remain analyzable by the bundler.

### 5.7 Security and privacy engineering

- Never trust MIME types. Validate extensions, magic bytes, and actual decodability.
- Never render uploaded content as HTML. No `dangerouslySetInnerHTML` for user data. PDF content is rendered to canvas only.
- Sanitize file names: remove path separators, control characters, leading dots, and reserved names; cap at 100 characters.
- ZIP extraction must reject absolute paths and `..` traversal, and enforce a 1 GB uncompressed limit and a compression-ratio guard.
- Enforce per-tool count, size, page, and pixel limits before decoding. Reject images above 16,384 px per side or 100 megapixels.
- Build ffmpeg arguments from validated numeric and enum values only. Never interpolate raw file names into a shell string.
- Use a strict Content Security Policy. Required allowances: same-origin scripts and workers, `wasm-unsafe-eval` for WebAssembly, blob and data URLs for media and images, and `connect-src 'self' https://dhirajarya.in` for the footer profile fetch. No other external origins.
- Set `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- No cookies. No third-party scripts. No telemetry in dependencies; audit new packages before adding them.
- The only runtime external request is the footer profile fetch. It sends no file data, uses `credentials: "omit"` and `referrerPolicy: "no-referrer"`, and has a 3.5 second timeout.
- Hosting provider request logs will record page visits, not file contents. State this plainly on the privacy page.

### 5.8 Browser support

- Chrome and Edge 120 or newer, Firefox 121 or newer, Safari 17.4 or newer.
- Desktop is the primary target for video and GIF encoding. Mobile image, PDF, and audio tools must work.
- Feature-detect `OffscreenCanvas`, `createImageBitmap`, WebP encoding, WebAssembly, and Web Audio. Degrade gracefully or show a clear unsupported message.
- Video tools show a desktop recommendation on phones and tablets. Never crash on unsupported codecs.
- Test iOS Safari for image and PDF tools. Video on iOS is best effort.

### 5.9 Performance budgets

| Asset | Budget |
|---|---|
| Shared first-load JavaScript on landing | 220 KB gzip maximum |
| Search palette chunk | 35 KB gzip |
| Landing demo image engine | 20 KB gzip, excluding sample |
| Landing total sample assets | 400 KB maximum, lazy loaded |
| Tool page JS before heavy engine | 350 KB gzip maximum |
| ffmpeg core and wasm | Loaded only on first video run; never on landing |
| Landing LCP | Under 2.0 seconds on a mid-tier mobile profile |
| CLS | Under 0.05 |
| INP | Under 200 ms for normal interactions |

Use route-level code splitting, dynamic imports, per-icon imports, and static sample assets. Do not preload ffmpeg or pdf.js on the landing page.

---

## 6. Information architecture and routes

### 6.1 Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static | Landing page with hero, demo, featured tools, how it works, FAQ, footer |
| `/tools` | Static with client filter | Full directory of 19 live tools, category filters, name filter |
| `/tools/[slug]` | 19 static pages | Individual tool workspace |
| `/privacy` | Static | Plain-language privacy details and localStorage keys |
| `/licenses` | Static | Third-party licenses and ffmpeg source attribution |
| `/404` | Static | Not found page with search and a link home |
| `/sitemap.xml` | Generated static | All public routes |
| `/robots.txt` | Generated static | Allow all, point to sitemap |

No other public routes in v1.0. There is no `/about`, `/blog`, `/pricing`, `/login`, `/dashboard`, `/changelog`, or `/contact`. Social and contact links come from the profile data described in section 8.9.

### 6.2 URL rules

- Use lowercase hyphenated slugs exactly as listed in section 3.2.
- No trailing slash. Configure the host to redirect if necessary.
- Unknown tool slug returns the 404 page. Invalid slugs must not render a blank workspace.
- Category filters on `/tools` use `?category=images|pdf|video|gif|audio` and are reflected with `history.replaceState`, not a server request.
- A name filter uses `?q=` and is optional. It must not break static export and must not trigger navigation.
- Do not put file data, base64, or file names in URLs.

### 6.3 Header

Desktop:

- Left: brand mark and wordmark, linking home.
- Center-left: `Tools`, `FAQ` (links to `/#faq` from other pages).
- Right: search button with magnifier, label `Search`, and keyboard hint `Ctrl K` or `Cmd K` detected by platform. Theme toggle icon button. No primary CTA.
- Sticky top, solid `--bg`, 1 px bottom border. No blur, no transparency.

Mobile, below 768 px:

- Left: mark and wordmark.
- Right: search icon button and menu button.
- Menu is a full-width sheet below the header with `Tools`, `FAQ`, `Privacy`, `Licenses`, theme options, and the search shortcut. It closes on navigation and Escape.
- Search icon opens the command palette full screen.

### 6.4 Footer

The footer is part of the shared layout and appears on every page. See section 8.9 for profile fetching.

Structure:

- Top: brand mark, wordmark, one-line privacy statement, profile name and short bio.
- Columns:
  - `Tools`: six popular tools plus `All tools`.
  - `Project`: `Privacy`, `Licenses`.
  - `Elsewhere`: social links from the profile, maximum five. Render only links that exist.
- Bottom row: copyright with current year, `Built by Dhiraj Arya`, link to `dhirajarya.in`, and the line `All processing happens in your browser.`
- No newsletter, no social icons, no language selector, no cookie settings.
- Reserved height for the profile area to avoid layout shift when the fetch resolves.

### 6.5 404 page

- H1: `This page is not in the toolbox.`
- Body: `The link may be old, or the tool may have moved.`
- Search button that opens the command palette.
- Links to `All tools` and `Home`.
- Keep the standard header and footer. No illustration.

---

## 7. Landing page specification

This page must feel like a finished product. All copy below is final unless a change is approved. Do not add sections.

### 7.1 Section order

1. Header
2. Hero with live demo
3. Featured tools
4. How it works
5. Why local
6. FAQ
7. Footer

No testimonials, logo strips, pricing, blog previews, stats, or newsletter sections.

### 7.2 Hero

Layout: 12-column grid. Copy occupies 7 columns, demo occupies 5. They align at the top. On mobile, copy stacks above the demo.

Exact copy:

- Eyebrow, mono: `19 TOOLS. ZERO UPLOADS.`
- H1, display XL: `Your files never leave this tab.`
- Subcopy, body large, max 52 characters per line: `Compress, convert, merge, trim, and extract images, PDFs, video, GIFs, and audio. Every tool runs in your browser.`
- Primary button: `Browse the toolbox`, scrolls smoothly to `#tools`. Respect reduced motion.
- Secondary button: `Search tools` with a trailing keyboard hint, opens the command palette.
- Meta line below buttons, small and muted: `No account. No watermark. No file upload.` Separate items with a middle dot or thin rules, not pill badges.

Do not add a fake "rated 5 stars" or user count. Do not add floating tool icons.

### 7.3 Live demo

The hero demo is real. It must use the same image compression engine as the tool, not a mock.

Card structure:

- Top bar: mono label `TRY IT` on the left, `Image compressor` on the right.
- Image preview area: 4:3, bundled sample photo, `object-fit: cover`.
- Controls:
  - `Quality` label with the current value, range 40 to 95, default 72.
  - Output format is WebP for the demo and is stated in small text.
  - Real stats: the actual original size, output size, and percentage saved, computed from the sample. Never hardcode example numbers.
  - Primary small button: `Download result`.
  - Text link: `Open the full tool`.
- Footer note with a small lock or device icon: `Processed on your device. Nothing uploaded.`

Behavior:

- On first view, load the sample and run compression after the demo enters the viewport or the page becomes idle. Show a skeleton and the text `Compressing locally...`. Never show precomputed fake numbers.
- Re-run when the quality slider changes, debounced by 250 ms. Keep the previous result visible while computing and show a subtle busy state.
- Use a bundled sample of at most 250 KB, 1600 px wide, with a documented license. Prefer an original or public-domain photograph. No stock photo of people.
- Reserve the card's final dimensions to avoid layout shift.
- If processing fails, show `The demo could not run in this browser. Open the full tool to try your own file.` Do not show invented numbers.
- The demo download uses the real processed blob and the standard download helper.

The demo must not load ffmpeg, pdf.js, or any heavy engine. The image engine and sample are lazy loaded.

### 7.4 Featured tools

- Section label: `01 / Toolbox`
- H2: `Everyday files, handled.`
- Subcopy: `Six of the most-used tools. The full set covers images, PDFs, video, GIFs, and audio.`
- Grid: 6 cards, three columns desktop, two tablet, one mobile.
- Cards:
  1. Image Compressor - `Shrink images to a target size or quality.`
  2. Image Converter - `Convert between PNG, JPG, and WebP.`
  3. Merge PDF - `Combine PDFs in the order you choose.`
  4. Compress PDF - `Reduce PDF size, with honest trade-offs.`
  5. Video Compressor - `Make video files smaller, locally.`
  6. Images to GIF - `Turn a sequence of images into an animated GIF.`
- Card anatomy: 20 px Pikaicon in a 40 px bordered square, name in H3, one-line description, format chips in mono, a thin arrow at the bottom right that becomes accent on hover. Entire card is a link. No badge unless a tool was added in the last 30 days; v1.0 has none.
- Below the grid: `View all 19 tools` link to `/tools`, styled as a text link with an arrow.
- Category summary line: `Images 4 · PDF 8 · Video 3 · GIF 2 · Audio 2`, derived from live tools. Plain text, not pills.

### 7.5 How it works

- Section label: `02 / How it works`
- H2: `Drop. Adjust. Done.`
- Three columns with large mono numbers `01`, `02`, `03`:
  1. `Add a file` - `Pick a tool and drop in a file, or try the bundled sample. Nothing is uploaded.`
  2. `Set your options` - `Choose the size, format, range, or quality you need. Defaults are sensible.`
  3. `Download the result` - `Preview the output and save it. Files stay in this tab.`
- Below, a single muted line: `No queue. No account. No upload bar.`

### 7.6 Why local

- Section label: `03 / Why local`
- H2: `Privacy you can verify.`
- Intro: `Open DevTools. Process a file. Watch the network tab stay quiet. That is the whole claim.`
- Three items, two columns on desktop with the intro, or three equal columns:
  - `Your files stay yours` - `Processing uses browser APIs, Canvas, and WebAssembly. No file bytes are sent to any server.`
  - `No round trip` - `There is no upload, queue, or remote download. Speed depends on your device, not your connection.`
  - `Nothing to sign up for` - `No account, email, or cloud storage. Close the tab and the working files are gone.`
- Add a text link `Read the privacy details` to `/privacy`.
- Do not use fear-based copy about other tools, hackers, or data breaches.

### 7.7 FAQ

- Section label: `04 / FAQ`
- H2: `Questions, answered.`
- Layout: heading on the left, accordion on the right on desktop; stacked on mobile. Use native `<details>` elements or an accessible HeroUI accordion. All closed by default.
- Anchor id: `faq`.
- Questions and final answers:

1. **Are my files uploaded anywhere?**
   `No. Every tool runs in your browser. Files are read from your device, processed in memory, and never sent to a server.`
2. **Is there a file size limit?**
   `Only what your browser can hold in memory. Each tool shows its own limit. For video, stay under 500 MB and 20 minutes on a desktop for a reliable run.`
3. **Do I need an account?**
   `No. There is no sign-up, login, or cloud storage.`
4. **Is it free?**
   `Yes. No ads, no paywall, and no watermark on your output.`
5. **Does it work offline?**
   `Processing is local, but the app needs its first load from the web. Offline support is not part of this version.`
6. **Which browsers work best?**
   `Current Chrome, Edge, Firefox, and Safari handle images, PDFs, and audio. Video and GIF encoding is fastest in desktop Chrome or Edge.`
7. **Why is video slower than the other tools?**
   `Video encoding uses FFmpeg compiled to WebAssembly and runs in a single thread. It is private, but slower than a native app. Keep clips short.`
8. **Can I use the output commercially?**
   `Yes. Your files remain yours. Third-party libraries have their own licenses, listed on the licenses page.`
9. **What happens if I close the tab?**
   `The job stops and in-memory files are discarded. Download your result before closing.`
10. **Do you track me?**
    `No analytics, cookies, or fingerprinting. The footer fetches public profile text from dhirajarya.in. That request contains no file data.`

- Add a closing line: `Still curious? Read the privacy details.` with a link.

### 7.8 Landing acceptance criteria

- H1, eyebrow, subcopy, and both CTAs match the specified copy.
- The demo performs real compression and reports computed values.
- Exactly six featured cards link to real tools; counts match the live registry.
- All landing links resolve. No `href="#"`.
- No banned design pattern from section 4.9 appears.
- No heavy engine is requested on initial load. Verify in the network panel.
- LCP element is the H1 or hero text, not an image.
- Layout works at 360 px with no horizontal scroll.
- Both themes are complete, with no hardcoded light-only colors.
- FAQ accordion is keyboard accessible and closes on Escape where focus is inside.

---

## 8. Global search and command palette

Search is a core feature, not a decorative input. It must be fast, keyboard-first, and available on every page.

### 8.1 Entry points

- `Cmd+K` on macOS and `Ctrl+K` on Windows/Linux opens the palette from anywhere.
- `/` opens the palette when focus is not inside an input, textarea, select, or contenteditable element.
- Header search button opens it. The button shows `Search` and a platform-correct shortcut hint on desktop.
- Mobile header search icon opens it full screen.
- The hero's `Search tools` button opens it.
- The 404 page's search button opens it.
- Do not add a floating action button.

### 8.2 Data and matching

- Build the index from the live tool registry only.
- Index fields: name, tagline, description, category label, keywords, aliases, input formats, output formats.
- Use Fuse.js with:
  - `threshold: 0.35`
  - `ignoreLocation: true`
  - `minMatchCharLength: 2`
  - weights: name 0.45, aliases 0.25, keywords 0.15, description 0.1, category 0.05
- Normalize case and diacritics. Trim whitespace. Treat hyphens and spaces as equivalent.
- Boost exact name prefixes, then name matches, then aliases and keywords.
- Tie-break by registry order.
- Searching `png to jpg`, `reduce pdf`, `cut video`, `make gif`, or `mp3` must find the right tool through aliases and keywords.
- No network requests. No search analytics. No query persistence.

### 8.3 Palette layout

- Desktop: centered dialog, width 640 px, top offset 15 vh, max height 70 vh. Surface raised, 1 px border, 12 px radius.
- Mobile: full-screen sheet with safe-area padding, 44 px rows, close button.
- Top: search input with magnifier, autofocus, placeholder `Search 19 tools...`, and an Escape hint.
- Body: scrollable results.
- Footer: keyboard hints `Up/Down navigate`, `Enter open`, `Esc close`; right side `19 tools · 0 uploads`.
- Empty query view:
  - `Recent` group if recents exist, maximum five.
  - `All tools` group, grouped by category, in registry order.
  - `Actions` group at the end.
- Query view:
  - Flat ranked list grouped by category, showing name, category, and a short tagline.
  - Maximum 20 results. Scroll for the rest.
  - Highlight matched characters in the name using a subtle accent underline, not a colored background.
- Actions when query is empty or matches:
  - `Toggle theme`
  - `Go to all tools`
  - `Clear recent tools` (only if recents exist)
- No results:
  - `No tool matches "query".`
  - Suggestion buttons: `compress image`, `merge pdf`, `trim video`, `make gif`, `convert audio`. Clicking sets the query.
  - `Browse all tools` button navigates to `/tools`.
- Never show unbuilt P1 or P2 tools.

### 8.4 Keyboard behavior

- Up and Down move the active option, wrapping at the ends. Only rows, not group headings.
- Enter opens the active row or runs the active action.
- Escape closes the palette and restores focus to the element that opened it.
- Tab is trapped inside the dialog. Shift+Tab cycles backward.
- Home and End jump to the first and last option.
- `Cmd/Ctrl+Enter` is not used.
- Typing always focuses the input. Do not use single-letter global shortcuts other than `/`.
- When the palette opens, the body scroll is locked and restored on close.
- Hovering a row moves the active state to that row.
- Announce the result count in a polite live region, throttled to changes in count, not every keystroke.
- Active option scrolls into view with `block: nearest`.

### 8.5 Recents

- Store tool slugs, not names or file data.
- Maximum five, most recent first, deduplicated.
- Record when a tool page is opened, not when a search result is merely highlighted.
- Filter out slugs that no longer exist when reading.
- `Clear recent tools` removes the key and updates the view immediately.
- Recents are optional; the palette works without localStorage access.

### 8.6 Accessibility

- Implement the ARIA combobox and listbox pattern:
  - Input: `role="combobox"`, `aria-expanded="true"`, `aria-controls="search-results"`, `aria-activedescendant`.
  - Results container: `role="listbox"`.
  - Rows: `role="option"`, `aria-selected` on the active row.
- The dialog uses `role="dialog"` and `aria-modal="true"` with a labelled title that is visually hidden.
- Focus never leaves the dialog while open.
- Screen readers announce the active option name and category.
- Reduced motion disables the open scale animation.

### 8.7 Performance

- Lazy load Fuse and the palette component on first open. The header only ships a small event listener and button.
- Creating the index must take under 5 ms for 19 tools.
- Filtering must feel instant: under 16 ms per keystroke on the target devices.
- Do not debounce typing for this index size. If the index grows beyond 100 tools, revisit.
- Prefetch the top result's route only after 300 ms of hover or focus.

### 8.8 Search acceptance criteria

- `Ctrl+K` and `Cmd+K` open the palette on every page.
- `/` opens it outside inputs, and types normally inside inputs.
- Typing `png jpg` finds Image Converter; `reduce pdf` finds Compress PDF; `gif` lists both GIF tools.
- Arrow keys, Enter, Escape, Home, and End work as specified.
- Focus is trapped and restored.
- Mobile full-screen layout works at 360 px.
- Recents persist across reloads and can be cleared.
- No unbuilt tools appear.
- No network request occurs while searching.

### 8.9 Footer profile fetch

The footer fetches public profile data from `https://dhirajarya.in/llms.txt`.

Requirements:

- Render committed fallback profile data immediately. Never block the footer on the network.
- Fetch after mount with:
  - `credentials: "omit"`
  - `referrerPolicy: "no-referrer"`
  - `signal: AbortSignal.timeout(3500)`
- Cache successful parsed data in `sessionStorage` under `localkit.profile` for 6 hours. Never cache file data.
- Parse conservatively:
  - First H1 as display name.
  - First paragraph or blockquote after the H1 as a short bio, stripped of Markdown and capped at 220 characters.
  - The first link to `dhirajarya.in` as the site link.
  - Known external profile links only: GitHub, X/Twitter, LinkedIn, YouTube. Maximum five. Allow `https` only.
- If parsing is ambiguous or incomplete, keep fallback values for missing fields.
- If the fetch fails, is blocked by CORS, times out, or returns non-200, silently keep fallback data. Do not show an error.
- Sanitize all text by rendering as React text nodes. Never inject HTML. Links get `rel="noopener noreferrer me"`.
- Reserve the profile block's height to avoid layout shift.
- The request is the only allowed external runtime call. Document it on the privacy page.
- Recommended CORS header on dhirajarya.in: `Access-Control-Allow-Origin: <site origin>`. This is an owner-side configuration, not an app workaround. The fallback must work without it.

Fallback data:

```
Name: Dhiraj Arya
Bio: Leave empty until the owner approves fallback copy.
Site: https://dhirajarya.in
Links: None until the owner provides real profile URLs.
```

Do not invent handles, biographies, or social links. If the fetch fails and no approved fallback bio exists, the footer shows only the name and site link. The `Elsewhere` column is hidden when there are no real links.

---

## 9. Tools directory page

`/tools` is the full catalog. It must not duplicate the landing hero or demo.

### 9.1 Layout

- Header and footer from the shared layout.
- Page intro:
  - Label: `THE TOOLBOX`
  - H1: `All 19 tools.`
  - Subcopy: `Images, PDFs, video, GIFs, and audio. Pick one. Nothing leaves your device.`
- Search control: an input labeled `Filter tools` with a magnifier. This filters the visible directory; it is not the command palette. Pressing `Cmd/Ctrl+K` still opens the global palette.
- Category tabs: `All 19`, `Images 4`, `PDF 8`, `Video 3`, `GIF 2`, `Audio 2`. Counts come from the registry. Active tab uses an accent underline, not a filled pill.
- Directory body: grouped by category with section headings when `All` is selected. When a category is selected, show a single flat grid.
- Cards match the featured card design. Each shows name, description, formats, and an arrow.
- Result count in small text, announced politely when it changes.
- Empty state: `No tool matches "..."` with a `Clear filter` button and a link to the command palette.
- No pagination. Nineteen cards fit on one page.

### 9.2 Behavior

- Filtering is case-insensitive substring matching over name, tagline, keywords, and formats. It is intentionally simpler and more predictable than the fuzzy palette.
- Category and query are reflected in the URL with `history.replaceState`. Reloading the URL restores the filters.
- Filtering must not lose keyboard focus or reset scroll unexpectedly. Use a stable input.
- The page is statically rendered; filtering happens on the client.
- Category tabs and filter are fully keyboard accessible with visible focus.
- Do not show unbuilt tools, disabled cards, or "coming soon" labels.

### 9.3 Acceptance criteria

- All 19 live tools appear with correct counts.
- Every card navigates to a working tool.
- Category filters and text filter combine correctly.
- URL state restores on reload.
- Empty state is reachable and clearable.
- Works at 360 px and with keyboard only.

---

## 10. Shared tool page template

Every P0 tool uses the same shell. Tool-specific controls sit inside it. Consistency is required.

### 10.1 Page structure

1. Header and breadcrumbs: `Tools / Category / Tool name`.
2. Tool header:
   - Pikaicon in a bordered square.
   - H1 tool name.
   - One-sentence description.
   - Small privacy badge with a device icon: `Runs locally`.
   - Format chips for accepted inputs and produced outputs.
3. Workspace, two columns on desktop:
   - Left, 8 columns: input area, file list, preview, results.
   - Right, 4 columns: options panel, sticky below the header, primary action at the bottom.
   - Below 1024 px: one column, options after the input area, primary action in a sticky bottom bar.
4. Tool notes:
   - `How it works` with three tool-specific steps.
   - `Good to know` with two to four caveats from the tool specification.
   - `Related tools` with up to three cards.
5. Footer.

### 10.2 Empty state

- Dashed 1 px border, 12 px radius, generous vertical padding.
- Pikaicon upload or file icon, 24 px.
- Headline: `Drop a file here` or `Drop files here`, depending on the tool.
- Subline: `or browse from your device`, with the browse text acting as the file input trigger.
- Accepted formats and maximum size in mono small text.
- `Try a sample` text button for tools that have a bundled sample: Image Compressor, Merge PDF, Video Trimmer, Audio Trimmer. Samples are real local files and are processed like user files.
- The entire dropzone is a label or button for accessibility, not a div with a click handler only.
- Support paste from the clipboard for images on image tools. Do not advertise paste for PDFs or video.

### 10.3 File list and reordering

- Show a thumbnail where inexpensive: image thumbnail, first PDF page thumbnail, video poster frame if available, audio waveform or file icon.
- Show file name truncated in the middle, size, and type.
- Remove button with an accessible label containing the file name.
- Reorder with drag and drop plus explicit Move up and Move down buttons. Keyboard users must be able to reorder without dragging.
- Keep the original order visible as numbering: `01`, `02`, `03`.
- For single-file tools, show one file card with Replace and Remove actions.
- Do not read or store files outside the current page session.

### 10.4 Options panel

- Group related options with labels and helper text.
- Defaults must produce a useful result with one click.
- Show units in the label or suffix: `Target size (KB)`, `Width (px)`.
- Validate inline before enabling the primary action. Do not wait until submit to explain an invalid range.
- Disable options that do not apply instead of hiding them abruptly, unless hiding reduces confusion. Explain why in helper text.
- Use native controls where possible: range, number, select, checkbox. Style with tokens.
- Preserve settings when replacing a file in the same session. Reset to defaults on `Start over`.

### 10.5 Primary action and processing

- Action label is verb and object: `Compress image`, `Merge PDFs`, `Trim video`. Not `Submit` or `Go`.
- Disabled until input and options are valid.
- While running:
  - Disable the action and file changes.
  - Show a real progress bar when progress is known. Otherwise show an indeterminate bar with a stage label.
  - Show elapsed time after 3 seconds.
  - Show a Cancel button.
  - Announce stage changes via a polite live region. Do not announce every percent.
- Concurrency: one job per tab. One file at a time for video, audio, and PDF rasterization. At most two concurrent images.
- Never fake progress. If the engine cannot report progress, use an indeterminate state and say so.
- Yield to the main thread between pages, files, or large chunks so the UI remains responsive.

### 10.6 Results

- Keep the result in memory until `Start over` or unmount.
- Show before and after size, percentage saved or increased, and output dimensions or duration where relevant.
- Preview:
  - Image: image preview with a before/after toggle and dimensions.
  - PDF: first-page thumbnail and page count. Do not embed a full PDF viewer in v1.
  - Video: `<video>` player with controls.
  - GIF: `<img>` preview.
  - Audio: `<audio>` player.
- Download button uses the standard download helper. No automatic downloads.
- Multiple outputs: `Download all (.zip)` primary, plus per-file download rows. Use `fflate`.
- Provide `Start over` that clears files, results, errors, and object URLs.
- If output is larger than input, say so honestly: `The result is larger than the original. Download the original instead.` Provide the original download when possible.
- Do not claim savings that were not measured.

### 10.7 Errors

- Per-file errors in a batch do not stop other files. Show a summarized error list and let successful files download.
- Fatal errors replace the progress area with an inline alert and a `Try again` action.
- Error copy is specific and actionable. Examples:
  - `That file is not a PNG, JPG, or WebP image.`
  - `This PDF is password-protected. Password-protected PDFs are not supported.`
  - `The browser ran out of memory. Try a smaller file or close other tabs.`
  - `Could not reach 200 KB. The smallest result is 260 KB at 640 by 427.`
  - `Cancelled. Nothing was downloaded.`
- Never use `Oops`, `Something went wrong`, or a generic error with no next step.
- Log technical details to the console in development only. Do not send error reports anywhere.

### 10.8 File rules common to all tools

- Validate the extension, magic bytes, and actual decodability. Never trust the MIME type reported by the browser.
- Reject zero-byte files.
- Apply the per-tool and global limits in section 10.9 before decoding.
- Sanitize output file names:
  - Remove `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`, and control characters.
  - Trim leading and trailing dots and spaces.
  - Limit to 100 characters.
  - Fall back to `localkit` if the name becomes empty.
- Single output name: `{original-base}-{suffix}.{ext}`. Examples: `photo-compressed.webp`, `report-merged.pdf`.
- Multiple outputs: zip named `localkit-{tool}-{YYYYMMDD-HHmm}.zip`. Entries use the original base names. Resolve collisions with `-2`, `-3`.
- Output blob types must match the actual file format.
- Revoke object URLs on reset, unmount, and 60 seconds after download.
- Never include the original full path or any directory information in outputs.

### 10.9 Global limits

Limits are constants in `lib/constants.ts` and must be displayed in the relevant tool UI. They are deliberately conservative to prevent tab crashes.

| Category | Per file | Count | Total | Notes |
|---|---|---|---|---|
| Images | 30 MB | 100 files | 300 MB | Max 16,384 px per side, 100 MP per image |
| PDFs | 150 MB | 30 files for merge | 300 MB | Max 1,000 total pages; Organize max 500 pages |
| Video | 500 MB | 1 file | 500 MB | Max 20 minutes; desktop recommended |
| GIF | 30 MB | 1 file | 30 MB | Max 300 frames; max 30 seconds output from video |
| Audio | 200 MB | 1 file | 200 MB | Max 2 hours |
| ZIP (P1) | 500 MB | 1 archive | 500 MB | Max 1 GB uncompressed |

- If a file exceeds a limit, reject it before reading it into memory and say which limit was exceeded.
- Catch out-of-memory and decoding errors and show the standard memory message.
- Do not promise these limits on every device. Browsers and devices vary. The UI can say `Up to` and the error can explain.
- The user may process files below the limits that still fail on a low-memory device. That is acceptable if the error is honest and actionable.

### 10.10 Downloads

- Use a Blob and an object URL with an `<a download>` element.
- The click must be a direct user gesture for Safari compatibility.
- Large files: warn above 1 GB that the browser may fail to save; still allow the attempt.
- Batch outputs are zipped. Do not trigger multiple simultaneous downloads.
- Show the final file name and size before download.
- Never auto-download or auto-open a result.

### 10.11 Metadata and privacy defaults

- Strip EXIF, GPS, and camera metadata from all image outputs by default.
- Clear author, subject, keywords, and creator metadata from generated PDFs; set producer and creator to `LocalKit`. The title is set to the output file name.
- Preserve PDF text and page content during non-raster operations. Do not silently flatten unless the tool explicitly says so.
- Never include file names or contents in logs, URLs, analytics, or error reports.

### 10.12 Tool page acceptance criteria

- Empty, loading, processing, success, partial-error, and fatal-error states are designed and reachable in tests.
- One-click defaults produce a valid download for a supported fixture.
- Cancel works and leaves no partial download.
- Reload clears all files and results.
- Keyboard-only use is possible, including file selection, option changes, processing, and download.
- Mobile layout at 360 px is usable without horizontal scroll.
- Both themes are complete.
- Result numbers are computed, not hardcoded.
- No network request carries file bytes.

---

## 11. P0 tool specifications

Each specification defines behavior, defaults, edge cases, and acceptance. Implement exactly this scope. Do not add options that are not listed unless required to make the stated behavior work.

### 11.1 IMG-01 Image Converter

**Route:** `/tools/image-converter`  
**Engine:** Canvas or OffscreenCanvas, Web Worker preferred  
**Job:** Convert images between PNG, JPG, and WebP in the browser.

**Input:** 1 to 100 images. PNG, JPEG, WebP. Up to 30 MB each, 300 MB total. Animated GIF, animated WebP, SVG, HEIC, and AVIF output are not supported in v1.0.

**Output:** One image per input in the selected format. Multiple files download as a zip.

**Options:**

| Option | Values | Default |
|---|---|---|
| Output format | JPG, PNG, WebP | WebP |
| Quality | 1 to 100 | 80, shown only for JPG and WebP |
| Background | Color picker | `#FFFFFF`, shown only for JPG |

**Rules:**

- Preserve pixel dimensions exactly. Do not resize.
- Apply EXIF orientation before drawing.
- Preserve transparency for PNG and WebP. Flatten transparency onto the background color for JPG.
- Strip all metadata.
- Convert to sRGB through the browser's canvas pipeline.
- For PNG output, ignore the quality control and use lossless encoding.
- Process files independently; a corrupt file does not stop the batch.
- Show before and after size per file and a total.
- Name outputs `{base}-converted.{ext}`.
- If the output is larger than the input, show the increase honestly and still allow download.

**Edge cases:**

- Zero-byte file: reject with `This file is empty.`
- Corrupt or undecodable image: per-file error.
- Animated image: reject with `Animated images are not supported here. Try the GIF tools.`
- Extremely large dimensions: reject above 16,384 px per side or 100 MP.
- A PNG with transparency converted to JPG must have no black background.

**Acceptance criteria:**

- PNG with alpha to JPG produces a white background by default.
- JPG to PNG produces a valid PNG with the same dimensions.
- JPG to WebP at quality 80 produces a smaller, valid WebP.
- Batch of five mixed images produces a zip with five correctly named, decodable files.
- Output contains no EXIF camera or GPS data.
- Cancel during a batch discards partial results.
- Keyboard-only flow works.

### 11.2 IMG-02 Image Compressor

**Route:** `/tools/image-compressor`  
**Engine:** Canvas or OffscreenCanvas, Web Worker. This engine also powers the landing demo.

**Job:** Reduce image file size by quality, target size, or dimensions.

**Input:** 1 to 100 images. PNG, JPEG, WebP. Up to 30 MB each, 300 MB total.

**Output:** One compressed image per input. Multiple files as a zip.

**Options:**

| Option | Values | Default |
|---|---|---|
| Mode | Quality, Target size | Quality |
| Quality | 1 to 100 | 75 |
| Target size | 10 KB to 20 MB, with unit selector | 200 KB |
| Output format | Auto, JPG, WebP, PNG | Auto |
| Max width | 0 or 32 to 16,384 px | 0, meaning original |
| Max height | 0 or 32 to 16,384 px | 0, meaning original |
| Lock aspect ratio | On, off | On |

**Rules:**

- `Auto` keeps the input format in Quality mode when it is JPG, PNG, or WebP. In Target size mode, `Auto` uses WebP because PNG cannot reliably hit a byte target. State this in helper text.
- Always downscale proportionally to fit within max width and max height. Never upscale. Never crop.
- Never crop or change the aspect ratio.
- Strip metadata.
- Apply EXIF orientation.
- Target-size algorithm:
  1. Encode with quality 100.
  2. If it is already at or below target, keep it.
  3. Binary search quality between 1 and 100 for at most 8 iterations.
  4. If still above target at quality 1, reduce dimensions by 10 percent per step, re-encoding at quality 80, until the target is met or 64 px is reached.
  5. Stop after 12 dimension steps. Report the closest result.
- Hit tolerance: within 5 percent above or below target is acceptable. Never inflate a file to reach a target. If the original is already below target, keep the original and say so.
- A quality-mode result may be larger than the input for oddly compressed sources. Show the truth and offer the original.
- Show before and after size, total saved, and output dimensions. For a single image, provide a before/after image toggle.
- Name outputs `{base}-compressed.{ext}`.
- The landing demo uses the same target/quality engine and the same result formatting helpers.

**Edge cases:**

- Target unreachable: show `Could not reach {target}. The smallest result is {size} at {width} by {height}.`
- PNG with transparency converted to JPG: flatten onto white. If output is WebP or PNG, preserve alpha.
- Animated images: reject and link to GIF tools.
- Very large dimensions: reject above 16,384 px per side or 100 MP.
- Batch continues after a per-file failure.

**Acceptance criteria:**

- A 2.4 MB JPEG compresses to within 5 percent of a 200 KB target on Chrome desktop.
- If target is unreachable, the failure message includes the actual smallest size.
- Max width 800 on a 1600 px image produces an 800 px wide output with the correct height.
- PNG alpha survives a WebP export.
- No metadata in output.
- The landing demo and tool produce identical numbers for the same sample and settings.

### 11.3 IMG-03 Image Resizer

**Route:** `/tools/image-resizer`  
**Engine:** Canvas or OffscreenCanvas, Web Worker

**Job:** Resize images to exact dimensions, a bounding box, or a percentage.

**Input:** 1 to 100 images. PNG, JPEG, WebP. Up to 30 MB each, 300 MB total.

**Output:** Resized images. Multiple files as a zip.

**Options:**

| Option | Values | Default |
|---|---|---|
| Mode | Dimensions, Percentage | Dimensions |
| Width | 32 to 16,384 px | Original width |
| Height | 32 to 16,384 px | Original height |
| Lock aspect ratio | On, off | On |
| Fit | Contain, Cover, Stretch | Contain |
| Percentage | 1 to 400 percent | 100 |
| Allow upscaling | On, off | Off |
| Background | Color picker | `#FFFFFF`, only for contain with transparency |
| Output format | Keep, JPG, PNG, WebP | Keep |
| Quality | 1 to 100 | 85, only for JPG and WebP |

**Rules:**

- Contain: fit the whole image inside the box, letterbox with the background color when the output format cannot preserve transparency.
- Cover: fill the box and center-crop the overflow.
- Stretch: force exact dimensions and ignore aspect ratio.
- With aspect lock on and both dimensions editable, changing one updates the other proportionally.
- Percentage scales both dimensions from the original.
- Upscaling off means the output is never larger than the original in either dimension. If the requested box is larger, keep the original size and tell the user.
- For batch runs, the same settings apply to every image. Contain is the default so batch images are never cropped unexpectedly.
- Preserve transparency for PNG and WebP. Flatten onto the selected background for JPG.
- Strip metadata. Apply EXIF orientation.
- Name outputs `{base}-{width}x{height}.{ext}`.

**Edge cases:**

- Requested dimensions above browser canvas limits: reject with a clear limit message.
- Zero or negative dimensions: inline validation.
- A batch with mixed aspect ratios: each image is fitted independently into the same box.
- Animated images: reject.

**Acceptance criteria:**

- A 1200 by 800 image with lock on, width 600, produces 600 by 400.
- Contain into 500 by 500 produces a 500 by 333 image, not 500 by 500, unless padding is required by the output format.
- Cover into 500 by 500 produces exactly 500 by 500 with a centered crop.
- Upscaling disabled never increases dimensions.
- Percentage 50 halves both dimensions, rounded correctly.
- Transparent PNG to JPG uses the chosen background.

### 11.4 IMG-04 Favicon Studio

**Route:** `/tools/favicon-studio`  
**Engine:** Canvas plus a small ICO encoder written in the project. Do not add a server dependency.

**Job:** Generate a complete favicon set from one image.

**Input:** One PNG, JPEG, or WebP image. Minimum 48 by 48 px; 512 by 512 or larger recommended. Up to 30 MB. Animated images, SVG, and HEIC are not supported.

**Output:** A zip containing:

- `favicon.ico` with 16, 32, and 48 px entries.
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon-48x48.png`
- `apple-touch-icon.png` at 180 by 180.
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `site.webmanifest`
- `favicon-snippet.html`

**Options:**

| Option | Values | Default |
|---|---|---|
| Crop | Center square, fit with padding | Center square |
| Padding | 0 to 20 percent | 0 |
| Background | Transparent, white, custom color | Transparent |
| App name | Text, 1 to 60 characters | `My Site` |
| Theme color | Color picker | `#000000` |

**Rules:**

- If the source is not square, center-crop to a square. Do not stretch.
- Render each target size from the source at high quality. Do not upscale the 16 px image to make the 512 px one.
- Apply padding inside the square. Padding uses the background color.
- Preserve transparency when the background is transparent and the target format supports it. ICO entries use PNG payloads, which support alpha in modern browsers.
- The ICO container is written locally: 6-byte header, 16-byte directory entries, then PNG blobs. Validate the output opens in Chrome, Firefox, and Safari.
- `site.webmanifest` uses the app name, theme color, and the two Android PNG paths. Use relative paths.
- `favicon-snippet.html` contains the standard link tags with relative paths and a short comment.
- Upscaling a source below 512 px is allowed with a warning. Below 48 px, reject.
- Show a live preview of the icon at 16, 32, 64, and 180 px on light and dark backgrounds.
- Name the zip `localkit-favicons.zip`.

**Edge cases:**

- Transparent source with a transparent background: keep alpha.
- Transparent source with a solid background: flood the background behind the icon, do not draw a square behind the visible pixels only.
- ICO must contain exactly three entries in the stated order.
- The manifest must be valid JSON and use a relative start URL of `./`.

**Acceptance criteria:**

- A 1024 px PNG produces all nine files with exact dimensions.
- The ICO displays correctly in a browser tab and contains 16, 32, and 48 px entries.
- The 16 px preview is legible for a simple mark.
- `site.webmanifest` parses as JSON and references existing files.
- Padding and background options are reflected in every raster output.
- Input below 48 px is rejected with a clear message.

### 11.5 PDF-01 Merge PDF

**Route:** `/tools/merge-pdf`  
**Engine:** pdf-lib for reading and writing, pdf.js only for thumbnails if performance allows. If thumbnails slow the first page, use file icons in v1.

**Job:** Combine multiple PDFs into one file, in a user-controlled order.

**Input:** 2 to 30 PDFs. Up to 150 MB each, 300 MB total, 1,000 pages combined. Reject password-protected PDFs individually with the file name in the message.

**Output:** One merged PDF.

**Options:** None beyond the output file name. Do not add bookmarks, compression, or page interleaving in v1.

**Rules:**

- Show each PDF with its name, size, and page count.
- Allow removal and reordering with drag and drop plus Move up and Move down buttons. Display `01`, `02`, and so on.
- Preserve page order within each source document.
- Preserve page sizes, orientation, and rotation.
- Set output metadata: title from the output name, producer `LocalKit`, creator `LocalKit`. Clear author, subject, and keywords.
- Show the total page count before merging and after merging.
- Do not rasterize pages. Keep text selectable.
- If one file is encrypted or corrupt, do not block the entire batch by default. Show a per-file error and let the user remove it, or fail clearly if fewer than two valid files remain.
- Warn that interactive forms and annotations may not survive; pdf-lib copies pages, not the document-level AcroForm.
- Name the output `{first-base}-merged.pdf` or the user-entered name.

**Edge cases:**

- One file only: primary action disabled with `Add at least two PDFs.`
- Combined page count over 1,000: reject with a clear message before loading pages.
- A PDF with zero pages: reject that file.
- Duplicate file names: allowed; use position numbers in the list.
- Encrypted PDF: `This PDF is password-protected. Password-protected PDFs are not supported.`

**Acceptance criteria:**

- Merging three PDFs with 2, 3, and 4 pages produces a 9-page PDF in the chosen order.
- Reordering changes the page order in the output.
- Page dimensions and orientation are preserved.
- Text remains selectable.
- Output opens in Chrome and Acrobat without repair prompts.
- Metadata does not include the original author.
- Per-file error appears for an encrypted file without crashing.

### 11.6 PDF-02 Split PDF

**Route:** `/tools/split-pdf`  
**Engine:** pdf-lib

**Job:** Extract selected pages or split a PDF into fixed-size chunks.

**Input:** One PDF up to 150 MB and 1,000 pages. Password-protected PDFs are rejected.

**Output:**

- Extract mode: one PDF containing the selected pages in document order.
- Split mode: multiple PDFs in a zip named `original-part-01.pdf`, `original-part-02.pdf`, and so on.

**Options:**

| Option | Values | Default |
|---|---|---|
| Mode | Extract pages, Split every N pages | Extract pages |
| Pages | Range string such as `1-3, 5, 8-10` | All pages |
| Split every | 1 to 500 pages | 10 |

**Rules:**

- Parse ranges tolerantly: spaces around numbers, commas, and hyphens. Support `1-3`, `5`, and `1, 3-5`. Do not support open-ended ranges like `3-` in v1.
- Reject page 0, negative pages, reverse ranges, and pages beyond the document count with an inline error naming the invalid part.
- Deduplicate repeated pages. Output in ascending document order for Extract mode, regardless of the order typed. State this in helper text.
- Show total pages and the number of pages that will be output.
- In Split mode, the last chunk may be smaller. Preserve page order and sizes.
- Clear metadata on outputs and set producer and creator to `LocalKit`.
- Do not encrypt, rasterize, or compress in this tool.
- Validate before enabling the action.

**Edge cases:**

- A range that selects zero pages: disable the action.
- A one-page PDF split every 10 pages: one output, offered directly rather than as a zip.
- Duplicate pages in input: allowed once in output.
- Empty range input: default to all pages only when the field is untouched. If the user clears it, show validation.

**Acceptance criteria:**

- Extracting `1-3, 5` from a 10-page PDF yields a 4-page PDF with pages 1, 2, 3, 5.
- Splitting a 25-page PDF every 10 pages yields three files with 10, 10, and 5 pages.
- Invalid ranges show a specific message and do not start processing.
- Output files open without errors.
- Metadata is cleaned.
- The zip contains correctly named parts.

### 11.7 PDF-03 Compress PDF

**Route:** `/tools/compress-pdf`  
**Engine:** pdf.js for rendering pages, pdf-lib for rebuilding, Canvas JPEG encoding.

**Job:** Reduce PDF file size with a clear choice between keeping text and flattening pages.

**Input:** One PDF up to 150 MB and 500 pages. Password-protected PDFs are rejected.

**Output:** One compressed PDF.

**Options:**

| Level | Behavior | Keeps text selectable |
|---|---|---|
| Light | Remove metadata, save with object streams, no page rasterization | Yes |
| Balanced | Rasterize pages at 150 DPI, JPEG quality 72 | No |
| Strong | Rasterize pages at 110 DPI, JPEG quality 55 | No |

**Rules:**

- Default: Balanced.
- Show an explicit warning before processing Balanced and Strong: `Pages will be flattened to images. Text will no longer be selectable, and links and forms will be removed.`
- For Light, keep content and page structure intact, clean metadata, and use object streams. Size reduction may be small or zero. Say so.
- For Balanced and Strong:
  - Render each page with pdf.js at the target DPI, respecting page rotation and dimensions.
  - Encode each rendered page as JPEG at the selected quality.
  - Create a new PDF page with the original page dimensions in points and draw the image to fill the page.
  - Preserve page order and count.
- Never upscale a page beyond its rendered target resolution.
- If the output is larger than the input, show `The compressed file is larger than the original. Your PDF may already be optimized.` and offer the original as a download. Do not hide this.
- Scanned PDFs usually shrink. Text-heavy PDFs may grow when flattened. State this in `Good to know`.
- Show page-by-page progress. Cancel discards the partial output.
- Limit to 500 pages. Above that, stop with a clear message before rendering.
- Clean metadata in all levels.

**Edge cases:**

- A PDF with mixed page sizes: preserve each page's dimensions.
- Rotated pages: render the visible orientation and set the new page rotation to 0.
- Pages larger than 8,192 px at the target DPI: cap the render scale and note reduced quality.
- Encrypted or corrupt PDF: reject with a specific message.
- Cancel during page 120 of 300: no download, UI returns to ready.

**Acceptance criteria:**

- A scanned 10-page PDF at Balanced is smaller than the input and remains readable.
- The output has the same page count and page dimensions.
- Text-heavy PDF at Balanced shows an honest warning if the output grows.
- Light keeps text selectable.
- Progress advances per page and cancel works.
- Output opens in Chrome and Acrobat without repair prompts.
- Metadata is clean.

### 11.8 PDF-04 PDF to Images

**Route:** `/tools/pdf-to-images`  
**Engine:** pdf.js rendering, Canvas encoding, fflate for multi-file zip

**Job:** Convert PDF pages to PNG, JPG, or WebP images.

**Input:** One PDF up to 150 MB and 1,000 pages. Password-protected PDFs are rejected.

**Output:** One image per selected page. A single page downloads directly; multiple pages download as a zip.

**Options:**

| Option | Values | Default |
|---|---|---|
| Format | PNG, JPG, WebP | PNG |
| Quality | 1 to 100 | 85, shown for JPG and WebP |
| Resolution | 72, 150, 300 DPI | 150 |
| Pages | Range string | All pages |

**Rules:**

- Render at scale `DPI / 72`. Cap each output dimension at 8,192 px. If the cap is exceeded, reduce the scale and tell the user.
- Preserve page order and white page backgrounds.
- Use page numbers with three digits: `page-001.png`.
- Show a thumbnail grid of results with individual download buttons and a `Download all (.zip)` action.
- Show the output dimensions per page and total size.
- Do not OCR. If a page has no text, that is irrelevant for this tool.
- Do not embed a full PDF viewer.
- Processing large documents renders sequentially with progress and cancel.
- Clean or ignore metadata; output images contain no PDF metadata.

**Edge cases:**

- A 300 DPI A3 page may exceed the pixel cap; reduce scale and note it.
- Page ranges follow the same parser and validation as Split PDF.
- Single-page output must not be zipped.
- Zero pages selected: disable the action.
- Corrupt PDF: specific error.

**Acceptance criteria:**

- A 3-page PDF at 150 DPI produces three PNGs in a zip with the correct dimensions.
- Page order matches the PDF.
- A single page produces a direct PNG download.
- JPG quality changes the file size.
- Range `2-3` produces exactly two images.
- Cancel during rendering produces no partial zip.
- Output images open without errors.

### 11.9 PDF-05 Organize PDF

**Route:** `/tools/organize-pdf`  
**Engine:** pdf.js for thumbnails, pdf-lib for output

**Job:** Reorder, rotate, and delete PDF pages, then save a new PDF.

**Input:** One PDF up to 150 MB and 500 pages. Password-protected PDFs are rejected.

**Output:** One reorganized PDF.

**Options and actions:**

- Page thumbnails in a grid, with page numbers.
- Move left and Move right per page, plus drag and drop reordering.
- Rotate left and Rotate right in 90-degree steps per page.
- Delete per page, with Undo for the last deletion. A `Restore all` action resets to the original document.
- Select multiple pages for bulk delete or rotate? Not in v1. Keep single-page operations plus drag reorder.
- A `Reset` action restores the original order, rotation, and pages.

**Rules:**

- Render thumbnails lazily as they enter the viewport. Do not render 500 full-size pages at once.
- Keep original page dimensions. Rotation is applied with pdf-lib's page rotation property, not by resizing.
- Deleting all pages is invalid. Keep at least one page and disable the action when one page remains.
- Drag and drop must work with mouse and touch. Keyboard users use Move left and Move right buttons. Announce the new position politely.
- Preserve text and vector content. Do not rasterize.
- Clear output metadata and set producer and creator to `LocalKit`.
- Show `N pages in, M pages out` before saving.
- Saving is a single action labeled `Save PDF`.

**Edge cases:**

- 500-page PDF: thumbnails load lazily; memory stays bounded.
- Rotated pages: the thumbnail shows the current rotation; saving applies it.
- Repeated rotate clicks cycle correctly through 0, 90, 180, 270, 0.
- Delete then Move: positions remain consistent.
- Reset after changes returns to the exact original state.
- A page with an unusual size keeps its dimensions.

**Acceptance criteria:**

- Moving page 3 to position 1 changes the output order.
- Rotating page 2 by 90 degrees is visible in the output.
- Deleting page 4 removes it and renumbers the rest.
- Text remains selectable.
- Page dimensions are preserved.
- Reset restores the original.
- Keyboard-only reorder works.
- 100-page PDF remains responsive while thumbnails load.

### 11.10 PDF-06 Watermark PDF

**Route:** `/tools/watermark-pdf`  
**Engine:** pdf-lib with standard fonts

**Job:** Add a text watermark to selected pages of a PDF.

**Input:** One PDF up to 150 MB and 1,000 pages. Password-protected PDFs are rejected.

**Output:** One watermarked PDF.

**Options:**

| Option | Values | Default |
|---|---|---|
| Text | 1 to 80 characters | `CONFIDENTIAL` |
| Font | Helvetica, Times Roman, Courier | Helvetica |
| Font size | 12 to 120 pt, or Auto | Auto |
| Opacity | 5 to 100 percent | 20 |
| Rotation | -90 to 90 degrees | 45 |
| Color | Color picker | `#000000` |
| Layout | Center, Tiled | Tiled |
| Pages | Range string | All pages |

**Rules:**

- Auto font size: scale with page size so the text is readable. For Center, cap at 72 pt. For Tiled, cap at 36 pt.
- Center: one watermark centered on the page, rotated around its center.
- Tiled: repeat across the page with spacing based on text width and height, clipped to the page. Avoid overlapping text that becomes unreadable.
- Apply opacity through pdf-lib's drawing opacity. Do not fake it with a light gray color.
- Standard fonts support WinAnsi characters only. If the text contains unsupported characters, show `This font does not support some characters. Use basic Latin characters.` and do not process.
- Preserve page content, text, links, and page dimensions. Add the watermark as a separate content stream.
- Apply to the selected pages only.
- Clean metadata and set producer and creator to `LocalKit`.
- Provide a preview of the first page with the watermark applied before saving? This is optional in v1. If preview is implemented, it must use the real output engine. Otherwise show a small schematic preview labeled `Approximate placement` and do not claim it is the final render. Prefer the real first-page render.
- Name output `{base}-watermarked.pdf`.

**Edge cases:**

- Empty text: disable the action.
- Text wider than the page: scale down or wrap? Do not wrap in v1. Reduce auto font size; if manually set and too wide, allow it to clip but warn.
- Rotated source pages: compute coordinates in unrotated page space and account for page rotation so the watermark appears upright.
- Unsupported Unicode: reject with the specific font message.

**Acceptance criteria:**

- A 5-page PDF with pages `1-3` gets watermarks on exactly three pages.
- Opacity and rotation match the settings visually.
- Tiled layout repeats without covering the entire page in solid ink.
- Text remains selectable and links remain intact.
- Output opens without repair prompts.
- Unsupported characters produce a clear error, not broken glyphs.

### 11.11 PDF-07 PDF Page Numbers

**Route:** `/tools/pdf-page-numbers`  
**Engine:** pdf-lib with standard fonts

**Job:** Add page numbers to a PDF.

**Input:** One PDF up to 150 MB and 1,000 pages. Password-protected PDFs are rejected.

**Output:** One numbered PDF.

**Options:**

| Option | Values | Default |
|---|---|---|
| Position | Bottom left, bottom center, bottom right, top left, top center, top right | Bottom center |
| Format | `1`, `1 / N`, `Page 1 of N`, `- 1 -` | `1 / N` |
| Start at | 1 to 10,000 | 1 |
| Font size | 8 to 24 pt | 10 |
| Margin | 12 to 72 pt | 24 |
| Pages | Range string | All pages |
| Skip first page | On, off | Off |
| Color | Color picker | `#000000` |

**Rules:**

- `N` is the total page count of the document, not the number of selected pages. State this in helper text.
- Numbering continues in document order for selected pages. `Start at` sets the number for the first selected page.
- Place text using the page's visible dimensions and respect page rotation. Numbers must appear upright on rotated pages.
- Margin is measured from the visible page edge.
- Do not overlap existing content intentionally; place in the margin area defined by the option.
- Preserve all content. Clean metadata and set producer and creator to `LocalKit`.
- Provide a real preview of page 1 if feasible; otherwise show the position schematically and label it.
- Name output `{base}-numbered.pdf`.

**Edge cases:**

- One-page PDF: still works.
- `Skip first page` plus a page range that excludes the first page: skip has no additional effect.
- Page numbers beyond 10,000: allow up to the document page count but cap the start value at 10,000.
- Rotated pages: position and rotation must be correct.
- Unsupported format strings: not possible because the format is a select.

**Acceptance criteria:**

- A 10-page PDF with `1 / N` shows `1 / 10` through `10 / 10`.
- Start at 5 begins with `5 / 10`.
- Skip first page leaves page 1 unnumbered.
- All six positions place the number inside the page margin.
- Rotated pages show upright numbers at the requested edge.
- Text remains selectable.

### 11.12 PDF-08 Images to PDF

**Route:** `/tools/images-to-pdf`  
**Engine:** Canvas for WebP conversion, pdf-lib for output

**Job:** Combine images into a single PDF, one image per page.

**Input:** 1 to 100 images. PNG, JPEG, WebP. Up to 30 MB each, 300 MB total.

**Output:** One PDF.

**Options:**

| Option | Values | Default |
|---|---|---|
| Page size | A4, Letter, Fit to image | A4 |
| Orientation | Auto, Portrait, Landscape | Auto |
| Margin | 0, 10, 20, 40 pt, custom 0 to 72 pt | 20 pt |
| Image fit | Contain, Cover | Contain |
| Background | Color picker | `#FFFFFF` |
| Output name | Text | `images.pdf` |

**Rules:**

- One image per page, in the user-controlled order.
- Apply EXIF orientation before placing.
- A4 and Letter: use standard point dimensions. Auto orientation chooses the orientation that best fits each image. A fixed orientation applies to all pages.
- Fit to image: page dimensions equal the image's pixel dimensions converted at 96 DPI to points (`px * 72 / 96`), capped at 14,400 pt per side. Add the margin around the image.
- Contain: fit the whole image inside the content box, centered, without cropping.
- Cover: fill the content box and center-crop the overflow.
- Flatten transparency onto the background color.
- Embed JPEG and PNG directly where possible to preserve quality. Convert WebP to PNG or high-quality JPEG first.
- Do not recompress JPEGs unnecessarily.
- Clean metadata and set title to the output name, producer and creator to `LocalKit`.
- Show the resulting page count and file size before download.
- Name output using the sanitized user name, ensuring a `.pdf` extension.

**Edge cases:**

- A single image: one-page PDF.
- Very large image: cap page size and scale down proportionally with contain.
- Mixed portrait and landscape images with Auto: each page gets the best orientation.
- Corrupt image: per-file error and continue if at least one valid image remains.
- Margin larger than the page content area: clamp and warn.

**Acceptance criteria:**

- Three images produce a 3-page PDF in the chosen order.
- A4 portrait pages are 595 by 842 pt.
- Fit to image uses the correct aspect ratio and dimensions within 1 pt.
- Contain never crops; Cover fills the page area.
- Transparent PNG shows the selected background, not black.
- Output opens in Chrome and Acrobat without repair prompts.

### 11.13 VID-01 Video Compressor

**Route:** `/tools/video-compressor`  
**Engine:** ffmpeg.wasm single-thread, loaded on first run

**Job:** Reduce video file size locally by re-encoding.

**Input:** One video. MP4, MOV, or WebM. Up to 500 MB and 20 minutes. Desktop recommended. Codecs that ffmpeg can demux but the browser cannot preview are accepted with a preview-unavailable note.

**Output:** MP4 with H.264 video and AAC audio. Fast-start enabled for web playback.

**Options:**

| Option | Values | Default |
|---|---|---|
| Quality | Light, Balanced, High, Custom | Balanced |
| CRF | 18 to 32, shown for Custom | 23 |
| Resolution | Keep, 1080p, 720p, 480p | Keep |
| Target size | Off, 10 MB to 2 GB | Off |
| Remove audio | On, off | Off |
| Frame rate | Keep, 30, 24 | Keep |

**Rules:**

- Quality mapping: Light CRF 28, Balanced CRF 23, High CRF 20.
- Resolution means fit within the stated height, preserve aspect ratio, never upscale. Use even dimensions for H.264.
- Target size:
  - Estimate video bitrate from target bytes, duration, and audio bitrate: `(targetBytes * 8 / durationSeconds) - audioBitrate`.
  - Clamp the video bitrate to a safe minimum and maximum.
  - Use single-pass bitrate mode, not two-pass, in v1.
  - State that the result is approximate.
- Command shape: `-i input -c:v libx264 -preset veryfast -crf N -vf scale=... -c:a aac -b:a 128k -movflags +faststart output.mp4`. In target mode, use `-b:v` instead of `-crf`.
- If audio is removed, use `-an`.
- Use `-pix_fmt yuv420p` for broad playback.
- Show input metadata: duration, dimensions, size, estimated output if target mode is on.
- Progress: parse ffmpeg log time against the duration. If progress cannot be determined, show an indeterminate state with the current stage.
- Show engine loading progress separately: `Loading video engine...` with real byte progress.
- Cancel calls `ffmpeg.terminate()` and discards output.
- Warn on mobile: `Video encoding is slow on phones. A desktop browser is recommended.` Do not block.
- Name output `{base}-compressed.mp4`.
- Show before and after size. If the result is larger, say so and offer the original.

**Edge cases:**

- Input already small: still allow, but warn that re-encoding may increase size.
- No audio track: ignore the audio options and note it.
- Variable frame rate: output constant frame rate when a frame rate option is selected; otherwise let ffmpeg decide.
- Rotation metadata: apply rotation so the output plays upright.
- Unsupported codec: show `This video codec is not supported by the local encoder. Try an MP4 with H.264.`
- Out of memory: terminate the engine, show the memory message, and suggest a shorter clip.
- Engine load failure: show a retry action and a note that the first run downloads the local engine.

**Acceptance criteria:**

- A 1-minute 720p MP4 compresses at Balanced, plays in Chrome and QuickTime, and keeps audio in sync.
- Resolution 480p produces a 480p-high output with the original aspect ratio.
- Target size 10 MB on a 30-second clip is within 20 percent of the target.
- Remove audio produces a silent video.
- Progress advances and cancel returns to the ready state.
- The output has fast-start enabled and plays before full download in a browser.
- No network request contains file bytes; only same-origin engine assets load.

### 11.14 VID-02 Video Trimmer

**Route:** `/tools/video-trimmer`  
**Engine:** ffmpeg.wasm single-thread, HTML video preview

**Job:** Cut a section from a video with accurate start and end points.

**Input:** One video. MP4, MOV, or WebM. Up to 500 MB and 20 minutes. Preview requires a browser-playable codec; processing may still work if preview does not.

**Output:** MP4 with H.264 and AAC, or no audio if the source has none.

**Options:**

| Option | Values | Default |
|---|---|---|
| Start | Time, 0 to duration | 0 |
| End | Time, greater than start | Duration |
| Preview selection | Play, pause | - |
| Output quality | Balanced, High | Balanced |

**Rules:**

- Show a video player and a timeline with draggable start and end handles.
- Provide time inputs in `mm:ss.mmm` and buttons `Set start to playhead` and `Set end to playhead`.
- Show selection duration live.
- Accurate mode only in v1. Re-encode the selection with H.264 CRF 23 or 20. Do not use stream copy, because keyframe alignment makes cuts inaccurate.
- Command: seek before input, set duration, re-encode video, encode audio, fast-start.
- Minimum selection: 0.1 seconds. Maximum: source duration.
- If start is after end, swap values or show inline validation. Prefer inline validation with a clear message.
- Preserve the source aspect ratio and orientation.
- Progress based on the selection duration.
- Cancel terminates ffmpeg and discards the output.
- Name output `{base}-trimmed.mp4`.
- Show original and output duration plus size.

**Edge cases:**

- Start equals 0 and end equals duration: allowed, but warn that it re-encodes the whole file.
- Selection shorter than one frame: reject.
- No audio track: produce a video-only MP4.
- Preview cannot play: show `Preview is unavailable for this codec, but the trim can still run.` Disable handle dragging if duration is unknown and require manual time input? Prefer using metadata; if duration is unknown, block with a clear message.
- Cancel at 99 percent: no download.

**Acceptance criteria:**

- Trimming 10 seconds from the middle produces a clip within 0.15 seconds of the requested duration.
- Audio stays in sync.
- The output plays upright with correct orientation.
- The selection preview plays only the selected range.
- Invalid ranges are blocked before processing.
- Cancel works and no partial file is offered.

### 11.15 VID-03 Video to GIF

**Route:** `/tools/video-to-gif`  
**Engine:** ffmpeg.wasm with palette generation

**Job:** Turn a short video section into an animated GIF.

**Input:** One video. MP4, MOV, or WebM. Up to 500 MB. Selection maximum 30 seconds. Warn above 10 seconds that the GIF will be large.

**Output:** One GIF.

**Options:**

| Option | Values | Default |
|---|---|---|
| Start | Time | 0 |
| End | Time, max start + 30s | 5 seconds or the video duration, whichever is shorter |
| FPS | 8, 10, 12, 15, 20, 24 | 12 |
| Width | 320, 480, 640, 800, custom 120 to 1200 | 480 |
| Colors | 256, 128, 64 | 256 |
| Dither | None, Bayer, Floyd-Steinberg | Floyd-Steinberg |
| Loop | Infinite, once, count 2 to 10 | Infinite |

**Rules:**

- Preserve aspect ratio. Width is the target width; height is computed and rounded to an even number.
- Use ffmpeg palette generation and palette use in a single filter graph. Two-pass palette is required for quality.
- Suggested filter: `fps=FPS,scale=WIDTH:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=COLORS[p];[s1][p]paletteuse=dither=DITHER`.
- Cap the output at 30 seconds. If the selection exceeds 30 seconds, block and ask the user to shorten it.
- Show a preview player for the selected range and a GIF result preview.
- Show stages: `Preparing`, `Building palette`, `Encoding GIF`. Do not show a fake percentage if ffmpeg cannot provide one.
- Estimate nothing. Report the actual output size.
- Name output `{base}.gif` or `{base}-clip.gif`.
- Show a warning if the output is above 20 MB.
- Cancel terminates ffmpeg and discards the output.

**Edge cases:**

- Selection under 0.2 seconds: reject.
- No video track: reject.
- Width larger than the source: allow but do not upscale beyond the source width. Clamp and note.
- Output larger than the input video: possible; show the truth and allow download.
- Source with variable frame rate: fps filter normalizes it.
- Mobile: warn about slow encoding.

**Acceptance criteria:**

- A 5-second 720p clip produces a GIF with the requested width, frame rate, and loop behavior.
- The GIF plays in Chrome and Safari.
- Colors and dither settings visibly change the result.
- A selection over 30 seconds is blocked.
- Cancel leaves no partial download.
- The GIF duration matches the selection within one frame.

### 11.16 GIF-01 Images to GIF

**Route:** `/tools/images-to-gif`  
**Engine:** gifenc in a worker, Canvas for frame preparation

**Job:** Build an animated GIF from a sequence of images.

**Input:** 2 to 300 images. PNG, JPEG, WebP. Up to 30 MB each, 300 MB total. Images are fitted to a common canvas.

**Output:** One GIF.

**Options:**

| Option | Values | Default |
|---|---|---|
| Frame delay | 20 to 5,000 ms | 200 ms |
| Loop | Infinite, once, count 2 to 20 | Infinite |
| Width | 120 to 1,200 px, or original | 480 |
| Fit | Contain, Cover | Contain |
| Background | Transparent, white, custom | White |
| Colors | 256, 128, 64 | 256 |
| Dither | On, off | On |

**Rules:**

- One global delay in v1. Do not add per-frame timing.
- Height is derived from the first image's aspect ratio. All subsequent images use the same canvas and fit mode. State this.
- Contain: letterbox with the background color. Cover: center-crop.
- Transparent background: GIF supports 1-bit transparency. Use it only when every frame has alpha; warn that edges may be hard.
- Quantize each frame with gifenc, then write the GIF with the global palette strategy. Use a consistent palette across frames to avoid flicker.
- Show a frame strip with thumbnails, order numbers, and move/remove controls.
- Reordering uses drag and drop plus Move left and Move right buttons.
- Show the resulting dimensions, frame count, duration, and actual file size.
- Name output `localkit-animation.gif`.
- Cap total animation duration at 30 seconds (`frames * delay`). If exceeded, block with a clear message.
- Cancel terminates the worker and discards the result.

**Edge cases:**

- Images with different aspect ratios: fit into the first frame's canvas. Do not change canvas size mid-animation.
- One image: block with `Add at least two images.`
- Zero delay: inline validation.
- Mixed transparency: use the background color for frames without alpha.
- Very large output: warn above 20 MB.

**Acceptance criteria:**

- Four images produce a GIF with four frames, the requested delay, and infinite loop.
- Reordering changes the frame order.
- Contain letterboxes without cropping; Cover fills without distortion.
- Transparent background works when all frames have alpha.
- The GIF plays in Chrome and Safari.
- Frame count and duration displayed match the output.

### 11.17 GIF-02 GIF Compressor

**Route:** `/tools/gif-compressor`  
**Engine:** gifuct-js for decode, gifenc for encode, Worker preferred

**Job:** Reduce the size of an animated GIF by resizing, reducing frame rate, and reducing colors.

**Input:** One GIF up to 30 MB and 300 frames.

**Output:** One GIF.

**Options:**

| Option | Values | Default |
|---|---|---|
| Width | 120 to 1,200 px, or original | Original, capped at 800 |
| FPS | Keep, 24, 15, 12, 10, 8 | Keep |
| Colors | 256, 128, 64, 32 | 128 |
| Dither | On, off | On |
| Loop | Keep, infinite, once | Keep |

**Rules:**

- Decode all frames and compose them onto a full canvas, respecting disposal methods and transparency.
- Preserve the original aspect ratio. Width is the target; height is derived.
- When reducing FPS, drop frames and accumulate delays so the total duration stays as close as possible to the original.
- Preserve loop count by default.
- Re-quantize with gifenc. Use a consistent palette where practical to avoid flicker.
- Show before and after size, percentage saved, dimensions, frame count, and duration.
- If the result is larger than the input, show an honest message and offer the original. Do not claim compression.
- Show a warning that GIF re-encoding is lossy and may introduce banding.
- Name output `{base}-compressed.gif`.
- Cancel terminates the worker and discards the result.

**Edge cases:**

- Static GIF: treat as one frame and allow resize/color reduction.
- Interlaced GIF: decode correctly.
- Frames with local palettes and transparency: compose correctly.
- A GIF with 300 frames and 30 MB: process in a worker with progress and a memory guard.
- FPS higher than the source: do not duplicate frames. Clamp to source behavior and note it.

**Acceptance criteria:**

- A 5 MB GIF at width 480, 12 FPS, 128 colors is smaller and still animates.
- Total duration stays within 5 percent of the original when FPS is reduced.
- Loop behavior matches the selected option.
- Transparency is preserved where possible.
- If the output grows, the UI says so and offers the original.
- Cancel leaves no download.

### 11.18 AUD-01 Audio Converter

**Route:** `/tools/audio-converter`  
**Engine:** Web Audio for decode and PCM, lamejs for MP3, custom WAV writer

**Job:** Convert audio files to MP3 or WAV locally.

**Input:** One audio file. MP3, WAV, OGG, M4A/AAC, or FLAC if the browser can decode it. Up to 200 MB and 2 hours. DRM-protected files are not supported.

**Output:** One MP3 or WAV file.

**Options:**

| Option | Values | Default |
|---|---|---|
| Output format | MP3, WAV | MP3 |
| Bitrate | 128, 192, 256, 320 kbps, shown for MP3 | 192 |
| Sample rate | Keep, 44,100, 48,000 Hz | Keep |
| Channels | Keep, Mono, Stereo | Keep |

**Rules:**

- Decode with `AudioContext.decodeAudioData`. If decoding fails, show `This audio format is not supported by your browser.`
- Preserve duration within 0.1 seconds.
- Resample with `OfflineAudioContext` when a sample rate is selected.
- MP3 encoding via lamejs in blocks. Report progress per block. Do not block the main thread.
- WAV output is 16-bit PCM little-endian with a correct RIFF header.
- Do not normalize, compress, or otherwise change the audio unless the user selects a channel or sample-rate conversion. State that the converter does not alter loudness.
- Show input duration, channels, sample rate, output format, and size.
- Name output `{base}.mp3` or `{base}.wav`.
- Cancel aborts encoding and discards the result.

**Edge cases:**

- Mono source with Stereo selected: duplicate the channel.
- Stereo source with Mono selected: average the channels.
- Unsupported codec: specific error with a suggestion to try MP3, WAV, or M4A.
- Very long file: warn above 60 minutes about encoding time.
- Clipping in the source: do not silently normalize; preserve it.
- WAV output larger than input: expected; show the truth.

**Acceptance criteria:**

- A 3-minute WAV to MP3 at 192 kbps plays with the same duration within 0.1 seconds.
- MP3 to WAV produces a valid WAV with the correct header.
- Mono and stereo options work.
- Sample rate conversion changes the output metadata.
- Progress and cancel work.
- No network request contains audio data.

### 11.19 AUD-02 Audio Trimmer

**Route:** `/tools/audio-trimmer`  
**Engine:** Web Audio for decode, waveform peaks, and export; lamejs for MP3

**Job:** Cut a section from an audio file with a visual waveform.

**Input:** One audio file. Same formats and limits as Audio Converter.

**Output:** One MP3 or WAV file.

**Options:**

| Option | Values | Default |
|---|---|---|
| Start | Time, 0 to duration | 0 |
| End | Time, greater than start | Duration |
| Fade in | 0 to 5 seconds | 0 |
| Fade out | 0 to 5 seconds | 0 |
| Output format | MP3, WAV | MP3 |
| Bitrate | 128, 192, 256, 320 kbps | 192 |

**Rules:**

- Draw a waveform from decoded peak data on a canvas. Show time labels and selection shading.
- Provide draggable start and end handles plus time inputs and `Set start to playhead` / `Set end to playhead` buttons.
- Provide a preview play button that plays only the selection.
- Slice the AudioBuffer at sample-accurate offsets.
- Apply fade in and fade out with linear gain ramps over the selected duration. Fades cannot overlap beyond the selection length; clamp and warn.
- Encode the result as MP3 or WAV using the shared audio encoder.
- Show original duration, selection duration, output size, and format.
- Name output `{base}-trimmed.mp3` or `.wav`.
- Cancel stops preview and encoding, and discards the result.

**Edge cases:**

- Selection under 0.1 seconds: reject.
- Fade length longer than half the selection: clamp to half and note it.
- No selection change: allow, but warn that the whole file is re-encoded.
- Unsupported codec: specific error.
- Very long waveform: downsample peaks for drawing; do not render every sample.

**Acceptance criteria:**

- Trimming a 60-second file to 10 to 20 seconds produces a 10-second output within 0.1 seconds.
- The waveform selection matches the exported audio.
- Fade in and fade out are audible and do not cause clicks at the boundaries.
- Preview plays only the selected range.
- MP3 and WAV outputs are valid.
- Keyboard-only handle adjustment works through the time inputs.

---

## 12. Content, copy, and SEO

### 12.1 Copy rules

- Sentence case for headings, buttons, labels, and menu items. The wordmark and the hero H1 are the only exceptions if the approved copy uses a period.
- Use plain English. Avoid jargon when a simpler word exists.
- Keep tool descriptions to one sentence and under 100 characters on cards.
- Use exact numbers with units. `200 KB`, not `a small size`.
- Never promise more than the tool can do.
- No exclamation marks, emoji, or exclamation-style error copy.
- No fake urgency, scarcity, or social proof.
- Banned marketing words are listed in section 4.9.
- All copy in this document is final unless the owner approves a change. Agents may fix grammar but must not replace the positioning or tone.

### 12.2 Error copy rules

- Say what happened, why if known, and what to do next.
- Reference the actual file, limit, or setting when possible.
- One sentence for the title, one or two for the fix.
- Never blame the user.
- Never expose a raw stack trace in the UI.
- Examples are provided in section 10.7 and in individual tools.

### 12.3 Metadata

Per page:

- Title max 60 characters. Homepage: `LocalKit - Private file tools that run in your browser`.
- Description 150 to 160 characters, specific to the tool.
- Canonical URL from `NEXT_PUBLIC_SITE_URL`. Do not hardcode a domain that the owner does not own. If the env var is missing in production, fail the build.
- Open Graph and Twitter metadata. Use one static 1200 by 630 OG image for v1.0, committed as a PNG. It uses the brand type and a short statement, not generated art.
- `twitter:card` is `summary_large_image`.
- Theme color per theme.
- No fake ratings or review markup.

Structured data:

- Homepage: `WebApplication` with name, description, applicationCategory `UtilitiesApplication`, operatingSystem `Any`, and `offers` price 0. Do not include aggregateRating.
- FAQ: `FAQPage` matching the visible FAQ exactly.
- Tool pages: `BreadcrumbList` and `WebApplication` for the tool. No ratings.
- Validate with the Rich Results Test.

Sitemap and robots:

- Sitemap includes `/`, `/tools`, `/privacy`, `/licenses`, and all 19 tool routes. No P1 routes.
- Robots allows all and points to the sitemap.
- Use the production origin from the environment.

### 12.4 Privacy page

Plain language, no legal template padding. Must state:

- Files are processed in the browser and are not uploaded.
- No accounts, cookies, analytics, ads, or fingerprinting.
- The only localStorage entries and their purpose (theme, recent tools, cached profile).
- How to clear them.
- The single external request to `dhirajarya.in/llms.txt` and that it contains no file data.
- Hosting provider logs may record standard page requests, not file contents.
- Output files are generated locally and saved only when the user downloads them.
- Contact link from the profile data.
- Last updated date.

### 12.5 Licenses page

- List every runtime dependency with its license and project link.
- Include FFmpeg and its build license, pdf.js, pdf-lib, gifenc, gifuct-js, lamejs, fflate, Fuse.js, Next.js, React, Tailwind, HeroUI, and Pikaicons.
- Include the source link for the FFmpeg build used in the wasm binary, as required by its license.
- Include a short note that outputs belong to the user and that third-party licenses apply to the libraries, not to the user's files.
- No fake legal entity. Use the owner's name and site.

---

## 13. Testing and quality

### 13.1 Unit tests

Use Vitest for pure logic:

- Page range parser: valid ranges, whitespace, duplicates, reverse ranges, out-of-bounds, page zero.
- Target-size search: reaches target, stops at minimum, reports closest result, never loops forever.
- File name sanitizer: path separators, control characters, reserved names, Unicode, empty result.
- Format bytes: KB, MB, GB, decimal units, tabular output.
- ICO encoder: header, entry count, offsets, PNG payload signatures.
- Search ranking: name beats alias, alias beats description, `png jpg` finds Image Converter, no unbuilt tools.
- llms.txt parser: normal input, missing fields, malicious HTML, non-https links, timeout fallback.
- ZIP path sanitizer (P1, but the helper may be written now only if used).
- Metadata cleanup for PDFs: author removed, producer set.

### 13.2 End-to-end tests

Use Playwright. Cover at minimum:

- Landing loads, correct H1, six featured tools, FAQ present, footer fallback visible.
- Demo compresses the sample and reports a real size. No hardcoded numbers.
- `Cmd/Ctrl+K` opens the palette; typing `compress` lists Image Compressor and Compress PDF; ArrowDown and Enter navigate; Escape closes; focus returns.
- `/` opens the palette on the landing page and types normally inside the palette input.
- Recents appear after opening a tool and persist after reload.
- One tool per category: upload a fixture, run defaults, assert a download with the correct name, MIME, and non-zero size.
- PDF merge: assert the output page count with pdf-lib.
- PDF split: assert part count and page counts.
- Image compressor: assert dimensions and that the target is within tolerance.
- Favicon Studio: assert the zip contains nine files and the ICO signature.
- Video trimmer: assert duration within tolerance if a headless browser can run ffmpeg; otherwise mark as manual and assert the job completes.
- Cancel: start a multi-page PDF job, cancel, assert no download and ready state.
- Unsupported file: upload a text file, assert the specific error.
- Mobile viewport 390 by 844: palette full screen, tool usable, no horizontal scroll.
- Theme toggle persists and no hydration warnings appear.
- 404 page search works.
- Network guard: intercept requests during processing and assert no request body contains file bytes and no request goes to a non-allowed origin except `dhirajarya.in/llms.txt`.

### 13.3 Manual test matrix

| Browser | Images | PDF | Video | GIF | Audio |
|---|---|---|---|---|---|
| Chrome desktop | Required | Required | Required | Required | Required |
| Firefox desktop | Required | Required | Best effort | Required | Required |
| Safari macOS | Required | Required | Best effort | Required | Required |
| Chrome Android | Required | Required | Not recommended | Best effort | Required |
| Safari iOS | Required | Required | Not recommended | Best effort | Required |

Also verify:

- Light and dark themes on every template.
- 200 percent zoom and 320 px reflow.
- Keyboard-only completion of one tool per category.
- Screen reader pass on the palette, file dropzone, options, progress, and result.
- Outputs open in native apps: PDFs in Chrome and Acrobat, images in Preview, MP4 in QuickTime and VLC, MP3 in a browser, GIF in a browser.

### 13.4 Performance checks

- Lighthouse mobile on the landing page: performance 90 or higher, accessibility 100, best practices 100, SEO 100.
- Bundle analyzer confirms no ffmpeg or pdf.js in the landing initial chunks.
- Network panel confirms the video engine is not requested until the user starts a video job.
- LCP under 2.0 seconds on a mid-tier mobile profile.
- CLS under 0.05.
- No main-thread task longer than 50 ms during image batches, PDF page transitions, or audio encoding.
- Object URLs are revoked; repeated runs do not grow memory unbounded.

### 13.5 Security checks

- ZIP slip test with `../`, absolute paths, and backslashes (P1, but the sanitizer is mandatory when ZIP is added).
- File name with path separators and control characters does not affect downloads.
- Oversized image dimensions are rejected before decoding.
- PDF with embedded JavaScript is rendered with `isEvalSupported: false`; no script executes.
- No `dangerouslySetInnerHTML` with user data.
- CSP blocks external scripts; only allowed origins load.
- No file data in URLs, localStorage, sessionStorage, or console logs.
- Dependency audit has no known critical vulnerabilities.

### 13.6 Definition of done for a tool

A P0 tool is done only when all of the following are true:

- The real processing engine works with supported fixtures.
- All options in its specification exist and affect output.
- Empty, loading, processing, success, partial-error, and fatal-error states are implemented.
- Cancel works and leaves no partial download.
- Outputs are valid and open in standard apps.
- File names are sanitized and correct.
- Metadata rules are applied.
- Keyboard-only use works.
- Mobile layout at 360 px works.
- Both themes are complete.
- Acceptance criteria in its specification pass.
- Unit and end-to-end coverage exist where practical.
- It appears in the registry, tools directory, search, related tools, and sitemap.
- No network request carries file data.

---

## 14. Build milestones

Build in this order. Do not start a later milestone while an earlier one is incomplete, except for design exploration that does not ship.

### M0: Foundation

- Scaffold Next.js 16 with TypeScript strict and static export.
- Tailwind 4 tokens and global CSS.
- HeroUI theme mapping and Pikaicons setup.
- Fonts, layout, header, footer shell, 404.
- Tool registry with metadata only.
- Command palette shell and keyboard behavior.
- Landing skeleton with final type, colors, and spacing.
- CI: typecheck, lint, build.

Gate: static build succeeds, tokens match this document, palette opens and closes, no console errors.

### M1: Images

- Shared image engine, worker, validation, download helpers.
- Image Converter, Image Compressor, Image Resizer, Favicon Studio.
- Landing live demo using the real compressor engine.
- Image fixtures and unit tests.

Gate: four tools pass acceptance, demo reports real numbers, landing performance budget met.

### M2: PDF

- Shared PDF engine, page range parser, pdf.js worker configuration.
- Merge, Split, Compress, PDF to Images, Organize, Watermark, Page Numbers, Images to PDF.
- PDF fixtures and tests, including encrypted and corrupt cases.

Gate: eight tools pass acceptance, output page counts and dimensions verified, no text loss in non-raster tools.

### M3: Video, GIF, audio

- ffmpeg loader, single-thread core, progress parsing, cancel.
- Video Compressor, Video Trimmer, Video to GIF.
- Images to GIF, GIF Compressor.
- Audio Converter, Audio Trimmer.
- Lazy loading and memory guards.

Gate: seven tools pass acceptance, engine loads only on demand, cancel and memory cleanup verified.

### M4: Launch polish

- Tools directory filters and URL state.
- Search ranking and recents.
- Footer profile fetch and fallback.
- Privacy and licenses pages.
- SEO metadata, sitemap, robots, OG image, JSON-LD.
- Accessibility pass, responsive pass, both themes.
- Full test suite, Lighthouse, bundle analysis.
- README with setup, architecture, limits, and browser caveats.
- Deploy to Vercel as a static export.

Gate: all P0 acceptance criteria pass, no P1/P2 features, definition of done met.

---

## 15. Launch checklist

- [ ] All 19 P0 tools are live and pass acceptance.
- [ ] No P1, P2, or Never-list feature is present.
- [ ] Landing copy matches section 7.
- [ ] Exactly six featured tools and 19 total tools.
- [ ] Command palette works on every page with keyboard and mobile.
- [ ] Recents work and can be cleared.
- [ ] Tools directory filters and URL state work.
- [ ] Footer fetch works and falls back gracefully.
- [ ] Privacy and licenses pages are complete.
- [ ] No `href="#"`, placeholder copy, or dead controls.
- [ ] No uploads, analytics, cookies, or external runtime scripts.
- [ ] Network guard test passes.
- [ ] Light and dark themes complete.
- [ ] 360 px, 768 px, 1024 px, 1440 px verified.
- [ ] Keyboard-only pass complete.
- [ ] Axe reports zero critical issues.
- [ ] Lighthouse targets met.
- [ ] All outputs validated in native apps.
- [ ] Sitemap contains only live routes.
- [ ] OG image and metadata verified.
- [ ] `NEXT_PUBLIC_SITE_URL` set for production.
- [ ] README and `DECISIONS.md` updated.
- [ ] Static export builds cleanly with no server dependencies.

---

## 16. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ffmpeg.wasm is slow or runs out of memory | Video tools fail or frustrate users | Single-thread core, 500 MB and 20 minute limits, desktop recommendation, cancel, honest progress, shorter sample |
| Safari codec and memory differences | Video and large PDF failures | Feature detection, clear errors, test matrix, recommend Chrome for video |
| pdf.js worker bundling with Next static export | PDF tools fail to load | Use a same-origin worker URL from `public`, verify in production build early in M2 |
| Rasterizing text PDFs increases size | Compress PDF appears broken | Honest comparison, original download option, explain scanned versus text PDFs |
| HeroUI 3 or Pikaicons compatibility | Design system delays | Verify in M0, pin versions, document the smallest workaround, do not swap stacks |
| Large image canvas limits | Crashes on huge files | Reject above 16,384 px or 100 MP, catch decoding errors, memory message |
| CORS blocks the footer fetch | Profile missing | Committed fallback renders first, fetch failure is silent |
| Scope creep from P1 tools | Launch slips | Scope contract, registry status, launch checklist |
| An agent invents UI or copy | AI-slop result | Exact copy, design bans, acceptance criteria, visual review |
| Overclaiming privacy | Loss of trust | No upload path, network tests, plain privacy page, no analytics |
| Third-party license obligations | Legal risk | Licenses page, FFmpeg source link, dependency audit |

---

## 17. Owner decisions and defaults

The following are non-blocking. Proceed with the defaults unless the owner changes them before launch.

| Decision | Default | Notes |
|---|---|---|
| Product name | LocalKit | Working title; replace consistently if changed |
| Domain | `NEXT_PUBLIC_SITE_URL` | Must be a real owned domain in production |
| Launch scope | P0 only | P1 is release 1.1 |
| Accent | Vermilion `#C93A12` light, `#FF7A4D` dark | Adjust only for contrast, not for trend |
| Theme | Light default, system preference | Dark fully supported |
| Video engine | ffmpeg.wasm single-thread | Multi-thread is P2 |
| Analytics | None | Never add without a separate privacy decision |
| Offline support | Not in v1.0 | Do not claim it |
| Language | English only | No i18n framework |
| Footer profile | Fetch with fallback | Owner may configure CORS |
| P1 timing | After v1.0 launch | Do not pre-build |

If the owner changes the name, update the wordmark, metadata, fallback profile, README, privacy page, licenses page, and this document. Do not leave mixed names.

---

## 18. Future releases

This section is informational. Do not implement it under this PRD.

- **1.1:** P1 tools listed in section 3.3, plus the Files category. Add only after v1.0 is stable.
- **1.2:** Accessibility and performance refinements based on real use. Consider a PWA with offline caching of visited tools.
- **2.0:** Only if real users ask: HEIC/SVG conversion, OCR, background removal, audio transcription. Each requires a separate PRD with bundle-size and privacy analysis.
- **Not planned:** accounts, cloud storage, sharing, AI chat, paid tiers, native apps.

Any future feature must preserve the client-side-only architecture and the no-account, no-tracking promise. If it cannot, reject it.

---

## Appendix A: Original brief

The original note content is preserved below for reference. It is superseded by this PRD where the two differ.

```
A utilits file all in one site all work done and it's run on client side not server side so data upload and miss use not fair.

## Techstack
- next.js
- tailwind css
- heroUI
- pikaiicons
- all client side porcessing [pdf lib, etc]

## what have must
- first have modren clean polised saas landing page without ai slop, common styling, themeing
- faq
- tools list
- fast seachable bar with keyboard navigation support
- some tools preview how it work default some example like compress, etc
- minimlist footer my info fetch form dhirajarya.in/llms.txt

## what tools have
- png to jpg and apposite
- jpg to webp and apposite
- png to favicon and apposite
- image compress with target size, width-height
- pdf all utiles
```

## Appendix B: Quick reference for agents

**Build:** 19 P0 tools, landing, tools directory, search, tool template, privacy, licenses, 404.

**Never build:** uploads, accounts, cloud, share links, AI, analytics, ads, fake proof, P1/P2 tools, PDF-to-Office, native apps.

**Stack:** Next.js 16 static export, React 19, TypeScript strict, Tailwind 4, HeroUI 3, Pikaicons, client-side libraries only.

**Privacy test:** process a file with DevTools open. No request may contain file bytes. Only allowed external request: footer profile fetch.

**Design test:** warm paper, near-black ink, one vermilion accent, Bricolage Grotesque display, Geist body, thin rules, no gradients, no glass, no fake UI.

**Copy test:** direct, specific, no hype, no emoji, no exclamation marks, no banned words.

**Done test:** all acceptance criteria pass, every visible control works, no placeholders, outputs open in native apps, works keyboard-only at 360 px in both themes.

