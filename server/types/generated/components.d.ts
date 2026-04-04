import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCardGrid extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_grids';
  info: {
    displayName: 'Card Grid';
  };
  attributes: {
    card: Schema.Attribute.Component<'shared.card', true>;
  };
}

export interface BlocksCommunityLinks extends Struct.ComponentSchema {
  collectionName: 'components_blocks_community_links';
  info: {
    displayName: 'Community Links';
  };
  attributes: {
    heading: Schema.Attribute.String;
    link: Schema.Attribute.Component<'shared.community-link', true>;
  };
}

export interface BlocksContentWithImage extends Struct.ComponentSchema {
  collectionName: 'components_blocks_content_with_images';
  info: {
    displayName: 'Content With Image';
  };
  attributes: {
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    reversed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.RichText;
  };
}

export interface BlocksFaqs extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faqs';
  info: {
    displayName: 'Faqs';
  };
  attributes: {
    faq: Schema.Attribute.Component<'shared.card', true>;
  };
}

export interface BlocksFeaturedArticles extends Struct.ComponentSchema {
  collectionName: 'components_blocks_featured_articles';
  info: {
    displayName: 'Featured Articles';
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
  };
}

export interface BlocksFeaturedWorkshops extends Struct.ComponentSchema {
  collectionName: 'components_blocks_featured_workshops';
  info: {
    displayName: 'Featured Workshops';
  };
  attributes: {
    workshops: Schema.Attribute.Relation<'oneToMany', 'api::workshop.workshop'>;
  };
}

export interface BlocksHeadingSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heading_sections';
  info: {
    description: '';
    displayName: 'Heading Section';
  };
  attributes: {
    anchorLink: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    subHeading: Schema.Attribute.String;
  };
}

export interface BlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heroes';
  info: {
    displayName: 'Hero';
  };
  attributes: {
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    links: Schema.Attribute.Component<'shared.link', true>;
    text: Schema.Attribute.RichText;
  };
}

export interface BlocksMarkdown extends Struct.ComponentSchema {
  collectionName: 'components_blocks_markdowns';
  info: {
    displayName: 'Markdown';
  };
  attributes: {
    content: Schema.Attribute.RichText;
  };
}

export interface BlocksNewsletter extends Struct.ComponentSchema {
  collectionName: 'components_blocks_newsletters';
  info: {
    displayName: 'Newsletter';
  };
  attributes: {
    formId: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    label: Schema.Attribute.String;
    placeholder: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface BlocksPersonCard extends Struct.ComponentSchema {
  collectionName: 'components_blocks_person_cards';
  info: {
    displayName: 'Person Card';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    personJob: Schema.Attribute.String;
    personName: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface LayoutBanner extends Struct.ComponentSchema {
  collectionName: 'components_layout_banners';
  info: {
    description: '';
    displayName: 'Banner';
  };
  attributes: {
    description: Schema.Attribute.Text;
    isVisible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    link: Schema.Attribute.Component<'shared.link', false>;
  };
}

export interface LayoutFooter extends Struct.ComponentSchema {
  collectionName: 'components_layout_footers';
  info: {
    description: '';
    displayName: 'Footer';
  };
  attributes: {
    logo: Schema.Attribute.Component<'shared.logo', false>;
    navItems: Schema.Attribute.Component<'shared.link', true>;
    socialLinks: Schema.Attribute.Component<'shared.logo', true>;
    text: Schema.Attribute.Text;
  };
}

export interface LayoutHeader extends Struct.ComponentSchema {
  collectionName: 'components_layout_headers';
  info: {
    description: '';
    displayName: 'Header';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    logo: Schema.Attribute.Component<'shared.logo', false>;
    navItems: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface SharedCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_cards';
  info: {
    displayName: 'Card';
  };
  attributes: {
    heading: Schema.Attribute.String;
    text: Schema.Attribute.Text;
  };
}

export interface SharedCommunityLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_community_links';
  info: {
    displayName: 'Community Link';
  };
  attributes: {
    description: Schema.Attribute.Text;
    href: Schema.Attribute.String;
    label: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: '';
    displayName: 'Link';
  };
  attributes: {
    href: Schema.Attribute.String;
    isButtonLink: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['PRIMARY', 'SECONDARY']>;
  };
}

export interface SharedLogo extends Struct.ComponentSchema {
  collectionName: 'components_shared_logos';
  info: {
    description: '';
    displayName: 'Logo';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    logoLink: Schema.Attribute.String;
    logoText: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.card-grid': BlocksCardGrid;
      'blocks.community-links': BlocksCommunityLinks;
      'blocks.content-with-image': BlocksContentWithImage;
      'blocks.faqs': BlocksFaqs;
      'blocks.featured-articles': BlocksFeaturedArticles;
      'blocks.featured-workshops': BlocksFeaturedWorkshops;
      'blocks.heading-section': BlocksHeadingSection;
      'blocks.hero': BlocksHero;
      'blocks.markdown': BlocksMarkdown;
      'blocks.newsletter': BlocksNewsletter;
      'blocks.person-card': BlocksPersonCard;
      'layout.banner': LayoutBanner;
      'layout.footer': LayoutFooter;
      'layout.header': LayoutHeader;
      'shared.card': SharedCard;
      'shared.community-link': SharedCommunityLink;
      'shared.link': SharedLink;
      'shared.logo': SharedLogo;
    }
  }
}
