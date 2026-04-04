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
    path: filepath,
    name,
    type: 'image/jpeg',
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

For a collection type, create custom pages at `client/src/pages/<plural-name>/`:

**Listing page** at `client/src/pages/<plural-name>/[...page].astro`:

All visible text (headings, labels, empty states) should come from Strapi data where possible. Only use hardcoded text for structural elements (back links, pagination labels).

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

<BaseLayout>
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h1 class="text-4xl font-bold tracking-tight text-secondary font-heading">
      <Display Name Plural>
    </h1>

    {items.length === 0 && (
      <p class="mt-10 text-muted">No items available yet. Check back soon.</p>
    )}

    <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item: CollectionItem) => (
        <a
          href={`/<plural-name>/${item.params.slug}`}
          class="group rounded-xl border border-border bg-surface-raised overflow-hidden transition hover:shadow-lg hover:border-border-hover"
        >
          {item.props.data.image && (
            <div class="overflow-hidden">
              <StrapiImage
                class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                src={item.props.data.image.url}
                alt={item.props.data.image.alternativeText || ""}
                height={300}
                width={400}
              />
            </div>
          )}
          <div class="p-6">
            <h2 class="text-lg font-semibold text-secondary group-hover:text-primary-600 transition font-heading">
              {item.props.data.title}
            </h2>
            <p class="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
              {item.props.data.description}
            </p>
            <!-- Render additional custom fields (e.g., price) here -->
          </div>
        </a>
      ))}
    </div>

    <div class="mt-12">
      <Pagination
        previousPage={page.url.prev ? page.url.prev : null}
        nextPage={page.url.next ? page.url.next : null}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  </section>
</BaseLayout>
```

**Detail page** at `client/src/pages/<plural-name>/[slug].astro`:

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
const { title, description, image } = props;
---

<BaseLayout>
  <section class="mx-auto max-w-3xl px-6 py-16">
    <a
      href="/<plural-name>"
      class="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-600 transition"
    >
      &larr; Back to <Display Name Plural>
    </a>

    {image && (
      <div class="mt-6 overflow-hidden rounded-2xl">
        <StrapiImage
          class="w-full aspect-[16/9] object-cover"
          src={image.url}
          alt={image.alternativeText || ""}
          height={600}
          width={1200}
        />
      </div>
    )}

    <h1 class="mt-8 text-3xl font-bold tracking-tight text-secondary font-heading sm:text-4xl">
      {title}
    </h1>

    <p class="mt-6 text-muted leading-relaxed">{description}</p>

    <!-- Render additional custom fields here -->
  </section>
</BaseLayout>
```

Adapt the templates to include the user's custom fields (images, prices, etc.). Use the existing component patterns (`StrapiImage`, theme tokens, etc.).

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
