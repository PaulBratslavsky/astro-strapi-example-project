# Building with Astro 6 and Strapi 5 — What Changed and How We Updated

*Co-authored by [Paul Bratslavsky](https://x.com/codingthirty) and [Chris from Coding in Public](https://www.youtube.com/@codinginpublic)*

We recently upgraded our [Astro + Strapi starter project](https://github.com/PaulBratslavsky/astro-strapi-example-project) to Astro 6, and it wasn't entirely smooth. The upgrade broke our content loader, forced us to rethink our schemas, and led to publishing a new major version of the [strapi-community-astro-loader](https://www.npmjs.com/package/strapi-community-astro-loader).

This post covers what's new in Astro 6, what we had to update in our starter and loader to support it, and how the data loading pipeline works if you want to build on top of this setup.

## What Changed in Astro 6

Astro has always positioned itself as the web framework for content-driven sites — blogs, marketing pages, docs, e-commerce. It's server-first, ships minimal JavaScript, and lets you bring in React/Vue/Svelte only where you need interactivity. Astro 6 continues that direction with some significant under-the-hood changes.

### Node 22 Minimum

Astro 6 drops Node 18 and 20 entirely. You need **Node 22.12.0 or higher**. If you're deploying to Vercel, Netlify, or similar platforms, double-check your runtime version — this one will bite you silently if you miss it.

### Vite 7

The dev server and bundler moved to Vite 7. For most projects this is transparent, but if you're using Vite plugins directly, it's worth checking the [Vite 7 migration guide](https://vite.dev/guide/migration).

### Zod v4

This was the big one for us. Astro 6 ships Zod 4 instead of Zod 3, which means:

- Some string validation methods like `z.string().email()` are deprecated in favor of top-level equivalents like `z.email()` (they still work for now, but you'll get warnings)
- Default values must match the output type after transforms, not the input type
- The internal class hierarchy is completely different — `instanceof z.ZodType` checks against Zod 3 objects will fail

That last point is what broke our loader. More on that in a minute.

### Legacy Content Collections Gone

The old Content Collections API from Astro 2 (the `src/content/` directory-based approach) is fully removed. You have to use the Content Layer API with `content.config.ts` and explicit loaders. If you were putting this migration off, Astro 6 forces the issue.

### Schema Function Signature Deprecated

Content loaders used to be able to return `schema` as an async function. In Astro 6, that signature is deprecated — the function is silently ignored now and will throw in a future release. Instead, you either provide a static `schema` property (a Zod type) or use a `createSchema()` method that returns `{ schema, types }`.

### Other Changes Worth Knowing

- **Images crop by default** in the built-in image service and will never upscale
- **`Astro.glob()` is gone** — use `import.meta.glob()` instead
- **`<ViewTransitions />` removed** — replaced by `<ClientRouter />`
- **`getStaticPaths()` can't return `number` params** — they must be strings
- **Script and style tags** now render in declaration order (previously reversed)

## Beyond the Breaking Changes — What's Actually Exciting

The breaking changes get the most attention, but Astro 6 shipped a bunch of features that are worth knowing about. Chris from [Coding in Public](https://www.youtube.com/@codinginpublic) did a great walkthrough in his [(NEW) Astro 6: First Look](https://www.youtube.com/watch?v=WxUEtNg07gE) video — here are the highlights.

### Fonts API (Now Stable)

If you've been pulling in Google Fonts with `<link>` tags or wrestling with `@font-face` declarations, the Fonts API cleans all of that up. You declare your fonts — local files, Google Fonts, or Font Source — through a single, consistent API, and Astro handles preloading for you. This was experimental for a while, but it's stable now in v6. Chris mentioned he's been using it for months in experimental mode and it's been solid.

### Live Content Collections

Standard content collections fetch data at build time and store it locally. Even in SSR mode, they pull from that local store — if your data changes, you need to rebuild. Live content collections flip that. They fetch fresh on every request, which makes them useful for things like store prices, inventory, or anything where stale data is a problem.

The API feels familiar — `getLiveEntry()` and `getLiveCollection()` instead of `getEntry()` and `getCollection()`. You define them in a `live.config.ts` file using `defineLiveContentCollection`. It's a smart decision by the Astro team to keep these separate rather than bolting a "live mode" onto the existing collections API.

### Content Security Policy (Built-In)

Astro 6 is one of the first JS meta-frameworks to ship built-in CSP for both static and dynamic pages. It's stable now and enabled by default. The tricky part about CSP in a framework like Astro is that it needs to know every script and style on a page so they can be hashed and included in the policy. Astro handles that automatically.

As Chris pointed out, there are edge cases — if you're receiving webhooks or working with third-party services, you may need to manually allow certain routes. But the defaults are solid, and they've added a full configuration API with custom hashing algorithms and directive controls for when you need more flexibility.

### Experimental Rust Compiler

This one's early, but Astro 6 includes an experimental Rust-based compiler. The main benefit is speed. It's opt-in for now, but the results are apparently impressive enough that the team felt comfortable shipping it as an experimental flag.

### Queued Rendering

Today Astro renders components recursively — rendering functions call themselves as they walk the component tree. Queued rendering replaces this with a two-pass approach: the first pass traverses the tree and emits an ordered queue, the second pass renders it. It's faster and more memory-efficient, and the team plans to make it the default in Astro 7.

### Route Caching

This is experimental but hints at where Astro is headed. It's a platform-agnostic caching API that uses web-standard cache semantics, with a built-in memory cache provider to start. Chris made a good point here — if you've followed the Next.js caching debates over the past few years, you know how badly aggressive caching defaults can go. Astro is taking a more measured approach, using web standards and moving slowly. This will likely be a headline feature in Astro 7.

For bigger static sites (Chris mentioned his own site with 500+ blog posts), route caching means you don't have to re-render pages that haven't changed. Some hosting platforms offer this already, but having it built into the framework is a different thing entirely.

## What Broke and Why

When we upgraded to Astro 6, our content collections immediately failed with:

```
Invalid schema: expected a Zod schema
```

Here's what happened. The `strapi-community-astro-loader` v2 bundled its own copy of Zod 3 in the dist output. It did an `instanceof z.ZodType` check internally — but that `z` was Zod 3. When Astro 6 (running Zod 4) tried to validate what the loader returned, the Zod 3 schema objects were completely unrecognizable to Zod 4. Different class hierarchy, different internals, no match.

The v3 release candidate fixed the Zod bundling issue but still returned `schema` as a function, which Astro 6 now ignores.

## Loader v4 — The Fix

We published `strapi-community-astro-loader@4.0.0` with two changes:

1. **No more bundled Zod** — the loader doesn't import Zod at all. It relies on Astro's built-in version, whatever that is.
2. **Removed the `schema` property entirely** — schemas are now the user's responsibility, defined in `defineCollection()`. This is how Astro 6 expects it to work anyway.

The loader source is pretty short now. Here's the whole thing:

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

What's going on here:

- Uses `@strapi/client` (the official Strapi JS client) to talk to the API
- Pages through all content automatically — handles Strapi's pagination so you don't have to
- Calls `parseData()` on each document, which is where Astro runs your Zod schema validation
- Uses `generateDigest()` to fingerprint each entry — Astro uses this to skip re-processing unchanged content
- `cacheDurationInMs` is opt-in; set it to `0` (default) and it fetches fresh every time

## How the Data Pipeline Works

### Defining Collections

Everything starts in `content.config.ts`. Here's how the articles collection looks in our project:

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

Two things worth calling out:

1. **The `params` object** controls what Strapi sends back. Using `fields` and `populate` means you only fetch the columns and relations your templates actually use — not the entire content type with every nested relation expanded.
2. **The `schema`** validates every document at build time. If Strapi returns something your frontend doesn't expect, you get a type error during build rather than a broken page in production.

### Populate Patterns

The `params` object uses Strapi's query API directly. Here are the patterns we use most:

**Only fetch specific fields:**

```typescript
fields: ["title", "slug", "publishedAt"]
```

**Populate a relation with field selection:**

```typescript
populate: {
  author: {
    fields: ["fullName"],
    populate: {
      image: { fields: ["url", "alternativeText"] },
    },
  },
}
```

**Handle dynamic zones with the `on` syntax:**

```typescript
populate: {
  blocks: {
    on: {
      "blocks.hero": {
        fields: ["heading", "text"],
        populate: {
          image: { fields: ["url", "alternativeText"] },
        },
      },
      "blocks.markdown": {
        fields: ["content"],
      },
    },
  },
}
```

Without `fields`, Strapi returns every column. Without targeted `populate`, you get either nothing or everything. Getting this right makes a real difference in payload size, especially with deeply nested content types.

If you want to go deeper on this, check out [Demystifying Strapi's Populate and Filtering](https://strapi.io/blog/demystifying-strapi-s-populate-and-filtering). And if you'd rather handle population on the server with middleware instead of passing it from the client, see [Route-Based Middleware to Handle Default Population](https://strapi.io/blog/route-based-middleware-to-handle-default-population-query-logic).

### Querying Collections in Pages

Once your collection is defined, you use Astro's `getCollection()` to query it:

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

For individual pages with dynamic routes:

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

Everything is fully typed from the Zod schema. Your editor autocompletes `post.data.title` and catches typos at build time.

### Handling Strapi Images

Strapi stores images on its own domain (or a CDN if you configure one), so image URLs from the API are often relative paths like `/uploads/photo_abc123.jpg`. We use a `StrapiImage` component to resolve these:

```astro
---
import { Image } from "astro:assets";

const BASE_URL = import.meta.env.VITE_STRAPI_BASE_URL ?? "http://localhost:1337";
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

It handles three cases: absolute URLs (pass through), relative URLs (prepend the Strapi base), and data URLs (base64, pass through). Astro's `<Image />` takes care of optimization and format conversion from there.

### Two Ways to Fetch Data

The project actually uses two different approaches to get data from Strapi, and it's worth understanding when to use which.

**Approach 1: Content collections via the loader** — this is what we covered above. You define a collection in `content.config.ts`, and the loader handles pagination, validation, and caching. This is the right choice for collection types like articles and pages where you want type safety and Astro's content layer benefits.

**Approach 2: Direct queries via `@strapi/client`** — for single types like global settings (header, footer, banner) that don't map cleanly to a content collection, we use the Strapi client directly:

```typescript
// client/src/utils/strapi-client.ts
import { strapi } from "@strapi/client";

const strapiClient = strapi({
  baseURL: (import.meta.env.STRAPI_BASE_URL ?? "http://localhost:1337") + "/api",
});

export { strapiClient };
```

Then in our loaders, we query single types with the same populate patterns:

```typescript
// client/src/utils/loaders.ts
import { strapiClient } from "./strapi-client";

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

The layout calls `getGlobalPageData()` and passes the result to the Header and Footer components. Same `@strapi/client` package under the hood — the loader just wraps it with Astro's content layer on top.

Both approaches use a single `STRAPI_BASE_URL` environment variable, so there's one place to change if your Strapi server moves.

## The Starter Project

We recently updated the [astro-strapi-example-project](https://github.com/PaulBratslavsky/astro-strapi-example-project) to Astro 6. It's a minimal starter — not a theme, not a framework. It's meant to show how the pieces connect so you can take it apart and build your own thing.

What's in the box:

- **Astro 6** with Tailwind CSS v4 theming (`@theme` directive, custom design tokens)
- **Strapi 5** (latest) with seed data so you get a working site immediately
- **strapi-community-astro-loader v4** wiring up content collections
- A landing page built from composable blocks (hero, cards, FAQs, newsletter, etc.)
- A blog with paginated listing and article pages
- Dynamic pages driven by Strapi's block editor
- Global header, footer, and banner managed from Strapi's admin

To try it:

```bash
git clone https://github.com/PaulBratslavsky/astro-strapi-example-project.git
cd astro-strapi-example-project
yarn setup
yarn seed
yarn dev
```

Both servers start. The seed data gives you content to work with right away.

## Adding Pages with Claude Code

The project also includes a [Claude Code skill](https://code.claude.com/docs/en/skills.md) that lets you extend it without manually wiring up Strapi schemas, Astro collections, and page routes.

Open Claude Code in the project root and run:

```
/add-page products
```

Claude will ask what fields you want, then generate everything — the Strapi content type with schema, controller, routes, and service; a seed script with sample data and public permissions; the Astro collection config with Zod schema; and the page templates with listing and detail views.

Here's what that looks like:

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

The generated code matches the patterns in the rest of the project — same loader config, same Zod schemas, same Tailwind classes. The skill definition lives at `.claude/skills/add-page/SKILL.md` if you want to read or modify it.

## Wrapping Up

Astro 6 is a worthwhile upgrade. The Zod v4 move and content layer cleanup make the schema story cleaner, even if the migration requires some work (especially if your loaders bundle their own Zod). Combined with Strapi's populate API and the community loader, you end up with a type-safe pipeline from CMS to static site without a lot of glue code.

The loader is open source at [github.com/PaulBratslavsky/strapi-community-astro-loader](https://github.com/PaulBratslavsky/strapi-community-astro-loader) — issues and PRs welcome.

---

If you want to go deeper on Astro, Chris from Coding in Public has a comprehensive [Astro course](https://www.youtube.com/@codinginpublic) that he's currently updating for Astro 6. He's been using Astro since the early betas and covers everything from the basics to advanced patterns like server islands and content collections. Check out his [(NEW) Astro 6: First Look](https://www.youtube.com/watch?v=WxUEtNg07gE) video for a full walkthrough of all the new features, and look for a special Astro 6 discount link in the video description.
