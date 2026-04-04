const { createStrapi, compileStrapi } = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => { file.close(); resolve(filepath); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(filepath); });
      }
    }).on('error', reject);
  });
}

async function uploadImage(app, filepath, name) {
  const file = {
    filepath,
    originalFilename: name,
    mimetype: 'image/jpeg',
    size: fs.statSync(filepath).size,
  };
  const [uploaded] = await app.plugin('upload').service('upload').upload({
    data: {},
    files: file,
  });
  return uploaded;
}

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  // 1. Download and upload placeholder image for hero
  const tmpDir = path.join(__dirname, '..', '.tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const heroImgPath = path.join(tmpDir, 'community-hero.jpg');
  await downloadImage('https://picsum.photos/seed/community-hero/800/600', heroImgPath);
  const heroImage = await uploadImage(app, heroImgPath, 'community-hero.jpg');
  fs.unlinkSync(heroImgPath);

  // 2. Get all workshop IDs for the featured-workshops block
  const workshops = await app.documents('api::workshop.workshop').findMany({
    status: 'published',
  });

  const workshopIds = workshops.map((w) => w.id);

  // 3. Delete existing community page if it exists
  const existing = await app.documents('api::page.page').findMany({
    filters: { slug: 'community' },
  });
  for (const entry of existing) {
    await app.documents('api::page.page').delete({ documentId: entry.documentId });
  }

  // 4. Create the community page as a Page entry with blocks
  await app.documents('api::page.page').create({
    data: {
      title: 'Community',
      slug: 'community',
      description: 'Join our community of developers, designers, and content creators.',
      blocks: [
        {
          __component: 'blocks.hero',
          heading: 'Join Our Community',
          text: 'We believe the best software is built in the open. Our community brings together developers, designers, and content creators who share a passion for building great experiences with Astro and Strapi.',
          image: heroImage.id,
          links: [
            { href: 'https://github.com/withastro/astro', label: 'Astro GitHub', isExternal: true, type: 'PRIMARY' },
            { href: 'https://github.com/strapi/strapi', label: 'Strapi GitHub', isExternal: true, type: 'SECONDARY' },
          ],
        },
        {
          __component: 'blocks.heading-section',
          heading: 'Why Join?',
          subHeading: 'Benefits',
        },
        {
          __component: 'blocks.card-grid',
          card: [
            {
              heading: 'Open Source First',
              text: 'Both Astro and Strapi are open source. Contribute code, report issues, or help with documentation — every contribution matters.',
            },
            {
              heading: 'Learn Together',
              text: 'From beginner tutorials to advanced architecture discussions, the community is the best place to level up your skills.',
            },
            {
              heading: 'Ship Faster',
              text: 'Get help when you\'re stuck, share reusable patterns, and discover plugins and integrations built by the community.',
            },
            {
              heading: 'Shape the Roadmap',
              text: 'Community feedback directly influences what gets built next. Your voice matters in RFCs, discussions, and feature requests.',
            },
          ],
        },
        {
          __component: 'blocks.community-links',
          heading: 'Get Involved',
          link: [
            {
              title: 'Astro on GitHub',
              description: 'Star the repo, browse issues, or contribute to the Astro framework.',
              href: 'https://github.com/withastro/astro',
              label: 'github.com/withastro/astro',
            },
            {
              title: 'Strapi on GitHub',
              description: 'Explore the Strapi codebase, open issues, or submit pull requests.',
              href: 'https://github.com/strapi/strapi',
              label: 'github.com/strapi/strapi',
            },
            {
              title: 'Astro Discord',
              description: 'Join thousands of Astro developers for real-time help and discussion.',
              href: 'https://astro.build/chat',
              label: 'astro.build/chat',
            },
            {
              title: 'Strapi Discord',
              description: 'Connect with the Strapi community for support, showcases, and feedback.',
              href: 'https://discord.strapi.io',
              label: 'discord.strapi.io',
            },
          ],
        },
        {
          __component: 'blocks.featured-workshops',
          workshops: workshopIds,
        },
      ],
    },
    status: 'published',
  });

  // 4. Add navigation link
  const global = await app.documents('api::global.global').findFirst({
    populate: { header: { populate: { logo: true, navItems: true, cta: true } } },
  });

  if (global) {
    const existingNavItems = global.header?.navItems || [];
    if (!existingNavItems.some((item) => item.href === '/community')) {
      await app.documents('api::global.global').update({
        documentId: global.documentId,
        data: {
          header: {
            ...global.header,
            navItems: [
              ...existingNavItems,
              { href: '/community', label: 'Community', isExternal: false, isButtonLink: false },
            ],
          },
        },
        status: 'published',
      });
      console.log('Added "Community" link to global navigation.');
    }
  }

  console.log('Seeded community page with blocks and public permissions.');
  await app.destroy();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
