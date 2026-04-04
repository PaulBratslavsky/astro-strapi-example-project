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

  // 1. Set public permissions
  const publicRole = await app.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  for (const action of ['find', 'findOne']) {
    await app.query('plugin::users-permissions.permission').create({
      data: {
        action: `api::workshop.workshop.${action}`,
        role: publicRole.id,
      },
    });
  }

  // 2. Download and upload placeholder images
  const tmpDir = path.join(__dirname, '..', '.tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const imageConfigs = [
    { url: 'https://picsum.photos/seed/webdev-workshop/800/600', name: 'webdev-workshop.jpg' },
    { url: 'https://picsum.photos/seed/design-systems-class/800/600', name: 'design-systems-class.jpg' },
    { url: 'https://picsum.photos/seed/api-architecture/800/600', name: 'api-architecture.jpg' },
  ];

  const uploadedImages = [];
  for (const img of imageConfigs) {
    const filepath = path.join(tmpDir, img.name);
    await downloadImage(img.url, filepath);
    const uploaded = await uploadImage(app, filepath, img.name);
    uploadedImages.push(uploaded);
    fs.unlinkSync(filepath);
  }

  // 3. Create workshop entries
  const entries = [
    {
      title: 'Modern Web Development Fundamentals',
      slug: 'modern-web-development-fundamentals',
      description: 'Start your web development journey with HTML, CSS, and JavaScript. Build real projects from day one with hands-on exercises and mentor support.',
      instructor: 'Sarah Chen',
      skillLevel: 'beginner',
      duration: '8 hours',
      date: '2026-05-20T09:00:00.000Z',
      price: 0,
      coverImage: uploadedImages[0].id,
      learningOutcomes: '<ul><li>Write semantic HTML and accessible markup</li><li>Style layouts with modern CSS (Flexbox, Grid)</li><li>Add interactivity with vanilla JavaScript</li><li>Deploy your first site to the web</li></ul>',
    },
    {
      title: 'Design Systems in Practice',
      slug: 'design-systems-in-practice',
      description: 'Bridge design and engineering with tokens, components, and documentation. Learn to build a design system that scales across teams and products.',
      instructor: 'Priya Patel',
      skillLevel: 'intermediate',
      duration: '6 hours',
      date: '2026-06-12T10:00:00.000Z',
      price: 199.00,
      coverImage: uploadedImages[1].id,
      learningOutcomes: '<ul><li>Define and manage design tokens (colors, spacing, typography)</li><li>Build a component library with variants and states</li><li>Write documentation that designers and engineers actually use</li><li>Set up a contribution workflow for cross-team adoption</li></ul>',
    },
    {
      title: 'Advanced API Architecture',
      slug: 'advanced-api-architecture',
      description: 'Design APIs that scale. Covers REST best practices, GraphQL trade-offs, rate limiting, versioning strategies, and real-world patterns from high-traffic systems.',
      instructor: 'Marcus Rivera',
      skillLevel: 'advanced',
      duration: '10 hours',
      date: '2026-07-08T09:00:00.000Z',
      price: 349.00,
      coverImage: uploadedImages[2].id,
      learningOutcomes: '<ul><li>Design resource-oriented REST APIs with proper status codes and pagination</li><li>Evaluate when GraphQL adds value vs. complexity</li><li>Implement rate limiting, caching, and circuit breakers</li><li>Plan API versioning and deprecation strategies</li><li>Handle authentication and authorization at the API gateway level</li></ul>',
    },
  ];

  const createdWorkshops = [];
  for (const entry of entries) {
    const created = await app.documents('api::workshop.workshop').create({
      data: entry,
      status: 'published',
    });
    createdWorkshops.push(created);
  }

  // 4. Add navigation link
  const global = await app.documents('api::global.global').findFirst({
    populate: { header: { populate: { logo: true, navItems: true, cta: true } } },
  });

  if (global) {
    const existingNavItems = global.header?.navItems || [];
    if (!existingNavItems.some((item) => item.href === '/workshops')) {
      await app.documents('api::global.global').update({
        documentId: global.documentId,
        data: {
          header: {
            ...global.header,
            navItems: [
              ...existingNavItems,
              { href: '/workshops', label: 'Workshops', isExternal: false, isButtonLink: false },
            ],
          },
        },
        status: 'published',
      });
      console.log('Added "Workshops" link to global navigation.');
    }
  }

  console.log(`Seeded ${entries.length} workshop entries with public permissions.`);
  await app.destroy();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
