*Co-authored by [Paul Bratslavsky](https://x.com/codingthirty) and [Chris from Coding in Public](https://www.youtube.com/@codinginpublic)*

With Astro 6 now out, we wanted to take the opportunity to cover what's new and share how we updated our [Astro + Strapi starter project](https://github.com/PaulBratslavsky/astro-strapi-example-project). Overall the migration was smooth — the only real hiccup was needing to update the community loader to handle the Zod 3 to Zod 4 transition.

## What's New in Astro 6

Chris from Coding in Public did a full walkthrough of everything that landed in Astro 6.  You can watch the full video here, but we will cover all the highlights.

<!-- EMBED: https://www.youtube.com/watch?v=WxUEtNg07gE -->

**Rebuilt Dev Server**

Astro 6 ships a rebuilt dev server designed to close the gap between development and production environments. 

**Node 22 Minimum**

Astro 6 drops Node 18 and 20 entirely. You need **Node 22.12.0 or higher**. If you're deploying to Vercel, Netlify, or similar — double-check your runtime version. This one will bite you silently if you miss it.

**Zod v4**

Astro 6 ships Zod 4 instead of Zod 3. Some string validation methods like `z.string().email()` are deprecated in favor of top-level equivalents like `z.email()`. The error message API has also changed slightly. This is what broke our loader, covered in detail below.

**Legacy Content Collections Removed**

The old Content Collections API from Astro 2 (the `src/content/` directory-based approach) is fully removed. You have to use the Content Layer API with `content.config.ts` and explicit loaders.

**Schema Function Signature Deprecated**

Content loaders used to return `schema` as an async function. In Astro 6, that signature is deprecated — silently ignored now, will throw in a future release. Instead, provide a static `schema` property or use `createSchema()`.

**Fonts API (Now Stable)**

No more `<link>` tags or `@font-face` wrestling. Declare your fonts — local, Google Fonts, or Font Source — through a single API and Astro handles preloading. We're using it in our starter with Roboto via Google Fonts.

**Live Content Collections**

Standard content collections fetch at build time. Live content collections fetch fresh on every request — useful for store prices, inventory, or anything where stale data is a problem. The API uses `getLiveEntry()` and `getLiveCollection()`, defined in a separate `live.config.ts`.

**Content Security Policy (Built-In)**

One of the first JS meta-frameworks with built-in CSP for both static and dynamic pages. Astro handles script and style hashing automatically, with a full configuration API for when you need more control.

**Experimental Rust Compiler**

Early stage and opt-in, but with impressive speed gains. The primary benefit is speed. Worth enabling if you want to try it.

**Queued Rendering**

Astro currently renders components recursively — rendering functions call themselves as they walk the component tree. Queued rendering replaces this with a two-pass approach: the first pass traverses the tree and emits an ordered queue, the second pass renders it. The result is both faster and more memory-efficient. Planned as the default rendering strategy in Astro 7.

**Route Caching**

Experimental, platform-agnostic caching using web-standard semantics. You configure a cache provider in your Astro config — it ships with a built-in memory cache provider to get started. For sites with hundreds of pages, not re-rendering unchanged content on every build is a significant win. Chris expects this to be one of the headline features in Astro 7.

**Breaking Changes to Be Aware Of**

Chris recommends checking the [official Astro v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/) for the full list. A few worth calling out:

- **`<ViewTransitions />` removed** — replaced by `<ClientRouter />`
- **`Astro.site` moved** — now accessed via `import.meta.env.SITE`
- **`getStaticPaths()` typing** — check the upgrade guide for namespace changes
- **Zod schema import** — now unified as `astro:zod` across the ecosystem

For the complete list, see the official [Astro v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/).

---

## Astro 6 Changes That Affected Our Project

**Node 22 Minimum**

Astro 6 drops Node 18 and 20 entirely. You need **Node 22.12.0 or higher**. If you're deploying to Vercel, Netlify, or similar — double-check your runtime version. This one will bite you silently if you miss it.

**Zod v4**

This was the big one for us. Astro 6 ships Zod 4 instead of Zod 3:

- Some string validation methods like `z.string().email()` are deprecated in favor of top-level equivalents like `z.email()` (still work, but you'll get warnings)
- Default values must match the output type after transforms, not the input type
- The internal class hierarchy is completely different — `instanceof z.ZodType` checks against Zod 3 objects will fail

That last point is exactly what caused our loader to break. More on that below.

**Schema Function Signature Deprecated**

Content loaders used to return `schema` as an async function. In Astro 6, that signature is deprecated — silently ignored now, will throw in a future release. Instead, provide a static `schema` property or use `createSchema()`.

---

**Updating the Community Loader**

Our migration was straightforward — if you're upgrading your own project, the [official Astro v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/) covers everything you need. Our only hiccup was the community loader.

The `strapi-community-astro-loader` was bundling its own copy of Zod 3, which conflicted with Astro 6's Zod 4. We published **`strapi-community-astro-loader@4.0.0`** to fix it — the loader no longer bundles Zod at all, and schemas are now defined by the user in `defineCollection()` rather than inside the loader itself:

```ts
// Before (loader v2/v3)
const strapiPosts = defineCollection({
  loader: strapiLoader({ contentType: "article", schema: articleSchema, ... }),
});

// After (loader v4)
const strapiPosts = defineCollection({
  loader: strapiLoader({ contentType: "article", ... }),
  schema: z.object({ ... }),
});
```

Under the hood the loader uses `@strapi/client`, pages through all content automatically, and calls Astro's `parseData()` on each document — that's where your Zod schema validation runs. It also uses `generateDigest()` to fingerprint entries so Astro can skip unchanged content on rebuilds. `cacheDurationInMs` is opt-in and defaults to `0` (always fetch fresh). Full source is on [GitHub](https://github.com/PaulBratslavsky/strapi-community-astro-loader).

---

## Getting Started with the Starter

If you want to get up and running quickly, clone the [astro-strapi-example-project](https://github.com/PaulBratslavsky/astro-strapi-example-project) and run three commands:

```bash
git clone https://github.com/PaulBratslavsky/astro-strapi-example-project.git
cd astro-strapi-example-project
yarn setup
yarn seed
yarn dev
```

Both the Astro and Strapi servers start together. The seed script populates your Strapi instance with content so you have a working site immediately — no manual data entry needed.

The starter includes:

- **Astro 6** with Tailwind CSS v4 theming (`@theme` directive, custom design tokens)
- **Strapi 5** (latest) with seed data
- **strapi-community-astro-loader v4** for content collections
- A landing page built from composable blocks (hero, cards, FAQs, newsletter)
- A blog with paginated listing and article pages
- Dynamic pages driven by Strapi's block editor
- Global header, footer, and banner managed from Strapi's admin

---

## How the Data Pipeline Works

```mermaid
flowchart LR
    A[Strapi API] --> B[Loader]
    B --> C[Content Layer]
    C --> D[Zod Validation]
    D --> E[Typed Props]
    E --> F[Templates]

    style A fill:#4945FF,color:#fff,stroke:none
    style B fill:#1e293b,color:#fff,stroke:none
    style C fill:#FF5D01,color:#fff,stroke:none
    style D fill:#3178c6,color:#fff,stroke:none
    style E fill:#16a34a,color:#fff,stroke:none
    style F fill:#FF5D01,color:#fff,stroke:none
```

The project fetches data from Strapi in two ways, depending on the content type.

### Content Collections via the Loader

For collection types like articles and pages, we use the loader inside `content.config.ts`. It handles pagination, validation, and caching through Astro's Content Layer.

```typescript
import { defineCollection, z } from "astro:content";
import { strapiLoader } from "strapi-community-astro-loader";

const clientConfig = {
  baseURL: import.meta.env.STRAPI_BASE_URL || "http://localhost:1337/api",
};

const strapiPosts = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig,
    params: {
      fields: ["title", "slug", "description", "content", "publishedAt"],
      populate: {
        featuredImage: { fields: ["url", "alternativeText"] },
        author: {
          fields: ["fullName"],
          populate: {
            image: { fields: ["url", "alternativeText"] },
          },
        },
        contentTags: { fields: ["title"] },
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    featuredImage: z.object({
      url: z.string(),
      alternativeText: z.string().nullable().optional(),
    }).optional(),
    author: z.object({
      fullName: z.string(),
      image: z.object({
        url: z.string(),
        alternativeText: z.string().nullable().optional(),
      }).optional(),
    }).optional(),
    contentTags: z.array(
      z.object({ title: z.string() })
    ).optional(),
  }),
});

export const collections = { strapiPosts };
```

The `params` object controls what Strapi sends back — only the fields and relations your templates actually use. The `schema` validates every document at build time, so you catch mismatches early instead of shipping broken pages.

Then you query it in pages:

```astro
---
import { getCollection } from "astro:content";
const posts = await getCollection("strapiPosts");
---

{posts.map((post) => (
  <a href={`/blog/${post.data.slug}`}>
    <h2>{post.data.title}</h2>
    <p>{post.data.description}</p>
  </a>
))}
```

For dynamic routes:

```astro
---
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("strapiPosts");
  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: post.data,
  }));
}

const { title, content, author } = Astro.props;
---

<h1>{title}</h1>
<p>By {author?.fullName}</p>
```

Everything is fully typed from the Zod schema — your editor autocompletes field names and catches typos at build time.

### Direct Queries via the Strapi Client

For single types like global settings (header, footer, banner) that don't map to a content collection, we use `@strapi/client` directly:

```typescript
import { strapi } from "@strapi/client";

const strapiClient = strapi({
  baseURL: (import.meta.env.STRAPI_BASE_URL ?? "http://localhost:1337") + "/api",
});
```

```typescript
async function getGlobalPageData() {
  const data = await strapiClient.single("global").find({
    populate: {
      header: {
        populate: {
          logo: { populate: { image: { fields: ["url", "alternativeText"] } } },
          navItems: true,
          cta: true,
        },
      },
      footer: {
        populate: {
          logo: { populate: { image: { fields: ["url", "alternativeText"] } } },
          navItems: true,
          socialLinks: { populate: { image: { fields: ["url", "alternativeText"] } } },
        },
      },
    },
  });
  return data?.data;
}
```

Same `@strapi/client` package under the hood — the loader just wraps it with Astro's content layer. Both approaches use a single `STRAPI_BASE_URL` environment variable.

### Populate Best Practices

Getting populate right makes a real difference in payload size. Here are the patterns we use:

```typescript
// Only fetch specific fields
fields: ["title", "slug", "publishedAt"]

// Populate a relation with field selection
populate: {
  author: {
    fields: ["fullName"],
    populate: { image: { fields: ["url", "alternativeText"] } },
  },
}

// Handle dynamic zones with the "on" syntax
populate: {
  blocks: {
    on: {
      "blocks.hero": {
        fields: ["heading", "text"],
        populate: { image: { fields: ["url", "alternativeText"] } },
      },
      "blocks.markdown": { fields: ["content"] },
    },
  },
}
```

Without `fields`, Strapi returns every column. Without targeted `populate`, you get either nothing or everything. For a deep dive, check out [Demystifying Strapi's Populate and Filtering](https://strapi.io/blog/demystifying-strapi-s-populate-and-filtering). For server-side population with middleware, see [Route-Based Middleware to Handle Default Population](https://strapi.io/blog/route-based-middleware-to-handle-default-population-query-logic).

### Handling Strapi Images

Strapi serves images from its own domain, so URLs from the API are often relative paths like `/uploads/photo_abc123.jpg`. We use a `StrapiImage` component to resolve them:

```astro
---
import { Image } from "astro:assets";

const BASE_URL = import.meta.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const { src, alt, height, width, class: className } = Astro.props;

function getStrapiMedia(url: string | null) {
  if (url == null) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http") || url.startsWith("//")) return url;
  return `${BASE_URL}${url}`;
}

const imageUrl = getStrapiMedia(src);
---

{imageUrl && (
  <Image src={imageUrl} alt={alt || "No alternative text"}
    height={height} width={width} class={className} />
)}
```

Handles absolute URLs (pass through), relative URLs (prepend Strapi base), and data URLs (base64). Astro's `<Image />` handles optimization from there.

---

## Extending the Project with Claude Code

The starter includes a [Claude Code skill](https://strapi.io/blog/what-are-agent-skills-and-how-to-use-them) that lets you add new pages without manually wiring up Strapi schemas, Astro collections, and page routes. One command scaffolds the full stack — from database schema to styled frontend.

The skill supports two page architectures:
- **Collection pages** (workshops, team, events) — creates a new Strapi collection type with its own API, seed data, listing page, and detail pages
- **Block-based pages** (community, about, pricing) — creates an entry in the existing Page collection type using dynamic zone blocks — no new Astro page file needed

### Example: Building a Community Page with Workshops

We ran a single `/add-page` command that created both a workshops collection and a community landing page that references it:

```
> /add-page community

Create a community page with a hero section welcoming people, a grid of
4 benefit cards, links to the Astro and Strapi GitHub repos and Discord
servers, and a featured workshops section. The workshops should be a
separate collection at /workshops with title, instructor, skill level,
duration, date, price, cover image, and learning outcomes. Create 3
sample workshops.
```

The skill determined this required **both paths** and handled them together.

#### Part 1: Workshop Collection

The skill created a new `workshop` collection type following the existing article/page patterns:

```
server/src/api/workshop/
├── content-types/workshop/schema.json
├── controllers/workshop.ts
├── routes/workshop.ts
└── services/workshop.ts
```

Fields include `title`, `slug`, `description`, plus custom fields: `instructor` (string), `skillLevel` (enum: beginner/intermediate/advanced), `duration` (string), `date` (datetime), `price` (decimal), `coverImage` (media), and `learningOutcomes` (richtext).

The seed script downloads placeholder images, creates 3 workshops, sets public permissions, and adds "Workshops" to the nav. The Astro listing page uses a bordered card grid with skill-level badges, instructor attribution, and a metadata row with date, duration, and price.

#### Part 2: Community Page

Instead of creating a separate content type, the skill recognized this as a block-based page and created an entry in the existing Page collection type using dynamic zone blocks:

1. **Mapped sections to existing blocks** — the hero used `blocks.hero`, the section heading used `blocks.heading-section`, benefit cards used `blocks.card-grid`
2. **Created new block components** where needed — `blocks.community-links` for external GitHub/Discord links, and `blocks.featured-workshops` with a `oneToMany` relation to the workshop collection
3. **Registered everything** — updated the page schema's dynamic zone, added Zod schemas and populate configs, created Astro renderer components, and registered them in `BlockRenderer.astro`
4. **Seeded the page** — the seed script creates a Page entry with 5 blocks and adds "Community" to the nav

The community page renders automatically via the catch-all `[slug]/index.astro` route — no new Astro page file was created.

For a deeper look at what agent skills are and how to build your own, check out [What Are Agent Skills and How to Use Them](https://strapi.io/blog/what-are-agent-skills-and-how-to-use-them).

---

## Wrapping Up

If you're upgrading an existing Astro + Strapi project, two changes account for most of the friction: the Node 22 requirement and the loader update. Check your Node version first, then update to `strapi-community-astro-loader@4` and move your schema definitions into `defineCollection()`. That covers the majority of upgrade surface area.

The loader is open source at [github.com/PaulBratslavsky/strapi-community-astro-loader](https://github.com/PaulBratslavsky/strapi-community-astro-loader) — issues and PRs welcome. The full starter is at [github.com/PaulBratslavsky/astro-strapi-example-project](https://github.com/PaulBratslavsky/astro-strapi-example-project).

---

**Want to go deeper on Astro?** Chris from Coding in Public has an [Astro course](https://www.youtube.com/@codinginpublic) he's currently updating for v6. Watch his [(NEW) Astro 6: First Look](https://www.youtube.com/watch?v=WxUEtNg07gE) for the full rundown, and check the video description for a special Astro 6 discount.
