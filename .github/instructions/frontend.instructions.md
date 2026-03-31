---
description: Frontend web development patterns for Astro, Tailwind CSS v4, and general web standards
applyTo: "**/*.astro,**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.css,**/*.html,**/astro.config.*,**/tailwind.config.*"
---

# Frontend Web Development Standards

When working on web projects (jasongreen.biz, Timeliner), follow these patterns in addition to
the universal coding style.

---

## Astro Framework

### Project Structure

```
src/
├── components/          # Reusable Astro/framework components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── ProjectCard.astro
│   └── ui/              # Small UI primitives (buttons, badges)
├── layouts/             # Page layouts (BaseLayout, BlogLayout)
│   └── BaseLayout.astro
├── pages/               # File-based routing
│   ├── index.astro
│   ├── about.astro
│   ├── projects/
│   │   ├── index.astro
│   │   └── [slug].astro
│   └── 404.astro
├── content/             # Content collections (Astro Content Collections)
│   └── projects/
├── styles/              # Global styles
│   └── global.css
├── utils/               # Helper functions
└── types/               # TypeScript type definitions
public/
├── images/
├── fonts/
└── favicon.svg
```

**Rules:**
- **Pages are thin** — they compose layouts and components, minimal logic
- **Layouts handle structure** — `<html>`, `<head>`, `<body>`, shared nav/footer
- **Components handle features** — reusable, self-contained
- **Content collections** for structured content (projects, blog posts) — type-safe frontmatter

### Astro Component Patterns

```astro
---
// Component script (runs at build time)
interface Props {
  title: string;
  description: string;
  image?: string;
  url: string;
}

const { title, description, image, url } = Astro.props;
---

<!-- Component template -->
<article class="project-card">
  {image && <img src={image} alt={`Screenshot of ${title}`} />}
  <h3>{title}</h3>
  <p>{description}</p>
  <a href={url}>View Project</a>
</article>
```

- **Type your props** with `interface Props` — Astro infers them automatically
- **Destructure in the frontmatter** — keeps the template clean
- **Use Astro components by default** — only reach for React/Vue/Svelte when you need client-side interactivity
- **`client:` directives** — `client:load` for immediate, `client:visible` for lazy, `client:idle` for non-critical

### Static vs Dynamic

```astro
---
// ✅ Fetch data at build time — generates static HTML
const projects = await getCollection('projects');
---

<!-- ✅ This becomes pure HTML — no JavaScript shipped -->
{projects.map((project) => (
  <ProjectCard {...project.data} />
))}
```

- **Default to static** — Astro's strength is zero-JS output
- **Add interactivity surgically** — only the components that need it get `client:` directives
- **Prefer Astro components** for anything that doesn't need state or event handlers

---

## Tailwind CSS v4

### Usage Patterns

```astro
<!-- ✅ Utility-first, readable grouping -->
<div class="flex flex-col gap-4 p-6 rounded-lg bg-white shadow-md">
  <h2 class="text-xl font-bold text-gray-900">Project Title</h2>
  <p class="text-gray-600 leading-relaxed">Description here.</p>
</div>

<!-- ✅ For repeated patterns, extract to components — not @apply -->
<!-- Instead of @apply in CSS, make an Astro component -->
```

**Rules:**
- **Utility classes in templates** — that's how Tailwind is designed to work
- **Extract components, not CSS classes** — if you're repeating a set of utilities, make a component
- **`@apply` sparingly** — only for base element styles (e.g., `h1`, `a` defaults in `global.css`)
- **Use CSS variables for theming** — Tailwind v4 supports CSS-first configuration
- **Responsive: mobile-first** — base styles are mobile, `sm:`, `md:`, `lg:` add desktop
- **Dark mode** — use `dark:` variant if supporting it; decide early

### Tailwind v4 Specifics

```css
/* global.css — Tailwind v4 uses CSS-based config */
@import "tailwindcss";

@theme {
  --color-primary: #your-brand-color;
  --color-accent: #your-accent-color;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

---

## TypeScript in Astro

### Type Patterns

```typescript
// types/project.ts
export interface Project {
  title: string;
  description: string;
  techStack: string[];
  url: string;
  repo?: string;
  image?: string;
  status: "active" | "completed" | "planned";
}
```

- **Strict mode** — `"strict": true` in tsconfig
- **No `any`** — use `unknown` + type guards if type is truly dynamic
- **Type API responses at the boundary** — validate data from external sources

---

## Accessibility

**Not optional.** Build it in from the start.

### Minimum Requirements

- **Semantic HTML** — `<nav>`, `<main>`, `<article>`, `<button>`, not `<div>` for everything
- **Alt text** on all images — descriptive for content images, `alt=""` for decorative
- **Keyboard navigation** — all interactive elements reachable via Tab
- **Focus indicators** — visible focus styles (don't remove outlines without replacement)
- **Skip links** — "Skip to main content" link for keyboard users
- **Heading hierarchy** — one `<h1>` per page, no skipping levels

### Common Mistakes

| ❌ Avoid | ✅ Prefer |
|----------|-----------|
| `<div onclick>` | `<button>` or `<a href>` |
| Missing `alt` on `<img>` | Descriptive `alt` text |
| Color-only indicators | Color + icon + text |
| Removing `:focus` outlines | Custom visible focus styles |
| Auto-playing media | User-initiated playback |

---

## Performance

### Astro Advantages (Keep Them)

- **Zero JS by default** — Astro ships no client JavaScript unless you add `client:` directives
- **Don't break this** — every `client:load` adds to the bundle. Be intentional.

### Image Optimization

```astro
---
import { Image } from 'astro:assets';
import projectScreenshot from '../assets/project.png';
---

<!-- ✅ Astro optimizes this automatically -->
<Image src={projectScreenshot} alt="Spread The Funds app screenshot" />
```

- Use Astro's `<Image>` component for automatic optimization
- Provide `width` and `height` (or aspect ratio) to prevent layout shift
- Use modern formats (WebP/AVIF) — Astro handles conversion

### Core Web Vitals (Portfolio Site Matters)

| Metric | Target | Why |
|--------|--------|-----|
| LCP | < 2.5s | Employers will notice a slow site |
| INP | < 200ms | Interactions should feel instant |
| CLS | < 0.1 | No jumping layout |

---

## Styling Best Practices

- **Design tokens** — centralize colors, fonts, spacing in Tailwind theme config
- **Responsive by default** — mobile-first approach
- **Consistent spacing** — use Tailwind's spacing scale, don't invent custom values
- **Accessible colors** — meet WCAG AA contrast ratios (4.5:1 for text)

---

## Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": {
        "parser": "astro"
      }
    }
  ]
}
```

- **Run Prettier before every commit** — `npx prettier --check .`
- **Format on save in VS Code** — configure in workspace settings
- **Don't fight the formatter** — configure it once, then trust it

---

## Deployment (Vercel)

- **Builds trigger on push to main** — keep `main` deployable
- **Preview deployments** — Vercel creates previews for branches/PRs (free tier)
- **Environment variables** — use Vercel dashboard for secrets, never commit them
- **Check build output** — `npm run build` locally before pushing

---

## SEO (Portfolio Site)

Since jasongreen.biz is a portfolio site meant to help land a job:

```astro
---
// In BaseLayout.astro
interface Props {
  title: string;
  description: string;
  image?: string;
}

const { title, description, image } = Astro.props;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
---

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} | Jason Green</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {image && <meta property="og:image" content={image} />}
  <meta property="og:type" content="website" />
</head>
```

- Every page needs a unique `<title>` and `<meta name="description">`
- Open Graph tags for social sharing
- Semantic HTML helps search engines understand your content

---

## Common Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|-----------|
| `client:load` on everything | Static Astro components by default |
| `@apply` for component styles | Extract to Astro components |
| Inline styles for static values | Tailwind utility classes |
| Missing alt text | Descriptive alt on every image |
| `any` in TypeScript | Proper types, `unknown` as last resort |
| Giant page files | Extract to layouts + components |
| Hardcoded content in templates | Content collections for structured data |
| Ignoring Prettier output | Run `prettier --check .` before commits |
