/**
 * Vercel Serverless Function — Dynamic OpenGraph Card Generator for Social Scrapers
 * Intercepts requests from Facebook (facebookexternalhit), WhatsApp, Twitter, etc.,
 * and generates live, real-time OpenGraph metadata directly from the MongoDB database / backend API.
 */

const BASE_URL = 'https://slfm.store';
const BACKEND_API_URL = process.env.VITE_API_URL || 'https://slfm-back.onrender.com/api';

// In-memory 60-second cache to ensure lightning-fast responses while staying 100% dynamic
let memoryCache = {
  products: null,
  timestamp: 0
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fetch fresh product data dynamically from the backend (MongoDB)
 */
async function getLiveProduct(prodId) {
  if (!prodId) return null;
  const target = String(prodId).toLowerCase().trim();

  try {
    // 1. Check in-memory cache (fresh for 60 seconds)
    const isCacheFresh = memoryCache.products && (Date.now() - memoryCache.timestamp < 60000);
    let allProducts = isCacheFresh ? memoryCache.products : null;

    if (!allProducts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${BACKEND_API_URL}/products?limit=100`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        allProducts = json.products || [];
        memoryCache = {
          products: allProducts,
          timestamp: Date.now()
        };
      }
    }

    if (allProducts && allProducts.length > 0) {
      const found = allProducts.find(
        (p) =>
          String(p.productId || '').toLowerCase() === target ||
          String(p._id || '').toLowerCase() === target
      );
      if (found) {
        return {
          id: found.productId || found._id,
          name: found.name,
          price: found.price,
          description: (found.description || '').replace(/\s+/g, ' ').trim().slice(0, 250),
          image: found.image || found.image2 || (found.images && found.images[0]) || `${BASE_URL}/logos.png`
        };
      }
    }
  } catch (err) {
    console.warn('[api/og] Live backend query failed or timed out:', err.message);
  }

  // 2. Fallback catalog if backend is cold/restarting
  return FALLBACK_CATALOG[target] || null;
}

// Resilient fallback catalog in case the backend is sleeping or undergoing maintenance
const FALLBACK_CATALOG = {
  "dressing-table-4940": {
    "id": "dressing-table-4940",
    "name": "Dressing Table",
    "price": 7500,
    "description": "Elegant Melamine Board Dressing Table with stylish reddish-brown floral finish, large vanity mirror, and organizer drawers.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1793061234/shahlajuk_products/sbuk41lgorhq9vfqaxvv.jpg"
  },
  "king-size-bed-9262": {
    "id": "king-size-bed-9262",
    "name": "King size bed",
    "price": 15000,
    "description": "Stylish Melamine Board Bed with rich wood-grain finish, sleek black accents, sturdy structural frame, and lifetime warranty.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1793060386/shahlajuk_products/i4kh2p3gy7plberrxlgd.jpg"
  },
  "reading-table-1650": {
    "id": "reading-table-1650",
    "name": "Reading Table",
    "price": 6500,
    "description": "Melamine Board Collapsible Reading Table designed for compact study nooks, home workstations, and laptops.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1793059809/shahlajuk_products/s1hyknxnvsjclkolpr57.jpg"
  },
  "modern-elegance-wardrobe-0852": {
    "id": "modern-elegance-wardrobe-0852",
    "name": "Two part Almirah",
    "price": 14000,
    "description": "Modern Elegance Wardrobe with dual compartments, dark wood grain finish, and soft-close hardware.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1792177535/shahlajuk_products/tstumspcbwgedfa6a5bt.jpg"
  },
  "micro-cabinet-8551": {
    "id": "micro-cabinet-8551",
    "name": "Book Shelf",
    "price": 8500,
    "description": "Premium multi-shelf bookcase and display unit for books, collectibles, and decor.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1792176988/shahlajuk_products/ufjfdfozmv9gtf78diuy.jpg"
  },
  "missef-9153": {
    "id": "missef-9153",
    "name": "Mistsef [Melamine Board]",
    "price": 9500,
    "description": "Modern Teak-Finish Kitchen Pantry Cabinet and dining hutch with spacious storage shelving.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1792176208/shahlajuk_products/z70ozbclif8ynsphgnjr.jpg"
  },
  "corne-rack-decorative-2854": {
    "id": "corne-rack-decorative-2854",
    "name": "Corne Rack Decorative",
    "price": 3500,
    "description": "Modern Wavy 5-Tier Corner Bookshelf maximizing underutilized corner spaces in living rooms and bedrooms.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1792176055/shahlajuk_products/qd2du9k1zsawttbinvvm.jpg"
  },
  "elegant-wooden-dressing-table-with-storage-mirror-2857": {
    "id": "elegant-wooden-dressing-table-with-storage-mirror-2857",
    "name": "Elegant Wooden Dressing Table with Storage & Mirror",
    "price": 8500,
    "description": "Elevate your morning routine with our all-in-one vanity unit featuring large mirror and concealed storage.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1790956026/shahlajuk_products/yc0gj9mf7ewyxbgqsa48.jpg"
  },
  "tower-almirah-9642": {
    "id": "tower-almirah-9642",
    "name": "Tower Almirah",
    "price": 7800,
    "description": "Modern Single-Door Wooden Tower Almirah with vertical space-saving footprint and secure lock.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1790955704/shahlajuk_products/m56snkxyi4ijpirq0hvu.jpg"
  },
  "bedside-table-c1-1074": {
    "id": "bedside-table-c1-1074",
    "name": "Bedside Table -C1",
    "price": 3800,
    "description": "Modern 3-Drawer Wooden Bedside Table with smooth sliding rails and lockable upper drawer.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1790954950/shahlajuk_products/dry8ko6nfzp58h33oodd.jpg"
  },
  "floral-vine-wardrobe-dressing-0127": {
    "id": "floral-vine-wardrobe-dressing-0127",
    "name": "Floral Vine Wardrobe Dressing",
    "price": 16500,
    "description": "Premium 3.5ft x 6ft Floral Almirah & Dressing Wardrobe with arched full-height mirror and metallic gold botanical print.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1790953066/shahlajuk_products/v6upskgpr7imxcuvow3f.jpg"
  },
  "wall-shelf-5595": {
    "id": "wall-shelf-5595",
    "name": "Wall Shelf",
    "price": 4300,
    "description": "Heavy-Duty Melamine Floating Wall Shelf with invisible mounting profile and stain-resistant coating.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1790594267/shahlajuk_products/xgue7dpwdcd6df2jf4vq.png"
  },
  "wardrobe-9946": {
    "id": "wardrobe-9946",
    "name": "Wardrobe",
    "price": 14200,
    "description": "Spacious two-door Melamine board wardrobe with hanging rod and interior compartments.",
    "image": "https://res.cloudinary.com/rsn4xckc/image/upload/v1790587607/shahlajuk_products/u0mtmgzvfu8gzcedw7cm.jpg"
  }
};

export default async function handler(req, res) {
  const prodId = req.query.product || req.query.id;
  const canonicalUrl = prodId ? `${BASE_URL}/?product=${encodeURIComponent(prodId)}` : `${BASE_URL}/`;

  // Dynamically fetch product from live MongoDB backend API
  let product = null;
  if (prodId) {
    product = await getLiveProduct(prodId);
  }

  // Fallback if product is not found or not specified
  if (!product) {
    product = {
      name: 'ShahLajuk Furniture Mart — Premium Board & Solid Wood Furniture',
      price: null,
      description: 'Handcrafted, modern and minimalist furniture for your home and office in Bangladesh. Explore beds, dining tables, wardrobes, workstations, and custom decor.',
      image: `${BASE_URL}/logos.png`
    };
  }

  const title = `${product.name} | ShahLajuk Furniture Mart`;
  const pricePrefix = product.price ? `৳${Number(product.price).toLocaleString('en-IN')} — ` : '';
  const description = `${pricePrefix}${product.description}`.slice(0, 290);
  const imageUrl = product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="ShahLajuk Furniture Mart">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(product.name)}">
  ${product.price ? `<meta property="product:price:amount" content="${escapeHtml(product.price)}">` : ''}
  <meta property="product:price:currency" content="BDT">
  <meta property="product:availability" content="in stock">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(product.name)}">

  <!-- Instant Browser Redirect for Real Users -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px; text-align: center; background: #fafaf9; color: #1c1917;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <h1 style="font-size: 1.5rem; margin-bottom: 12px;">${escapeHtml(product.name)}</h1>
    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px; max-height: 400px; object-fit: cover;" />
    ${product.price ? `<p style="font-size: 1.3rem; font-weight: bold; color: #b45309; margin-bottom: 12px;">৳${Number(product.price).toLocaleString('en-IN')}</p>` : ''}
    <p style="color: #57534e; line-height: 1.5; margin-bottom: 20px;">${escapeHtml(product.description)}</p>
    <a href="${escapeHtml(canonicalUrl)}" style="display: inline-block; background: #b45309; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View on ShahLajuk Store</a>
  </div>
  <script>
    if (window.location.href !== "${escapeHtml(canonicalUrl)}") {
      window.location.replace("${escapeHtml(canonicalUrl)}");
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(html);
}
