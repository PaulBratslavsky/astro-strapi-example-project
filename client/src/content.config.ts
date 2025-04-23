import type { Loader } from "astro/loaders";
import { defineCollection } from "astro:content";
import { strapiLoader } from "strapi-community-astro-loader";

export const collections = {
  strapiPosts: defineCollection({
    loader: strapiLoader({ contentType: "article", params: { populate: "*" } }) as Loader,
  }),
};
