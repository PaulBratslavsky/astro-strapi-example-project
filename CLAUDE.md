# Project Guidelines

## Stack

- **Frontend:** Astro 6 with Tailwind CSS v4
- **Backend:** Strapi 5 (latest) with SQLite
- **Content loader:** `strapi-community-astro-loader` v4 via Astro's Content Layer API
- **Package manager:** yarn

## UI and Design Preferences

### Design Tokens

This project uses a custom Tailwind v4 theme defined in `client/src/styles/global.css`. Always use semantic tokens — never raw Tailwind colors.

| Token | Purpose |
|---|---|
| `text-secondary` | Headings, primary text |
| `text-muted` | Body text, descriptions |
| `text-faint` | Metadata, captions |
| `text-primary-600` | Accent text, links, labels |
| `bg-surface` | Page background |
| `bg-surface-alt` | Alternate section backgrounds |
| `bg-surface-raised` | Cards, elevated elements |
| `border-border` / `border-border-hover` | Borders and hover states |
| `font-heading` | Heading font family |
| `rounded-xl` | Card corners |

### Design Principles

- **Content-appropriate layouts** — different content types should have different UI patterns. A team page should not look like a blog page. Match the layout to how users expect to see that type of content.
- **Visual hierarchy** — the most important field should be the most prominent element (faces for people, dates for events, prices for products, images for portfolios).
- **Generous spacing** — prefer spacious layouts over cramped ones. Use `gap-8` to `gap-12` for grids, `mt-10` to `mt-16` between sections.
- **Hover feedback on everything clickable** — use `group`/`group-hover` pattern. Options: image zoom, title color shift, shadow lift, border highlight.
- **Image shape matches subject** — circular for faces/headshots, rectangular for products/objects, wide for scenes/articles.
- **Always handle missing images** — use a fallback (initial letter, icon, or colored placeholder), never leave a gap.
- **Responsive by default** — 1 column mobile, 2 tablet, 3 desktop for grids. Horizontal layouts stack vertically on mobile.
- **Hide pagination when not needed** — only show when `totalPages > 1`.
- **Use `StrapiImage` for all images** — never raw `<img>` tags.
- **Use `BaseLayout` on all pages** — wraps content with the global header/footer.

### Components

- `StrapiImage` — handles Strapi image URLs (relative → absolute) with Astro's `<Image />` optimization
- `BaseLayout` — global header + footer wrapper
- `Pagination` — pagination controls, only render when multiple pages exist
- `BlockRenderer` — renders Strapi dynamic zone blocks

## Strapi Conventions

- Always use `fields` to select only needed columns — never `populate: "*"`
- Media and relation fields must use `.nullable().optional()` in Zod schemas
- Use `populate` with nested `fields` for media and relations
- Seed scripts should set public permissions, upload placeholder images, create entries, and add nav links
- The `uploadImage` function uses `filepath`, `originalFilename`, `mimetype` (not `path`, `name`, `type`)
- Run `yarn clean` in `server/` after deleting content types to clear stale dist files

## Skills

- `/add-page` — scaffolds a new page (Strapi content type + seed script + Astro collection + pages). See `.claude/skills/add-page/` for details.
- Reference files: `design-patterns.md` (UI guidance) and `populate-best-practices.md` (data loading)
