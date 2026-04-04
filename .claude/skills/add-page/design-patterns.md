# Design Patterns Reference

Design guidance for the `add-page` skill. This file provides **principles, vocabulary, and examples** — not rigid templates. Use your judgment to create layouts that feel natural for each content type, applying modern UX/UI best practices.

## Theme Tokens (required)

Always use these project tokens instead of raw Tailwind colors:

| Token | Usage |
|---|---|
| `text-secondary` | Primary text (headings, names, titles) |
| `text-muted` | Body text, descriptions, secondary info |
| `text-faint` | Tertiary text (dates, metadata, captions) |
| `text-primary-600` | Accent text (roles, labels, links, tags) |
| `bg-surface` | Page background |
| `bg-surface-alt` | Section background for contrast |
| `bg-surface-raised` | Cards, elevated surfaces |
| `border-border` | Default borders |
| `border-border-hover` | Hover-state borders |
| `font-heading` | Headings and display text |
| `font-body` | Body text (default, no class needed) |
| `rounded-[--radius-card]` or `rounded-xl` | Card corners |
| `rounded-[--radius-button]` or `rounded-lg` | Button corners |

**Never use raw color values** like `text-gray-600` or `bg-white`. Always use the semantic tokens above.

## Core UX Principles

Apply these on every page you generate. They come from how well-designed modern websites handle content:

### 1. Visual Hierarchy — Lead with What Matters Most

Every content type has a **primary element** that users scan for first. Identify it and make it the most visually prominent thing on the page:

- If the content is about **people** → faces/photos are primary
- If the content is about **time** (events, schedules) → dates are primary
- If the content is about **buying** (products, pricing) → price and product image are primary
- If the content is about **reading** (articles, posts) → title and publish date are primary
- If the content is about **seeing** (portfolio, gallery) → the image IS the card
- If the content is about **choosing** (services, plans) → the value proposition is primary

The primary element should be the largest, highest-contrast, or most spatially prominent part of the card/page.

### 2. Layout Should Match the Scanning Pattern

Different content types are scanned differently:

- **Browse and compare** (products, services, team) → grid layout, cards of equal weight
- **Scan by time** (events, blog posts) → list/stack layout, ordered chronologically
- **Visual browsing** (portfolio, gallery) → image-dominant grid, minimal text
- **Quick reference** (FAQs, docs) → accordion or grouped lists, scannable headings

Choose the layout that matches how users naturally consume this type of content.

### 3. Information Density Should Match the Content

- **High density** for reference content (events with date/time/location/price) — show metadata inline, use icons for scannability
- **Low density** for visual content (portfolios, galleries) — let images breathe, minimize text
- **Medium density** for most collection types (products, team, services) — balance image and text

### 4. Responsive by Default

- Cards should stack gracefully: 1 column on mobile → 2 on tablet → 3 on desktop for grids
- Horizontal layouts should stack vertically on mobile
- Images should maintain aspect ratio across breakpoints
- Text should remain readable at all sizes — use `text-sm` to `text-lg` range, not extremes

### 5. Interaction Feedback

Every clickable element needs visible hover feedback. Use the `group`/`group-hover` pattern:

```html
<a class="group transition">
  <StrapiImage class="transition duration-500 group-hover:scale-[1.03]" />
  <h2 class="text-secondary group-hover:text-primary-600 transition font-heading">
</a>
```

Options for hover states (mix and match as appropriate):
- Image subtle zoom: `group-hover:scale-[1.02]` to `group-hover:scale-[1.05]`
- Title color shift: `group-hover:text-primary-600`
- Card shadow lift: `hover:shadow-lg`
- Border highlight: `hover:border-border-hover`
- Ring glow (for circular images): `group-hover:ring-primary-600/30`

## Spacing Guidelines

- Page sections: `py-16 px-6` with `mx-auto max-w-6xl` (listing) or `max-w-3xl` (detail)
- Grid gaps: `gap-6` to `gap-8` for dense grids, `gap-10` to `gap-12` for spacious layouts
- Header to content: `mt-10` to `mt-16` — more space for visual content, less for dense content
- Card padding: `p-5` to `p-8` — more padding for text-heavy cards, less for image-heavy
- Text stacking: `mt-1` for tight pairs (name → role), `mt-2` for related items, `mt-4` for separate sections

## Image Treatment Guidelines

Choose image shape and size based on what the image represents:

| Subject | Shape | Rationale |
|---|---|---|
| Faces / headshots | Circular (`rounded-full`) | Draws attention to the face, feels personal |
| Products / objects | Rectangular (`rounded-xl`) with `aspect-[4/3]` or `aspect-[1/1]` | Shows the full item clearly |
| Scenes / landscapes | Wide (`rounded-xl`) with `aspect-[16/9]` or `aspect-[2/1]` | Immersive, editorial feel |
| Artwork / portfolio | Flexible aspect, `rounded-xl` | Let the work speak for itself |
| Icons / logos | Small and contained (`w-12 h-12 rounded-lg`) | Supporting element, not focal |

Always handle missing images — use a fallback (initial letter, icon, colored placeholder) instead of leaving a gap.

## Common Layout Patterns

These are patterns you can draw from. **Don't copy them — use them as a vocabulary to compose the right layout for the content.**

### Centered Profile Grid
Best for: people, speakers, team members — content where identity is the focus.
Key traits: centered text, circular images, generous vertical spacing between cards.

### Bordered Card Grid
Best for: products, courses, listings — content where each item is a distinct thing to evaluate.
Key traits: border + shadow hover, image on top, structured info below, clear CTA or price.

### Horizontal List Cards
Best for: events, schedules, search results — content that's scanned sequentially.
Key traits: image thumbnail on the side, metadata (date, location) visible at a glance, stacked vertically.

### Image-First Grid
Best for: portfolio, gallery, photography — content where the visual IS the value.
Key traits: tight grid gaps, text overlay on hover or minimal text below, large image area.

### Text-Led Cards
Best for: services, features, plans — content where the value proposition matters more than any image.
Key traits: more padding, heading-first, description prominent, optional small icon/image.

### Info Block
Best for: detail pages showing structured metadata (date + location + price, specs, contact info).
Key traits: icon + label pairs, contained in a bordered box, scannable at a glance.

## Inline SVG Icons

When metadata needs icons (locations, dates, prices), use Heroicons outline style. Always size with `w-4 h-4` or `w-5 h-5` and add `shrink-0`:

**Map pin:**
```html
<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
</svg>
```

**Clock:**
```html
<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
```

**Calendar:**
```html
<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
</svg>
```

**Currency:**
```html
<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
```

## Quality Checklist

Before finishing, verify:

- [ ] The layout feels natural for this content type — would a user recognize this as a [team/events/products/etc.] page?
- [ ] The most important field is the most visually prominent element
- [ ] Image shapes match the subject (circular for faces, rectangular for products, etc.)
- [ ] Every clickable element has hover feedback
- [ ] Missing images are handled with a fallback
- [ ] Only semantic theme tokens are used — no raw colors
- [ ] Cards are scannable — text is clamped, metadata uses icons
- [ ] Pagination only shows when `totalPages > 1`
- [ ] The page is responsive — grid columns collapse gracefully on mobile
- [ ] Spacing feels generous, not cramped
