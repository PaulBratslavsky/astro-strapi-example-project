# Strapi v5 Populate Best Practices

Reference for the `add-page` skill when configuring Astro content collections with the `strapi-community-astro-loader`.

## Golden Rules

1. **Always select specific fields** — never use `populate: "*"` or `populate: "deep"`. Both over-fetch and can leak data.
2. **Use `fields` to limit top-level columns** — only request what the frontend actually renders.
3. **Use `populate` with nested `fields` for relations and media** — keeps payloads small and predictable.
4. **Media fields can return `null`** — Strapi returns `null` for empty media fields, NOT `undefined`. Always use `.nullable().optional()` in Zod schemas for any media or relation field.

## Populate Patterns

### Simple media field
```typescript
// Loader params
params: {
  fields: ["title", "slug"],
  populate: {
    image: { fields: ["url", "alternativeText"] },
  },
}

// Zod schema — MUST be nullable
schema: z.object({
  title: z.string(),
  slug: z.string(),
  image: imageSchema.nullable().optional(),
})
```

### Relation (e.g., author)
```typescript
params: {
  fields: ["title", "slug"],
  populate: {
    author: {
      fields: ["fullName"],
      populate: {
        image: { fields: ["url", "alternativeText"] },
      },
    },
  },
}

schema: z.object({
  title: z.string(),
  slug: z.string(),
  author: z.object({
    id: z.number().optional(),
    documentId: z.string().optional(),
    fullName: z.string(),
    image: imageSchema.nullable().optional(),
  }).nullable().optional(),
})
```

### Dynamic zone (blocks)
```typescript
params: {
  populate: {
    blocks: {
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
      },
    },
  },
}
```

### Repeatable component
```typescript
params: {
  populate: {
    cards: {
      fields: ["heading", "text"],
      populate: {
        image: { fields: ["url", "alternativeText"] },
      },
    },
  },
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `image: imageSchema.optional()` | Use `.nullable().optional()` — Strapi returns `null` for empty media |
| `populate: "*"` | Explicitly list each field and relation to populate |
| Missing `fields` in populate | Always specify `fields` to avoid fetching every column |
| Not populating nested relations | Use nested `populate` for relations-within-relations |
| Hardcoding page content in Astro | All content should come from Strapi via the loader |
