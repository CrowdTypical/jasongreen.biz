# Spread the Fund — Branding Guide

## App Identity

| Property | Value |
|---|---|
| **App Name** | Spread the Fund |
| **Display Name (stylised)** | `SPREAD THE FUND` (uppercase, wide letter-spacing) |
| **Tagline** | SPLIT BILLS IN REAL-TIME |
| **One-liner** | A bill-splitting app with real-time updates between users. |
| **Version** | v1.0.3 |
| **Platform** | Android (Google Play Store) |
| **Developer** | Jason Green / CrowdTypical |
| **Contact Email** | spreadthefund@gmail.com |
| **GitHub** | github.com/CrowdTypical/spreadthefund |
| **Donate** | buymeacoffee.com/crowdtypical |
| **License** | PolyForm Shield License 1.0.0 |
| **Copyright** | Copyright (C) 2026 Jason Green |

---

## Design Philosophy

The app follows a **"Terminal / Brutalist"** dark-mode-only aesthetic:

- **Monospace font** throughout (system monospace)
- **ALL CAPS text** with wide letter-spacing for headings and labels
- **Zero border radius** — all corners are sharp (no rounded corners)
- **Flat design** — zero elevation, no drop shadows
- **Borders instead of shadows** — thin 1px borders define surfaces
- **Material 3** design system (dark theme)

The overall feel is minimal, technical, and modern — like a developer tool or terminal interface with a premium dark palette.

---

## Colour Palette

### Primary Colours

| Swatch | Hex | RGB | Role |
|---|---|---|---|
| 🟦 | `#00E5CC` | rgb(0, 229, 204) | **Primary / Accent (Teal-Cyan)** — buttons, icons, active states, positive amounts ("you're owed"), FABs, links |
| ⬛ | `#0A0E14` | rgb(10, 14, 20) | **Background** — main scaffold background used everywhere |
| 🔲 | `#141A22` | rgb(20, 26, 34) | **Surface / Card** — cards, dialogs, drawers, input fields, snackbars |
| ⬛ | `#0F1419` | rgb(15, 20, 25) | **AppBar** — top bar background |
| ⬛ | `#0D1117` | rgb(13, 17, 23) | **Deep Surface** — expanded sections, code-like areas, metadata backgrounds |

### Border & Divider

| Swatch | Hex | RGB | Role |
|---|---|---|---|
| 🔳 | `#1E2A35` | rgb(30, 42, 53) | **Border / Divider** — card borders, input borders, separators |

### Text Colours

| Swatch | Hex | RGB | Role |
|---|---|---|---|
| ⬜ | `#E0E0E0` | rgb(224, 224, 224) | **Primary text** — headings, body text |
| 🔘 | `#8899AA` | rgb(136, 153, 170) | **Secondary text** — labels, subtitles, muted info |
| 🔘 | `#556677` | rgb(85, 102, 119) | **Dim text** — metadata, dates, hints |
| 🔘 | `#455566` | rgb(69, 85, 102) | **Dimmest text** — placeholder/hint text in inputs |

### Semantic Colours

| Swatch | Hex | RGB | Role |
|---|---|---|---|
| 🟥 | `#FF4C5E` | rgb(255, 76, 94) | **Negative / Error** — "you owe" amounts, error states, destructive actions |
| 🟩 | `#4CAF50` | rgb(76, 175, 80) | **Settlement / Success** — settled amounts, "all settled" indicator |
| 🟧 | `#FFA726` | rgb(255, 167, 38) | **Amber / Donate** — "Buy me a coffee" CTA |
| 🟥 | `#EF5350` | rgb(239, 83, 80) | **Delete / Danger** — destructive button colour |

### Brand Gradient

The app title uses a **linear gradient** from teal to blue:

```
#00E5CC → #42A5F5
```

This gradient is used on the "SPREAD THE FUND" logo text in the about dialog.

### Group Accent Colour Palette (12 colours)

Users can assign these colours to their groups:

| Name | Hex |
|---|---|
| Teal (default) | `#00E5CC` |
| Pink | `#FF6B9D` |
| Purple | `#7B68EE` |
| Amber | `#FFA726` |
| Blue | `#42A5F5` |
| Red | `#EF5350` |
| Green | `#66BB6A` |
| Yellow | `#FFEE58` |
| Violet | `#AB47BC` |
| Deep Orange | `#FF7043` |
| Cyan | `#26C6DA` |
| Rose | `#EC407A` |

---

## Typography

| Property | Value |
|---|---|
| **Font Family** | System monospace (`'monospace'`) |
| **Heading Style** | ALL CAPS, bold, letter-spacing 2–4px |
| **Body Style** | Normal weight, monospace |
| **Label Style** | ALL CAPS, bold, letter-spacing 1–3px, secondary colour |

### Key Text Sizes

| Element | Size | Weight | Spacing |
|---|---|---|---|
| App name / hero title | 28px | Bold | 4px |
| Section title (e.g. "WELCOME") | 24px | Bold | 4px |
| Screen titles | 18–20px | Bold | 1.2–2px |
| Amounts (large display) | 28px | Bold | — |
| Body / list items | 13–14px | Normal–Bold | 0–1px |
| Section headers (e.g. "GROUPS") | 11–13px | Bold | 2–3px |
| Meta / dates | 10–11px | Normal | — |

---

## Image Assets

All image assets are included in this folder under `images/`. Here's what each file is:

| File | Description |
|---|---|
| `images/app_icon.png` | Opaque app icon (solid background) |
| `images/app_icon_transparent.png` | Transparent app icon — used in AppBar, loading screens, about dialog |
| `images/spreadthefund.svg` | **SVG vector logo** — ideal for scalable use |
| `images/spreadthefunds.png` | Adaptive icon foreground |
| `images/final_icon_preview.png` | Launcher icon source file |
| `images/Icon-192.png` | Web icon 192×192 |
| `images/Icon-512.png` | Web icon 512×512 |
| `images/Icon-maskable-192.png` | Maskable web icon 192×192 |
| `images/Icon-maskable-512.png` | Maskable web icon 512×512 |
| `images/favicon.png` | Web favicon |

### Recommended usage:
- **`spreadthefund.svg`** as the primary logo (scalable vector)
- **`app_icon_transparent.png`** for hero sections or app previews
- **`Icon-512.png`** for high-res app icon display

---

## Screenshots

**No screenshots currently exist.** Recommended screenshots to capture:

1. **Login Screen** — "SPREAD THE FUND" branding with Google Sign-In button and receipt icon
2. **Home Screen** — Main dashboard with groups, balance summary, and recent activity
3. **Add Bill Screen** — Bill creation form with category grid, amount input, and split slider
4. **Bill Detail Screen** — Individual bill view with who paid, split breakdown, and notes
5. **Group Details Screen** — Group view with member list, bills, and settlement section
6. **Onboarding/Partner Setup** — "WELCOME" screen and partner email entry

### Recommended Screenshot Dimensions
- Phone mockup: 1080×1920 or 1284×2778 (standard Android/iOS marketing sizes)
- Use a dark background to match the app's dark theme

---

## Key Features

1. **Real-Time Bill Splitting** — Bills sync instantly between all group members via Firebase
2. **Google Sign-In** — Quick, secure authentication with your Google account
3. **Multiple Groups** — Create separate groups with different people (housemates, trips, couples)
4. **Custom Group Colours** — 12 accent colours to personalise each group
5. **Smart Split Slider** — Adjust the split percentage with an intuitive slider
6. **Category Icons** — Categorise bills (food, transport, groceries, entertainment, etc.)
7. **Settlement Tracking** — Record payments and track who owes whom
8. **Bill Notes** — Add notes to any bill for context
9. **Email Invitations** — Invite group members by email directly from the app
10. **Data Deletion** — Full control — delete all your data at any time from the app
11. **Privacy First** — No analytics, no ads, no tracking

---

## Brand Voice & Tone

- **Minimal and direct** — short, punchy, uppercase labels
- **Technical but approachable** — monospace aesthetic signals precision without being intimidating
- **Dark and clean** — premium feel, no clutter
- **Transparent** — privacy-first messaging, open-source ethos

---

## CSS Variables (ready to use)

```css
:root {
  /* Primary */
  --color-primary: #00E5CC;
  --color-primary-rgb: 0, 229, 204;

  /* Backgrounds */
  --color-bg: #0A0E14;
  --color-surface: #141A22;
  --color-surface-alt: #0F1419;
  --color-surface-deep: #0D1117;

  /* Borders */
  --color-border: #1E2A35;

  /* Text */
  --color-text-primary: #E0E0E0;
  --color-text-secondary: #8899AA;
  --color-text-dim: #556677;
  --color-text-hint: #455566;

  /* Semantic */
  --color-negative: #FF4C5E;
  --color-success: #4CAF50;
  --color-amber: #FFA726;
  --color-danger: #EF5350;

  /* Gradient */
  --gradient-brand: linear-gradient(90deg, #00E5CC, #42A5F5);

  /* Typography */
  --font-family: 'Courier New', 'Fira Code', 'JetBrains Mono', monospace;
  --letter-spacing-wide: 4px;
  --letter-spacing-normal: 2px;
  --letter-spacing-tight: 1px;
}
```

---

## Contact & Links

| Resource | URL |
|---|---|
| **GitHub Repo** | https://github.com/CrowdTypical/spreadthefund |
| **Releases** | https://github.com/CrowdTypical/spreadthefund/releases |
| **Donate** | https://buymeacoffee.com/crowdtypical |
| **Support Email** | spreadthefund@gmail.com |
| **Privacy Policy** | (link to PRIVACY_POLICY.md or hosted page) |
