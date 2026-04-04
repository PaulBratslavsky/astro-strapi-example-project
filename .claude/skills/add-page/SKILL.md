---
name: add-page
description: >-
  Add a new page to the Astro + Strapi project. Creates the Strapi content type
  (with schema, controller, routes, service), seeds data with placeholder images
  via the Strapi API, generates the Astro page template, updates the content
  collection config, and adds a navigation link to the Global header.
  Use when the user wants to add a new page like "products", "services",
  "pricing", "team", or any custom page to their site.
allowed-tools: Bash Read Write Edit Glob Grep AskUserQuestion
---

# Add Page Skill

Add a new page to the Astro + Strapi starter project. This skill handles:
- Strapi backend (content type + seed data + placeholder images + permissions)
- Astro frontend (page route + collection config via `strapi-community-astro-loader`)
- Navigation (adds link to Global header `navItems` via the seed script)

**Important references:**
- `populate-best-practices.md` — read this before writing any content collection config

## Usage

```
/add-page products
/add-page
```

## Execution Steps

### Step 1: Gather Page Requirements

If no page name was provided, ask the user:

```
What page would you like to add? Give me a name and a brief description.

Examples:
  - "products" — a page listing products with name, price, image, and description
  - "team" — a page showing team members with photo, role, and bio
  - "services" — a page listing services with title, description, and icon
```

Use `AskUserQuestion` to gather:
1. **Page name** (singular, e.g., "product")
2. **Fields** — what data should each entry have? Ask the user to describe what they want or suggest sensible defaults based on the page name.
3. **Page type** — collection (list of items) or single (one page with blocks). Default to collection type.

### Step 2: Reference the Existing Project Structure

Before generating anything, read these files to understand the existing patterns:

- `server/src/api/page/content-types/page/schema.json` — example Strapi schema
- `server/src/api/article/content-types/article/schema.json` — example with relations
- `client/src/content.config.ts` — how collections are defined with the loader
- `client/src/pages/[slug]/index.astro` — how dynamic pages render blocks (catch-all pattern)
- `client/src/pages/blog/[...page].astro` — how collection listing pages work (custom page override)
- `.claude/skills/add-page/populate-best-practices.md` — populate and schema rules

Match the existing code style exactly. Do not introduce new patterns.

### Step 3: Create the Strapi Content Type

Generate the full API structure at `server/src/api/<name>/`:

```
server/src/api/<name>/
├── content-types/
│   └── <name>/
│       └── schema.json
├── controllers/
│   └── <name>.ts
├── routes/
│   └── <name>.ts
└── services/
    └── <name>.ts
```

**schema.json** — Follow Strapi v5 format:

```json
{
  "kind": "collectionType",
  "collectionName": "<plural_name>",
  "info": {
    "singularName": "<name>",
    "pluralName": "<plural-name>",
    "displayName": "<Display Name>",
    "description": ""
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "description": { "type": "text" },
    ...user-defined fields...
  }
}
```

Always include `title` (string), `slug` (uid), and `description` (text) as base fields. Add the user's custom fields on top.

**controller, service, routes** — Use Strapi core factories:

```typescript
// controllers/<name>.ts
import { factories } from '@strapi/strapi';
export default factories.createCoreController('api::<name>.<name>');
```

```typescript
// services/<name>.ts
import { factories } from '@strapi/strapi';
export default factories.createCoreService('api::<name>.<name>');
```

```typescript
// routes/<name>.ts
import { factories } from '@strapi/strapi';
export default factories.createCoreRouter('api::<name>.<name>');
```

### Step 4: Seed Data, Permissions, Images, and Navigation

Create a seed script at `server/scripts/seed-<name>.js` that does ALL of the following:

1. Creates 2-4 realistic sample entries via the Strapi document service
2. Sets public permissions for `find` and `findOne`
3. **Downloads and uploads placeholder images** from `https://picsum.photos/seed/<keyword>/800/600` (use a unique seed keyword per image for variety)
4. **Adds a navigation link** to the Global header's `navItems` component

Use this pattern:

```javascript
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => { file.close(); resolve(filepath); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(filepath); });
      }
    }).on('error', reject);
  });
}

async function uploadImage(app, filepath, name) {
  const file = {
    filepath,
    originalFilename: name,
    mimetype: 'image/jpeg',
    size: fs.statSync(filepath).size,
  };
  const [uploaded] = await app.plugin('upload').service('upload').upload({
    data: {},
    files: file,
  });
  return uploaded;
}

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  // 1. Set public permissions
  const publicRole = await app.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  const actions = ['find', 'findOne'];
  for (const action of actions) {
    await app.query('plugin::users-permissions.permission').create({
      data: {
        action: `api::<name>.<name>.${action}`,
        role: publicRole.id,
      },
    });
  }

  // 2. Download and upload placeholder images
  const tmpDir = path.join(__dirname, '..', '.tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const imageConfigs = [
    { url: 'https://picsum.photos/seed/<keyword1>/800/600', name: '<keyword1>.jpg' },
    { url: 'https://picsum.photos/seed/<keyword2>/800/600', name: '<keyword2>.jpg' },
    // one per seed entry...
  ];

  const uploadedImages = [];
  for (const img of imageConfigs) {
    const filepath = path.join(tmpDir, img.name);
    await downloadImage(img.url, filepath);
    const uploaded = await uploadImage(app, filepath, img.name);
    uploadedImages.push(uploaded);
    fs.unlinkSync(filepath);
  }

  // 3. Create seed entries (with image references)
  const entries = [
    { title: "...", slug: "...", description: "...", image: uploadedImages[0].id, ...fields },
    { title: "...", slug: "...", description: "...", image: uploadedImages[1].id, ...fields },
  ];

  for (const entry of entries) {
    await app.documents('api::<name>.<name>').create({
      data: entry,
      status: 'published',
    });
  }

  // 4. Add navigation link to Global header
  const global = await app.documents('api::global.global').findFirst({
    populate: {
      header: {
        populate: {
          logo: true,
          navItems: true,
          cta: true,
        },
      },
    },
  });

  if (global) {
    const existingNavItems = global.header?.navItems || [];
    const alreadyExists = existingNavItems.some((item) => item.href === '/<plural-name>');

    if (!alreadyExists) {
      await app.documents('api::global.global').update({
        documentId: global.documentId,
        data: {
          header: {
            ...global.header,
            navItems: [
              ...existingNavItems,
              { href: '/<plural-name>', label: '<Display Name Plural>', isExternal: false, isButtonLink: false },
            ],
          },
        },
        status: 'published',
      });
      console.log('Added "<Display Name Plural>" link to global navigation.');
    }
  }

  console.log(`Seeded ${entries.length} <name> entries with public permissions.`);
  await app.destroy();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

Add a `seed:<name>` script to `server/package.json`.

### Step 5: Update Astro Content Config

Edit `client/src/content.config.ts` to add a new collection.

**All data MUST be loaded via the `strapi-community-astro-loader`** — never hardcode content in Astro pages. Follow the populate best practices in `populate-best-practices.md`.

**CRITICAL SCHEMA RULES:**
- Always use `fields` to select only needed columns — never use `populate: "*"`.
- Use `populate` with nested `fields` for media and relations.
- **Media and relation fields MUST use `.nullable().optional()` in Zod schemas.** Strapi returns `null` for empty media/relation fields, not `undefined`. Using only `.optional()` causes `InvalidContentEntryDataError`.

```typescript
const strapi<PluralName> = defineCollection({
  loader: strapiLoader({
    contentType: "<name>",
    clientConfig,
    params: {
      fields: ["title", "slug", "description", ...custom fields],
      populate: {
        // Media fields — always specify which fields to return
        image: { fields: ["url", "alternativeText"] },
        // Relations — use nested populate for sub-relations
        // author: {
        //   fields: ["fullName"],
        //   populate: { image: { fields: ["url", "alternativeText"] } },
        // },
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    // Media fields — ALWAYS .nullable().optional()
    image: imageSchema.nullable().optional(),
    // Relations — ALWAYS .nullable().optional()
    // author: z.object({ ... }).nullable().optional(),
  }),
});
```

Add the new collection to the `collections` export.

### Step 6: Create Astro Pages

Create the page routes. The architecture supports two patterns:
- **Catch-all dynamic pages** (`[slug]/index.astro`) render any Strapi page via blocks — this is the default for CMS-managed pages.
- **Custom page overrides** (`<plural-name>/[...page].astro` + `<plural-name>/[slug].astro`) are created for collection types that need a dedicated listing/detail UI.

For a collection type, create two files at `client/src/pages/<plural-name>/`:
1. `[...page].astro` — the listing page with pagination
2. `[slug].astro` — the detail page

#### Technical requirements (must follow exactly)

**Listing page (`[...page].astro`)** must use this data-loading pattern:

```astro
---
import StrapiImage from "../../components/StrapiImage.astro";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Pagination from "../../components/Pagination.astro";
import { getCollection } from "astro:content";

import type { CollectionEntry } from "astro:content";

type Item = CollectionEntry<"strapi<PluralName>">;

type CollectionItem = {
  params: { slug: string };
  props: Item;
};

type PaginatedPage = {
  data: CollectionItem[];
  currentPage: number;
  total: number;
  size: number;
  url: {
    prev: string | null;
    next: string | null;
  };
};

export async function getStaticPaths({ paginate }: { paginate: any }) {
  const collection = await getCollection("strapi<PluralName>");

  function createStaticPaths(items: Item[]) {
    return items.map((item) => ({
      params: { slug: item.data.slug },
      props: item,
    }));
  }

  const staticPaths = createStaticPaths(collection);

  const paginatedData = paginate(staticPaths, {
    pageSize: 12,
    url: {
      prev: "/<plural-name>",
      next: "/<plural-name>",
    },
  });

  return paginatedData;
}

const { page }: { page: PaginatedPage } = Astro.props;

const items = page.data;
const currentPage = page.currentPage;
const totalPages = Math.ceil(page.total / page.size);
---
```

**Detail page (`[slug].astro`)** must use this data-loading pattern:

```astro
---
import StrapiImage from "../../components/StrapiImage.astro";
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

import type { CollectionEntry } from "astro:content";

type Item = CollectionEntry<"strapi<PluralName>">;

export async function getStaticPaths() {
  const collection = await getCollection("strapi<PluralName>");

  return collection.map((item) => ({
    params: { slug: item.data.slug },
    props: item.data,
  }));
}

const { props } = Astro;
---
```

Both pages must:
- Wrap content in `<BaseLayout>`
- Use `StrapiImage` for all images (never raw `<img>`)
- Include `Pagination` on the listing page
- Use the project's existing Tailwind theme tokens (`text-secondary`, `text-muted`, `text-primary-600`, `bg-surface-raised`, `border-border`, `font-heading`, etc.) — read existing pages to see which tokens are available
- Always guard media fields with conditional rendering (`{image && (...)}`)
- Include a back link on the detail page

#### Design approach (do NOT use a generic template)

**Choose the UI layout based on what the content actually is.** Different types of content have different UX conventions that users expect. Study how leading websites present this type of content and design accordingly.

Common UI patterns by content type (use as guidance, not rigid rules):

| Content type | Listing pattern | Detail pattern |
|---|---|---|
| **People** (team, staff, speakers) | Centered grid with circular/rounded avatar photos, name + role beneath, short bio. Focus on faces. | Side-by-side layout: photo + name/role on one side, full bio below. Personal and approachable. |
| **Products / items for sale** | Card grid with rectangular product images, title, price prominent, short description. Commercial feel. | Large product image(s), title + price prominent, full description, specs/details in organized sections. |
| **Blog / articles** | Featured first post with large image, remaining posts in a compact list. Emphasize publish date and author. | Long-form reading layout, narrow max-width, featured image at top, author byline. |
| **Services / features** | Icon or illustration-led cards, emphasis on heading + value proposition. May not need images at all. | Focused layout with heading, detailed description, possibly related services. |
| **Portfolio / gallery** | Masonry or image-dominant grid, minimal text overlay. Visual impact is priority. | Full-width hero image, project details below, image gallery. |
| **Events** | Date-prominent cards, time/location visible at a glance, clear CTA. | Full event details with date/time/location block, description, registration CTA. |
| **Locations / offices** | Map-friendly layout or cards with address, phone, hours visible at a glance. | Full address block, map embed placeholder, hours, contact details. |
| **Testimonials / reviews** | Quote-focused layout with large quote marks, author attribution. May use carousel or stacked layout. | Usually no detail page — testimonials are typically inline. |
| **FAQ / knowledge base** | Accordion or grouped list by category. Scannable headings. | Expanded answer with related questions. |

**Key design principles:**
- The layout should feel natural for the content — a team page should look like a team page, not a blog
- Prioritize the most important field visually (faces for people, images for products, dates for events)
- Use appropriate image aspect ratios (circular crops for headshots, rectangular for products, wide for articles)
- Ensure the visual hierarchy matches user expectations for this content type
- When in doubt, look at 3-4 well-known websites that have this page type and identify the common patterns

### Step 7: Summary

Print a summary of everything that was created:

```
New page "<name>" added successfully!

Strapi (server/):
  - src/api/<name>/content-types/<name>/schema.json
  - src/api/<name>/controllers/<name>.ts
  - src/api/<name>/routes/<name>.ts
  - src/api/<name>/services/<name>.ts
  - scripts/seed-<name>.js (entries + placeholder images + nav link + permissions)

Astro (client/):
  - src/content.config.ts (updated)
  - src/pages/<plural-name>/[...page].astro (listing with pagination)
  - src/pages/<plural-name>/[slug].astro (detail page)

Next steps:
  1. Restart the Strapi server: cd server && yarn develop
  2. Run the seed script: cd server && node scripts/seed-<name>.js
  3. Restart the Astro dev server: cd client && yarn dev
  4. Visit http://localhost:4321/<plural-name> to see your new page
```
