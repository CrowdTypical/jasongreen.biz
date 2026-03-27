# jasongreen.biz

Personal brand website for Jason Green. Built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/), deployed on [Vercel](https://vercel.com/).

## Tech Stack

- **Framework:** Astro (static-first, islands architecture)
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite (built into Astro)
- **Formatter:** Prettier + prettier-plugin-astro
- **Hosting:** Vercel
- **Domain:** jasongreen.biz

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
├── public/          # Static assets (favicon, images)
├── src/
│   ├── pages/       # File-based routing (.astro files)
│   └── styles/      # Global CSS (Tailwind entry point)
├── astro.config.mjs # Astro + Tailwind + Vercel config
├── tsconfig.json    # TypeScript config
└── package.json
```

## Deployment

### Auto-Deploy Pipeline

The site auto-deploys via Vercel's GitHub integration:

1. **Push to `main`** → triggers a production build and deploy to jasongreen.biz
2. **Push to any branch / open a PR** → triggers a preview deployment with a unique URL

No CI/CD config files are needed — Vercel detects Astro automatically and runs `npm run build`.

### Branching Strategy

- `main` — production branch, auto-deploys to jasongreen.biz
- Feature branches — create a branch per issue, open a PR, get a preview deploy

### Domain Configuration

1. In the **Vercel dashboard** → Project Settings → Domains:
   - Add `jasongreen.biz` and `www.jasongreen.biz`
2. At your **domain registrar**, set DNS records:
   - `A` record: `jasongreen.biz` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`
3. Vercel automatically provisions and renews **SSL/HTTPS** certificates
4. `www.jasongreen.biz` redirects to `jasongreen.biz` (configured in Vercel dashboard)

### Environment Variables

If needed, set environment variables in the Vercel dashboard under Project Settings → Environment Variables. Access them in Astro via `import.meta.env.VARIABLE_NAME`.

## Formatting

```bash
# Format all files
npx prettier --write .

# Check formatting
npx prettier --check .
```
