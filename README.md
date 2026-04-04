# Astro 6 and Strapi 5 Example Project

This is an example project for Astro 6 and Strapi 5 (latest). It is a simple project that uses Astro and Strapi to create a website with a landing page, a blog, and a contact form.

Uses [strapi-community-astro-loader v4](https://www.npmjs.com/package/strapi-community-astro-loader) to fetch data from Strapi for pages and articles via Astro's Content Layer API.

### What's New

- **Astro v6** with Zod v4 support
- **Strapi v5** (latest)
- **strapi-community-astro-loader v4** — updated for Astro v6 compatibility, uses `@strapi/client` under the hood, and requires user-defined schemas

(contact form not implemented yet)

![Screenshot of the project](./img/0-intro.gif)

## Getting Started

1. Clone the repository

In the root directory, run:

```bash
git clone https://github.com/PaulBratslavsky/astro-strapi-example-project.git
```

2. Install the dependencies

In the root directory, run:

```bash
yarn setup
```

To seed the database, run:

```bash
yarn seed
```


And do start both the Astro client and the Strapi server:

```bash
yarn dev
```

## Project Structure

The project is structured as follows:

- `client`: The Astro client
- `server`: The Strapi server

The `client` directory contains the Astro client and the `server` directory contains the Strapi server.



## Astro Pages Overview

### Home Page

The home page is the main page of the website. It is the first page that loads when the user navigates to the website.

![Screenshot of the home page](./img/001-astro-client-hero.png)

The content is structured in blocks. Each block is a component that is responsible for rendering a specific section of the page and all the data is fetched from Strapi from our landing page content type.

![Screenshot of Strapi landing page content type](./img/002-strapi-server-hero.png)


### Dynamic Page 
The dynamic page is a page that is rendered from a Strapi and consist of blocks similar to the home page. 

![Screenshot of Strapi dynamic page content type](./img/003-strapi-client-dynamic-page.png)

This allow a none-technical user to create a new page by just adding and rearranging the blocks.

In this example we are just rendering the person block.

![Screenshot of the dynamic page](./img/004-astro-server-dynamic-page.png)

### Blog Page

The blog page pulls all the posts from the blog content type and displays them in a paginated list which is handled by Astro.

![Screenshot of the blog page](./img/005-astro-client-blog.png)

The blog page is rendered from the blog page content type.

![Screenshot of the blog page content type](./img/006-strapi-server-blog-page.png)

### Article Page

The article page is a page that is rendered from a Strapi and consist of blocks similar to the home page plus additional fields like featured image, tags, and author.

![Screenshot of the article page](./img/007-strapi-client-article-page.png)

The article page is rendered from the article content type.

![Screenshot of the article content type](./img/008-strapi-server-article-page.png)


### Global Page

The global page is responsible for the header and footer content of the website.

![Screenshot of the global page header](./img/009-strapi-client-global-page-header.png)
![Screenshot of the global page footer](./img/010-strapi-client-global-page-footer.png)

The global page is rendered from the global content type.

![Screenshot of the global content type](./img/011-strapi-server-global-page.png)

## Two Ways to Fetch Strapi Data

This project uses two approaches to get data from Strapi, depending on the use case:

### 1. Content Collections via the Loader

For collection types like articles and pages, we use `strapi-community-astro-loader` inside `content.config.ts`. This gives you type-safe collections with Zod validation, pagination, and digest-based caching — all through Astro's Content Layer API.

```typescript
// client/src/content.config.ts
import { defineCollection, z } from "astro:content";
import { strapiLoader } from "strapi-community-astro-loader";

const strapiPosts = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig: { baseURL: "http://localhost:1337/api" },
    params: {
      fields: ["title", "slug", "description"],
      populate: {
        author: { fields: ["fullName"] },
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    author: z.object({ fullName: z.string() }).optional(),
  }),
});
```

Then query it in any page with `getCollection("strapiPosts")`.

### 2. Direct Queries via `@strapi/client`

For single types (global settings, landing page) that aren't content collections, we use `@strapi/client` directly. This is useful when you need data in layouts or components that don't map to a collection.

```typescript
// client/src/utils/strapi-client.ts
import { strapi } from "@strapi/client";

const strapiClient = strapi({
  baseURL: (import.meta.env.STRAPI_BASE_URL ?? "http://localhost:1337") + "/api",
});

export { strapiClient };
```

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

Both approaches use `STRAPI_BASE_URL` as the single environment variable for the Strapi server URL.

## Strapi Populate and Filtering

This project uses explicit `fields` and `populate` params in the loader to fetch only the data needed for each page. For a deep dive on how populate and filtering work in Strapi v5, check out these resources:

- [Demystifying Strapi's Populate and Filtering](https://strapi.io/blog/demystifying-strapi-s-populate-and-filtering) — covers field selection, the `on` syntax for dynamic zones, deep nested population, and all available filter operators.
- [Route-Based Middleware to Handle Default Population](https://strapi.io/blog/route-based-middleware-to-handle-default-population-query-logic) — if you prefer to handle population server-side in Strapi using route middleware instead of passing populate params from the client.

## Extending the Project with Claude Code

This project includes a built-in [Claude Code skill](https://code.claude.com/docs/en/skills.md) that lets you add new pages to both Strapi and Astro with a single command.

> **This is an example skill** designed to show how you can use Claude Code skills to automate repetitive scaffolding in a full-stack project. It's meant as a starting point — feel free to modify the skill definition at `.claude/skills/add-page/skill.md` to match your own project's patterns, design system, or deployment workflow. The skill is not a black box; it's a markdown file you own and can customize however you like.

### Adding a new page

Open Claude Code in the project root and run:

```
/add-page products
```

Claude will ask you what fields the page needs, then generate:

- **Strapi**: content type schema, controller, routes, service, and a seed script with sample data, placeholder images, public permissions, and a navigation link
- **Astro**: content collection config, listing page, and detail page — all wired up and styled to match the content type (team pages get people-focused layouts, product pages get commerce-style cards, etc.)

The skill supports two page architectures:
- **Collection pages** (workshops, team, events) — creates a new Strapi collection type with listing and detail pages
- **Block-based pages** (community, about, pricing) — creates an entry in the existing Page collection type using dynamic zone blocks, rendered automatically by the catch-all route

### Example: Workshops + Community (created with the skill)

The `/workshops` and `/community` pages in this project were both created using `/add-page` in a single prompt:

```
> /add-page community

Create a community page with a hero section welcoming people, a grid of
4 benefit cards, links to the Astro and Strapi GitHub repos and Discord
servers, and a featured workshops section. The workshops should be a
separate collection at /workshops with title, instructor, skill level,
duration, date, price, cover image, and learning outcomes. Create 3
sample workshops.
```

The skill determined that this required **both paths**:

1. **Workshops** → collection type with its own API, seed script with 3 sample entries + placeholder images, Astro listing page with skill-level badges and price, and detail pages with learning outcomes
2. **Community** → a Page entry using existing blocks (`blocks.hero`, `blocks.heading-section`, `blocks.card-grid`) plus two new block components (`blocks.community-links` for external links, `blocks.featured-workshops` referencing the workshop collection). No new Astro page needed — rendered automatically by `[slug]/index.astro`

The skill follows the existing project patterns — same loader config, same Zod schemas, same theme tokens. It adapts the UI layout to fit the content type rather than using a one-size-fits-all template. You can run it multiple times to add as many pages as you need.

### Customizing the skill

The skill lives at `.claude/skills/add-page/skill.md`. Some things you might want to change:

- **Design patterns** — the skill includes a table of UI patterns by content type (people, products, events, etc.). Add your own or adjust the existing ones to match your design system.
- **Seed data** — the seed script template downloads placeholder images from picsum.photos. Swap this for your own image service or remove it entirely.
- **Fields** — the skill always includes `title`, `slug`, and `description` as base fields. Change these defaults if your project uses different conventions.

For a deeper look at what agent skills are and how to build your own, check out [What Are Agent Skills and How to Use Them](https://strapi.io/blog/what-are-agent-skills-and-how-to-use-them).

## Thank you

Thank you for checking out this example project. I hope you find it useful.

If you have any questions or suggestions, please feel free to post an issue on the [GitHub repository](https://github.com/PaulBratslavsky/astro-strapi-example-project).

All the best,

Paul 

Socials:

[YouTube](https://www.youtube.com/@CodingAfterThirty)
[X](https://x.com/codingthirty)
