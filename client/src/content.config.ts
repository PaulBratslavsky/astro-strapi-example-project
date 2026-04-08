import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { strapiLoader } from "strapi-community-astro-loader";

const clientConfig = {
  baseURL: import.meta.env.STRAPI_BASE_URL || "http://localhost:1337/api",
};

// ── Reusable schemas ──

const imageSchema = z.object({
  id: z.number().optional(),
  documentId: z.string().optional(),
  url: z.string(),
  alternativeText: z.string().nullable().optional(),
});

const linkSchema = z.object({
  href: z.string(),
  label: z.string().optional(),
  isExternal: z.boolean().optional(),
  isButtonLink: z.boolean().optional(),
  type: z.enum(["PRIMARY", "SECONDARY"]).optional(),
});

const blockBase = {
  id: z.number().optional(),
  __component: z.string(),
  documentId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  publishedAt: z.string().optional(),
};

// ── Block schemas ──

const blockSchema = z.discriminatedUnion("__component", [
  z.object({
    ...blockBase,
    __component: z.literal("blocks.hero"),
    heading: z.string(),
    text: z.string(),
    image: imageSchema.nullable().optional(),
    links: z.array(linkSchema).optional(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.heading-section"),
    heading: z.string(),
    subHeading: z.string(),
    anchorLink: z.string().nullable().optional(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.card-grid"),
    card: z.array(
      z.object({
        id: z.number().optional(),
        heading: z.string(),
        text: z.string(),
        image: imageSchema.optional(),
      })
    ),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.content-with-image"),
    heading: z.string(),
    text: z.string(),
    image: imageSchema,
    link: linkSchema,
    reversed: z.boolean().optional(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.faqs"),
    faq: z.array(
      z.object({
        heading: z.string(),
        text: z.string(),
      })
    ),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.person-card"),
    personName: z.string(),
    personJob: z.string(),
    image: imageSchema.optional(),
    text: z.string(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.markdown"),
    content: z.string(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.featured-articles"),
    articles: z.array(
      z.object({
        id: z.number().optional(),
        documentId: z.string().optional(),
        title: z.string(),
        description: z.string(),
        slug: z.string(),
        publishedAt: z.string().optional(),
        updatedAt: z.string().optional(),
        author: z.object({
          id: z.number().optional(),
          documentId: z.string().optional(),
          fullName: z.string(),
          image: imageSchema.optional(),
        }),
        featuredImage: imageSchema,
      })
    ),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.newsletter"),
    heading: z.string(),
    text: z.string(),
    placeholder: z.string(),
    label: z.string(),
    formId: z.string().nullable().optional(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.community-links"),
    heading: z.string().nullable().optional(),
    link: z.array(
      z.object({
        id: z.number().optional(),
        title: z.string(),
        description: z.string(),
        href: z.string(),
        label: z.string(),
      })
    ).optional(),
  }),
  z.object({
    ...blockBase,
    __component: z.literal("blocks.featured-workshops"),
    workshops: z.array(
      z.object({
        id: z.number().optional(),
        documentId: z.string().optional(),
        title: z.string(),
        description: z.string(),
        slug: z.string(),
        instructor: z.string().nullable().optional(),
        skillLevel: z.string().nullable().optional(),
        duration: z.string().nullable().optional(),
        price: z.number().nullable().optional(),
        coverImage: imageSchema.nullable().optional(),
      })
    ),
  }),
]);

// ── Populate configs ──
// Use `fields` to select only needed columns and `on` for dynamic zones.

const blocksPopulate = {
  on: {
    "blocks.hero": {
      fields: ["heading", "text"],
      populate: {
        image: { fields: ["url", "alternativeText"] },
        links: { fields: ["href", "label", "isExternal", "isButtonLink", "type"] },
      },
    },
    "blocks.heading-section": {
      fields: ["heading", "subHeading", "anchorLink"],
    },
    "blocks.card-grid": {
      populate: {
        card: { fields: ["heading", "text"] },
      },
    },
    "blocks.content-with-image": {
      fields: ["heading", "text", "reversed"],
      populate: {
        image: { fields: ["url", "alternativeText"] },
        link: { fields: ["href", "label", "isExternal"] },
      },
    },
    "blocks.faqs": {
      populate: {
        faq: { fields: ["heading", "text"] },
      },
    },
    "blocks.person-card": {
      fields: ["personName", "personJob", "text"],
      populate: {
        image: { fields: ["url", "alternativeText"] },
      },
    },
    "blocks.markdown": {
      fields: ["content"],
    },
    "blocks.featured-articles": {
      populate: {
        articles: {
          fields: ["title", "description", "slug", "publishedAt", "updatedAt"],
          populate: {
            featuredImage: { fields: ["url", "alternativeText"] },
            author: {
              fields: ["fullName"],
              populate: {
                image: { fields: ["url", "alternativeText"] },
              },
            },
          },
        },
      },
    },
    "blocks.newsletter": {
      fields: ["heading", "text", "placeholder", "label", "formId"],
    },
    "blocks.community-links": {
      fields: ["heading"],
      populate: {
        link: { fields: ["title", "description", "href", "label"] },
      },
    },
    "blocks.featured-workshops": {
      populate: {
        workshops: {
          fields: ["title", "description", "slug", "instructor", "skillLevel", "duration", "price"],
          populate: {
            coverImage: { fields: ["url", "alternativeText"] },
          },
        },
      },
    },
  },
};

// ── Collections ──

const strapiPosts = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    clientConfig,
    params: {
      fields: ["title", "slug", "description", "content", "publishedAt", "updatedAt"],
      populate: {
        featuredImage: { fields: ["url", "alternativeText"] },
        author: {
          fields: ["fullName"],
          populate: {
            image: { fields: ["url", "alternativeText"] },
          },
        },
        contentTags: { fields: ["title"] },
        blocks: blocksPopulate,
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    featuredImage: imageSchema.optional(),
    author: z
      .object({
        id: z.number().optional(),
        documentId: z.string().optional(),
        fullName: z.string(),
        image: imageSchema.optional(),
      })
      .optional(),
    contentTags: z
      .array(
        z.object({
          id: z.number().optional(),
          documentId: z.string().optional(),
          title: z.string(),
        })
      )
      .optional(),
    blocks: z.array(blockSchema).optional(),
  }),
});

const strapiPages = defineCollection({
  loader: strapiLoader({
    contentType: "page",
    clientConfig,
    params: {
      fields: ["title", "slug"],
      populate: {
        blocks: blocksPopulate,
      },
    },
  }),
  schema: z.object({
    title: z.string().nullable().optional(),
    slug: z.string(),
    blocks: z.array(blockSchema).optional(),
  }),
});

const strapiWorkshops = defineCollection({
  loader: strapiLoader({
    contentType: "workshop",
    clientConfig,
    params: {
      fields: ["title", "slug", "description", "instructor", "skillLevel", "duration", "date", "price", "learningOutcomes"],
      populate: {
        coverImage: { fields: ["url", "alternativeText"] },
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    instructor: z.string().nullable().optional(),
    skillLevel: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
    duration: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    coverImage: imageSchema.nullable().optional(),
    learningOutcomes: z.string().nullable().optional(),
  }),
});

const strapiProducts = defineCollection({
  loader: strapiLoader({
    contentType: "product",
    clientConfig,
    params: {
      fields: ["title", "slug", "description", "price", "category", "material"],
      populate: {
        image: { fields: ["url", "alternativeText"] },
      },
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    price: z.number(),
    category: z.enum(["outerwear", "tops", "bottoms", "accessories"]),
    material: z.string().nullable().optional(),
    image: imageSchema.nullable().optional(),
  }),
});

export const collections = {
  strapiPosts,
  strapiPages,
  strapiWorkshops,
  strapiProducts,
};
