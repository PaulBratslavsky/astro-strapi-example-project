---
name: add-page
description: >-
  Add a new page to the Astro + Strapi project. Creates the Strapi content type
  (with schema, controller, routes, service), seeds data via the Strapi API,
  generates the Astro page template, and updates the content collection config.
  Use when the user wants to add a new page like "products", "services",
  "pricing", "team", or any custom page to their site.
allowed-tools: Bash Read Write Edit Glob Grep AskUserQuestion
---

# Add Page Skill

Add a new page to the Astro + Strapi starter project. This skill handles both the Strapi backend (content type + seed data) and the Astro frontend (page route + collection config).

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
- `client/src/pages/[slug]/index.astro` — how dynamic pages render blocks
- `client/src/pages/blog/[...page].astro` — how collection listing pages work

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

### Step 4: Seed Data and Permissions

Create a seed script at `server/scripts/seed-<name>.js` that:

1. Creates 2-4 realistic sample entries via the Strapi document service
2. Sets public permissions for `find` and `findOne`

Use this pattern:

```javascript
const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  // Set public permissions
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

  // Create seed entries
  const entries = [
    { title: "...", slug: "...", description: "...", ...fields },
    { title: "...", slug: "...", description: "...", ...fields },
  ];

  for (const entry of entries) {
    await app.documents('api::<name>.<name>').create({
      data: entry,
      status: 'published',
    });
  }

  console.log(`Seeded ${entries.length} <name> entries with public permissions.`);
  await app.destroy();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

Add a `seed:<name>` script to `server/package.json`.

### Step 5: Update Astro Content Config

Edit `client/src/content.config.ts` to add a new collection. Follow the existing pattern:

```typescript
const strapi<PluralName> = defineCollection({
  loader: strapiLoader({
    contentType: "<name>",
    clientConfig,
    params: {
      fields: ["title", "slug", "description", ...custom fields],
      populate: {
        // any relations or media fields
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    // ...match the Strapi schema
  }),
});
```

Add the new collection to the `collections` export.

### Step 6: Create Astro Page

Create the page route. For a collection type, create two files:

**Listing page** at `client/src/pages/<plural-name>/[...page].astro`:

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

export async function getStaticPaths({ paginate }) {
  const collection = await getCollection("strapi<PluralName>");
  const items = collection.map((item) => ({
    params: { slug: item.data.slug },
    props: item,
  }));
  return paginate(items, { pageSize: 12 });
}

const { page } = Astro.props;
const items = page.data;
---

<BaseLayout>
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h1 class="text-4xl font-bold tracking-tight text-secondary font-heading">
      <Display Name Plural>
    </h1>
    <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <a href={`/<plural-name>/${item.props.data.slug}`}
           class="group rounded-xl border border-border bg-surface-raised p-6 transition hover:shadow-lg hover:border-border-hover">
          <h2 class="text-lg font-semibold text-secondary group-hover:text-primary-600 transition font-heading">
            {item.props.data.title}
          </h2>
          <p class="mt-2 text-sm text-muted leading-relaxed">
            {item.props.data.description}
          </p>
        </a>
      ))}
    </div>
  </section>
</BaseLayout>
```

**Detail page** at `client/src/pages/<plural-name>/[slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

export async function getStaticPaths() {
  const collection = await getCollection("strapi<PluralName>");
  return collection.map((item) => ({
    params: { slug: item.data.slug },
    props: item.data,
  }));
}

const props = Astro.props;
---

<BaseLayout>
  <section class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-3xl font-bold tracking-tight text-secondary font-heading sm:text-4xl">
      {props.title}
    </h1>
    <p class="mt-4 text-muted leading-relaxed">{props.description}</p>
    <!-- Render additional fields here -->
  </section>
</BaseLayout>
```

Adapt the templates to include the user's custom fields (images, prices, etc.). Use the existing component patterns (`StrapiImage`, theme tokens, etc.).

### Step 7: Update Navigation (Optional)

Ask the user if they want to add the new page to the site navigation. If yes, instruct them to add a nav item in Strapi's Global single type under the header nav items.

### Step 8: Summary

Print a summary of everything that was created:

```
New page "<name>" added successfully!

Strapi (server/):
  - src/api/<name>/content-types/<name>/schema.json
  - src/api/<name>/controllers/<name>.ts
  - src/api/<name>/routes/<name>.ts
  - src/api/<name>/services/<name>.ts
  - scripts/seed-<name>.js

Astro (client/):
  - src/content.config.ts (updated)
  - src/pages/<plural-name>/[...page].astro
  - src/pages/<plural-name>/[slug].astro

Next steps:
  1. Restart the Strapi server: cd server && yarn develop
  2. Run the seed script: cd server && node scripts/seed-<name>.js
  3. Restart the Astro dev server: cd client && yarn dev
  4. Visit http://localhost:4321/<plural-name> to see your new page
```
