import type { Loader } from "astro/loaders";
import { defineCollection } from "astro:content";
import { strapiLoader } from "strapi-community-astro-loader";

const blocksPopulate = {
  on: {
    "blocks.hero": {
      populate: {
        image: {
          fields: ["url", "alternativeText"],
        },
        links: true,
      },
    },
    "blocks.heading-section": true,
    "blocks.card-grid": {
      populate: {
        card: true,
      },
    },
    "blocks.content-with-image": {
      populate: {
        image: {
          fields: ["url", "alternativeText"],
        },
        link: true,
      },
    },
    "blocks.faqs": {
      populate: {
        faq: true,
      },
    },
    "blocks.person-card": {
      populate: {
        image: {
          fields: ["url", "alternativeText"],
        },
      },
    },
    "blocks.markdown": true,
    "blocks.featured-articles": {
      populate: {
        articles: {
          populate: {
            featuredImage: {
              fields: ["url", "alternativeText"],
            },
            author: {
              populate: {
                image: {
                  fields: ["url", "alternativeText"],
                },
              },
            },
          },
        },
      },
    },
    "blocks.newsletter": true,
  },
};

const strapiPosts = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    params: {
      populate: {
        featuredImage: {
          fields: ["url", "alternativeText"],
        },
        author: {
          populate: {
            image: {
              fields: ["url", "alternativeText"],
            },
          },
        },
        contentTags: {
          populate: "*",
        },
        blocks: blocksPopulate,
      },
    },
  }) as unknown as Loader,
});

const strapiPages = defineCollection({
  loader: strapiLoader({
    contentType: "page",
    params: {
      populate: {
        blocks: blocksPopulate,
      },
    },
  }) as unknown as Loader,
});

export const collections = {
  strapiPosts,
  strapiPages,
};
