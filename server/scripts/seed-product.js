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
        action: `api::product.product.${action}`,
        role: publicRole.id,
      },
    });
  }

  // 2. Download and upload placeholder images
  const tmpDir = path.join(__dirname, '..', '.tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const imageConfigs = [
    // Outerwear
    { url: 'https://picsum.photos/seed/waxed-jacket/800/1000', name: 'waxed-jacket.jpg' },
    { url: 'https://picsum.photos/seed/quilted-vest/800/1000', name: 'quilted-vest.jpg' },
    { url: 'https://picsum.photos/seed/wool-overcoat/800/1000', name: 'wool-overcoat.jpg' },
    { url: 'https://picsum.photos/seed/rain-shell/800/1000', name: 'rain-shell.jpg' },
    // Tops
    { url: 'https://picsum.photos/seed/linen-shirt/800/1000', name: 'linen-shirt.jpg' },
    { url: 'https://picsum.photos/seed/pocket-tee/800/1000', name: 'pocket-tee.jpg' },
    { url: 'https://picsum.photos/seed/merino-sweater/800/1000', name: 'merino-sweater.jpg' },
    { url: 'https://picsum.photos/seed/camp-collar/800/1000', name: 'camp-collar.jpg' },
    // Bottoms
    { url: 'https://picsum.photos/seed/selvedge-jean/800/1000', name: 'selvedge-jean.jpg' },
    { url: 'https://picsum.photos/seed/wide-trouser/800/1000', name: 'wide-trouser.jpg' },
    { url: 'https://picsum.photos/seed/cargo-pant/800/1000', name: 'cargo-pant.jpg' },
    { url: 'https://picsum.photos/seed/linen-short/800/1000', name: 'linen-short.jpg' },
    // Accessories
    { url: 'https://picsum.photos/seed/leather-belt/800/1000', name: 'leather-belt.jpg' },
    { url: 'https://picsum.photos/seed/canvas-tote/800/1000', name: 'canvas-tote.jpg' },
    { url: 'https://picsum.photos/seed/wool-beanie/800/1000', name: 'wool-beanie.jpg' },
    { url: 'https://picsum.photos/seed/silk-scarf/800/1000', name: 'silk-scarf.jpg' },
  ];

  const uploadedImages = [];
  for (const img of imageConfigs) {
    const filepath = path.join(tmpDir, img.name);
    await downloadImage(img.url, filepath);
    const uploaded = await uploadImage(app, filepath, img.name);
    uploadedImages.push(uploaded);
    fs.unlinkSync(filepath);
  }

  // 3. Create product entries
  const entries = [
    // Outerwear
    {
      title: 'Waxed Canvas Field Jacket',
      slug: 'waxed-canvas-field-jacket',
      description: 'Built from heavyweight British Millerain waxed cotton with a moleskin-lined collar. Four front patch pockets, adjustable cuffs, and a two-way brass zipper. Develops a rich patina over time — every jacket ages uniquely to its owner.',
      price: 245,
      category: 'outerwear',
      material: 'Waxed Cotton / Brass Hardware',
      image: uploadedImages[0].id,
    },
    {
      title: 'Quilted Liner Vest',
      slug: 'quilted-liner-vest',
      description: 'A diamond-quilted vest with recycled Primaloft insulation. Snaps into any of our shell jackets or wears solo as a midlayer. Lightweight enough to pack into its own pocket.',
      price: 165,
      category: 'outerwear',
      material: 'Recycled Nylon / Primaloft',
      image: uploadedImages[1].id,
    },
    {
      title: 'Oversized Wool Overcoat',
      slug: 'oversized-wool-overcoat',
      description: 'An intentionally oversized silhouette in double-faced Italian wool. Drop shoulders, hidden snap closure, and deep welt pockets. The kind of coat that makes everything underneath look better.',
      price: 389,
      category: 'outerwear',
      material: 'Italian Double-Face Wool',
      image: uploadedImages[2].id,
    },
    {
      title: 'Technical Rain Shell',
      slug: 'technical-rain-shell',
      description: 'Three-layer waterproof breathable fabric with fully taped seams. Pit zips for ventilation, adjustable hood with laminated brim, and a clean silhouette that works off the trail too.',
      price: 195,
      category: 'outerwear',
      material: '3L Waterproof Breathable Nylon',
      image: uploadedImages[3].id,
    },
    // Tops
    {
      title: 'Indigo Dyed Linen Shirt',
      slug: 'indigo-dyed-linen-shirt',
      description: 'Hand-dipped in natural indigo three times for a deep, living color that fades beautifully with each wash. Relaxed fit with a camp collar and coconut shell buttons. Gets better every time you wear it.',
      price: 128,
      category: 'tops',
      material: 'French Linen',
      image: uploadedImages[4].id,
    },
    {
      title: 'Heavyweight Pocket Tee',
      slug: 'heavyweight-pocket-tee',
      description: 'Cut from 8oz tubular-knit cotton jersey — the kind of t-shirt your grandfather wore. No side seams, no shrinkage, no pilling. A single chest pocket sits at the perfect height. Buy three.',
      price: 68,
      category: 'tops',
      material: '8oz Tubular-Knit Cotton',
      image: uploadedImages[5].id,
    },
    {
      title: 'Merino Crew Sweater',
      slug: 'merino-crew-sweater',
      description: 'Knitted in a family-run mill in the Scottish Borders from extra-fine 17.5 micron merino. Naturally temperature-regulating, odor-resistant, and impossibly soft against skin. Saddle shoulders for durability.',
      price: 185,
      category: 'tops',
      material: 'Extra-Fine Scottish Merino',
      image: uploadedImages[6].id,
    },
    {
      title: 'Camp Collar Print Shirt',
      slug: 'camp-collar-print-shirt',
      description: 'A boxy camp collar shirt in a custom botanical print designed by Portland illustrator Keiko Tanaka. Printed on lightweight Tencel twill for a fluid drape. Limited run of 200 pieces.',
      price: 142,
      category: 'tops',
      material: 'Tencel Twill',
      image: uploadedImages[7].id,
    },
    // Bottoms
    {
      title: 'Selvedge Straight Jean',
      slug: 'selvedge-straight-jean',
      description: 'Woven on vintage shuttle looms in Okayama, Japan. 14oz raw selvedge denim with a straight leg and mid-rise. Comes unwashed — the fades you earn are the fades you keep.',
      price: 198,
      category: 'bottoms',
      material: '14oz Japanese Selvedge Denim',
      image: uploadedImages[8].id,
    },
    {
      title: 'Pleated Wide Trouser',
      slug: 'pleated-wide-trouser',
      description: 'Double forward pleats and a generous wide leg in a seasonless tropical wool. High waist with side tabs for a clean, beltless look. Equally at home with loafers or sneakers.',
      price: 175,
      category: 'bottoms',
      material: 'Tropical Wool Blend',
      image: uploadedImages[9].id,
    },
    {
      title: 'Ripstop Cargo Pant',
      slug: 'ripstop-cargo-pant',
      description: 'Updated cargo pants in garment-dyed ripstop cotton. Slim-tapered leg with articulated knees and six pockets that actually lie flat. An elastic waistband hidden inside the traditional waistband.',
      price: 155,
      category: 'bottoms',
      material: 'Garment-Dyed Ripstop Cotton',
      image: uploadedImages[10].id,
    },
    {
      title: 'Drawstring Linen Short',
      slug: 'drawstring-linen-short',
      description: 'A 7-inch inseam short in washed European linen with an internal drawstring and elasticated back waist. Pre-washed so there\'s zero break-in period. The perfect warm-weather bottom.',
      price: 95,
      category: 'bottoms',
      material: 'Washed European Linen',
      image: uploadedImages[11].id,
    },
    // Accessories
    {
      title: 'Vegetable-Tan Leather Belt',
      slug: 'vegetable-tan-leather-belt',
      description: 'Full-grain leather tanned over six weeks using oak bark — no chemicals, no shortcuts. Solid brass roller buckle. Starts honey-blonde and deepens to a rich amber with wear.',
      price: 85,
      category: 'accessories',
      material: 'Oak Bark-Tanned Leather / Brass',
      image: uploadedImages[12].id,
    },
    {
      title: 'Waxed Canvas Tote Bag',
      slug: 'waxed-canvas-tote-bag',
      description: 'An everyday carry-all in waxed cotton canvas with bridle leather handles and a brass key clip. Unlined for a broken-in feel from day one. Fits a 15" laptop flat against the back.',
      price: 95,
      category: 'accessories',
      material: 'Waxed Cotton / Bridle Leather',
      image: uploadedImages[13].id,
    },
    {
      title: 'Wool Fisherman Beanie',
      slug: 'wool-fisherman-beanie',
      description: 'Knitted in a ribbed fisherman stitch from undyed Donegal wool — flecked with natural color variations unique to each skein. Short cuff, unstructured crown. One size fits most.',
      price: 48,
      category: 'accessories',
      material: 'Undyed Donegal Wool',
      image: uploadedImages[14].id,
    },
    {
      title: 'Silk-Blend Scarf',
      slug: 'silk-blend-scarf',
      description: 'A generous scarf in a silk-cashmere blend with hand-rolled edges. Abstract jacquard pattern inspired by brutalist architecture. Lightweight enough for spring, warm enough for autumn.',
      price: 78,
      category: 'accessories',
      material: 'Silk-Cashmere Blend',
      image: uploadedImages[15].id,
    },
  ];

  for (const entry of entries) {
    await app.documents('api::product.product').create({
      data: entry,
      status: 'published',
    });
  }

  // 4. Add navigation link
  const global = await app.documents('api::global.global').findFirst({
    populate: { header: { populate: { logo: true, navItems: true, cta: true } } },
  });

  if (global) {
    const existingNavItems = global.header?.navItems || [];
    if (!existingNavItems.some((item) => item.href === '/products')) {
      await app.documents('api::global.global').update({
        documentId: global.documentId,
        data: {
          header: {
            ...global.header,
            navItems: [
              ...existingNavItems,
              { href: '/products', label: 'Products', isExternal: false, isButtonLink: false },
            ],
          },
        },
        status: 'published',
      });
      console.log('Added "Products" link to global navigation.');
    }
  }

  console.log(`Seeded ${entries.length} product entries with public permissions.`);
  await app.destroy();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
