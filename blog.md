# Building with Astro 6 and Strapi 5 — What Changed and How We Updated

*Co-authored by [Paul Bratslavsky](https://x.com/codingthirty) and [Chris from Coding in Public](https://www.youtube.com/@codinginpublic)*

We recently upgraded our [Astro + Strapi starter project](https://github.com/PaulBratslavsky/astro-strapi-example-project) to [Astro](https://astro.build/) 6. The upgrade surfaced some compatibility issues in our content loader that led us to publish a new major version of the [strapi-community-astro-loader](https://github.com/PaulBratslavsky/strapi-community-astro-loader).

This post covers what's new in Astro 6, how we updated our starter and loader, and how the whole data pipeline works if you want to build on top of this setup.

![IMAGE: Hero screenshot of the starter project homepage — show the full landing page with hero section, cards, and footer](placeholder-hero.png)

---

## What's New in Astro 6

Astro has always been the framework built for content — blogs, marketing sites, docs, e-commerce. Server-first, minimal JavaScript, and you only pull in React/Vue/Svelte where you actually need interactivity. Astro 6 keeps that philosophy and adds some meaningful upgrades.

Chris from Coding in Public did a full walkthrough in his [(NEW) Astro 6: First Look](https://www.youtube.com/watch?v=WxUEtNg07gE) video — highly recommend watching it. Below is a summary of the changes, starting with the ones that affected our project directly. For the complete list, see the official [Astro v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/).

### Node 22 Minimum

Astro 6 drops Node 18 and 20 entirely. You need **Node 22.12.0 or higher**. If you're deploying to Vercel, Netlify, or similar — double-check your runtime version. This one will bite you silently if you miss it.

### Vite 7

The dev server and bundler moved to Vite 7. For most projects this is transparent. If you're using Vite plugins directly (like we do with `@tailwindcss/vite`), it's worth checking the [Vite 7 migration guide](https://vite.dev/guide/migration), though in our case everything worked without changes.

### Zod v4

This was the big one for us. Astro 6 ships Zod 4 instead of Zod 3:

- Some string validation methods like `z.string().email()` are deprecated in favor of top-level equivalents like `z.email()` (still work, but you'll get warnings)
- Default values must match the output type after transforms, not the input type
- The internal class hierarchy is completely different — `instanceof z.ZodType` checks against Zod 3 objects will fail

That last point is exactly what caused issues in our loader. More on that below.

### Legacy Content Collections Removed

The old Content Collections API from Astro 2 (the `src/content/` directory-based approach) is fully removed. You have to use the Content Layer API with `content.config.ts` and explicit loaders.

### Schema Function Signature Deprecated

Content loaders used to return `schema` as an async function. In Astro 6, that signature is deprecated — silently ignored now, will throw in a future release. Instead, provide a static `schema` property or use `createSchema()`.

### Other Changes

- **Images crop by default** and will never upscale
- **`Astro.glob()` removed** — use `import.meta.glob()`
- **`<ViewTransitions />` removed** — replaced by `<ClientRouter />`
- **`getStaticPaths()` can't return `number` params** — strings only
- **Script/style tags** now render in declaration order (previously reversed)

---

## The Exciting Stuff

Breaking changes get the attention, but Astro 6 shipped features worth getting excited about. Here are the highlights from [Chris's walkthrough](https://www.youtube.com/watch?v=WxUEtNg07gE).

### Fonts API (Now Stable)

No more `<link>` tags or `@font-face` wrestling. Declare your fonts — local, Google Fonts, or Font Source — through a single API and Astro handles preloading. We're using it in our starter with Roboto via Google Fonts. Chris mentioned he's had it running in experimental mode for months — it's been solid.

### Live Content Collections

Standard content collections fetch at build time. If your data changes, you rebuild. Live content collections fetch fresh on every request — useful for store prices, inventory, anything where stale data is a problem.

The API is familiar: `getLiveEntry()` and `getLiveCollection()`, defined in `live.config.ts`. Smart decision by the team to keep these separate rather than bolting a "live mode" onto existing collections.

### Content Security Policy (Built-In)

One of the first JS meta-frameworks with built-in CSP for both static and dynamic pages. Astro handles script and style hashing automatically. There are edge cases with webhooks and third-party services, but the defaults are solid and there's now a full configuration API for when you need more control.

### Experimental Rust Compiler

Early stage, opt-in, but apparently impressive speed gains. Worth enabling if you're curious.

### Queued Rendering

Replaces recursive component rendering with a two-pass approach — traverse first, render second. Faster, more memory-efficient. Planned as the default in Astro 7.

### Route Caching

Experimental, platform-agnostic caching using web-standard semantics. Chris made a good point — after the Next.js caching debates, it's refreshing to see a framework move slowly and use web standards. This will likely be a headline feature in Astro 7. For sites with hundreds of pages, not re-rendering unchanged content is a big deal.

---

## Our Starter Project

The [astro-strapi-example-project](https://github.com/PaulBratslavsky/astro-strapi-example-project) is a clean, minimal starter that shows how to connect Astro with Strapi end-to-end. It's not a theme — it's a reference you can fork, pull apart, and reshape for your own project.

What's included:

- **Astro 6** with Tailwind CSS v4 theming (`@theme` directive, custom design tokens)
- **Strapi 5** (latest) with seed data so you get a working site immediately
- **strapi-community-astro-loader v4** for content collections
- A landing page built from composable blocks (hero, cards, FAQs, newsletter)
- A blog with paginated listing and article pages
- Dynamic pages driven by Strapi's block editor
- Global header, footer, and banner managed from Strapi's admin

```bash
git clone https://github.com/PaulBratslavsky/astro-strapi-example-project.git
cd astro-strapi-example-project
yarn setup
yarn seed
yarn dev
```

Both servers start. Seed data gives you content to work with right away.

![IMAGE: Screenshot of the blog listing page showing the featured post layout with thumbnail cards below](placeholder-blog-listing.png)

![IMAGE: Screenshot of the article detail page showing the featured image, tags, author, and markdown content](placeholder-article-detail.png)

### What We Had to Fix for Astro 6

When we first ran `yarn dev` after the Astro 6 upgrade, our content collections failed immediately:

```
Invalid schema: expected a Zod schema
```

![IMAGE: Terminal screenshot showing the "Invalid schema: expected a Zod schema" error during astro dev](placeholder-error-terminal.png)

The problem was in our loader, not in Astro. The `strapi-community-astro-loader` v2 bundled its own copy of Zod 3. It had an `instanceof z.ZodType` check internally — but that `z` was Zod 3. When Astro 6 (running Zod 4) tried to validate what the loader returned, the Zod 3 objects were unrecognizable. Different class hierarchy, different internals, no match.

The v3 release candidate fixed the Zod bundling but still returned `schema` as a function, which Astro 6 now silently ignores.

So we published **`strapi-community-astro-loader@4.0.0`** with two changes:

1. **No more bundled Zod** — the loader doesn't import Zod at all. It uses whatever version Astro provides.
2. **Removed the `schema` property** — schemas are now defined by the user in `defineCollection()`, which is the Astro 6 way.

The loader is lean now — here's the full source:

```typescript
import type { Loader, LoaderContext } from "astro/loaders";
import { type API, strapi } from "@strapi/client";
import invariant from "tiny-invariant";

export function strapiLoader({
  contentType,
  clientConfig,
  params,
  pluralContentType = `${contentType}s`,
  cacheDurationInMs = 0,
  pageSize = 25,
}): Loader {
  const client = strapi(clientConfig);
  const collection = client.collection(pluralContentType);

  return {
    name: contentType,
    load: async function ({
      store, meta, logger, generateDigest, parseData,
    }: LoaderContext) {
      const lastSynced = meta.get("lastSynced");
      if (lastSynced && Date.now() - Number(lastSynced) < cacheDurationInMs) {
        logger.info("Skipping sync");
        return;
      }

      let currentPageNum = 1;
      let totalPageCount = Number.MAX_SAFE_INTEGER;

      do {
        const paginatedParams = {
          ...params,
          pagination: { page: currentPageNum, pageSize },
        } satisfies API.BaseQueryParams;

        const {
          data: page,
          meta: { pagination },
        } = await collection.find(paginatedParams);

        for (const document of page) {
          const id = String(document.documentId);
          const data = await parseData({ id, data: document });
          const digest = generateDigest(data);
          store.set({ id, digest, data });
        }

        invariant(pagination, "Strapi did not return pagination info.");
        meta.set("lastSynced", String(Date.now()));
        totalPageCount = pagination.pageCount;
        currentPageNum++;
      } while (currentPageNum <= totalPageCount);
    },
  };
}
```

What it does:

- Uses `@strapi/client` to talk to the Strapi API
- Pages through all content automatically
- Calls `parseData()` on each document — this is where Astro runs your Zod schema validation
- Uses `generateDigest()` to fingerprint entries so Astro can skip unchanged content
- `cacheDurationInMs` is opt-in (`0` = always fetch fresh)

### How Data Loading Works

Here's the full pipeline from Strapi to your templates:

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

#### Content Collections via the Loader

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

![IMAGE: VS Code screenshot showing TypeScript autocompletion on post.data with all the typed fields from the Zod schema](placeholder-typescript-autocomplete.png)

#### Direct Queries via the Strapi Client

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

![IMAGE: Side-by-side — Strapi admin panel showing the Global single type on the left, the rendered header/footer on the right](placeholder-strapi-global-vs-site.png)

#### Populate Best Practices

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

#### Handling Strapi Images

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

The starter includes a Claude Code skill that lets you add new pages without manually wiring up Strapi schemas, Astro collections, and page routes.

```
/add-page products
```

Claude asks what fields you want, then generates everything — Strapi content type, seed script, Astro collection config, and page templates:

```
> /add-page products

What fields should each product have?

> name, price (number), image, and a short description

Creating product content type in Strapi...
  server/src/api/product/content-types/product/schema.json
  server/src/api/product/controllers/product.ts
  server/src/api/product/routes/product.ts
  server/src/api/product/services/product.ts
  server/scripts/seed-product.js

Updating Astro content config...
  client/src/content.config.ts (added strapiProducts collection)

Creating page templates...
  client/src/pages/products/[...page].astro
  client/src/pages/products/[slug].astro

Next steps:
  1. Restart Strapi: cd server && yarn develop
  2. Seed the data: cd server && node scripts/seed-product.js
  3. Restart Astro: cd client && yarn dev
  4. Visit http://localhost:4321/products
```

The generated code matches the rest of the project — same patterns, same styling. The skill lives at `.claude/skills/add-page/SKILL.md` if you want to read or modify it.

---

## Wrapping Up

Astro 6 is a worthwhile upgrade. The Zod v4 move and content layer cleanup make schemas cleaner, even if it means updating loaders that bundle their own Zod. Combined with Strapi's populate API and the community loader, you get a type-safe pipeline from CMS to static site without much glue code.

The loader is open source at [github.com/PaulBratslavsky/strapi-community-astro-loader](https://github.com/PaulBratslavsky/strapi-community-astro-loader) — issues and PRs welcome.

---

**Want to go deeper on Astro?** Chris from Coding in Public has an [Astro course](https://www.youtube.com/@codinginpublic) he's currently updating for v6. He's been using Astro since the early betas and covers everything from basics to advanced patterns. Watch his [(NEW) Astro 6: First Look](https://www.youtube.com/watch?v=WxUEtNg07gE) for the full rundown, and check the video description for a special Astro 6 discount.
