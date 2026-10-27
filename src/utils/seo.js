/**
 * ShahLajuk Furniture Mart - Modular OpenGraph & SEO Meta Manager
 * 
 * Dynamically updates document title, standard meta, Facebook OpenGraph (og:),
 * and Twitter Card tags in the browser <head> for each page/product view.
 */

const DEFAULT_SITE_NAME = 'ShahLajuk Furniture Mart';
const DEFAULT_TITLE = 'ShahLajuk Furniture Mart — Artisanal Timber & Modern Interior Design';
const DEFAULT_DESCRIPTION = 'Discover premium handcrafted solid wood & board furniture in Bangladesh. Living room, bedroom, dining, and custom editorial furniture.';
const DEFAULT_TYPE = 'website';

/**
 * Ensures an image URL is fully qualified with origin (required by Facebook & social crawlers)
 */
export function getAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/logos.png`;
    }
    return 'https://slfm.store/logos.png';
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  if (typeof window !== 'undefined') {
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${window.location.origin}${cleanPath}`;
  }

  return `https://slfm.store${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

/**
 * Creates or updates a <meta> tag by its attribute name ('property' or 'name')
 */
export function setMetaTag(attributeName, attributeValue, content) {
  if (typeof document === 'undefined') return;

  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!content) {
    if (element) {
      element.remove();
    }
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', String(content).trim());
}

/**
 * Creates or updates the <link rel="canonical"> tag
 */
export function setCanonicalUrl(url) {
  if (typeof document === 'undefined') return;

  let link = document.querySelector('link[rel="canonical"]');
  if (!url) {
    if (link) link.remove();
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Applies a complete set of SEO, OpenGraph, and Twitter Card tags
 */
export function applySEO(options = {}) {
  if (typeof document === 'undefined') return;

  const {
    title,
    description,
    image,
    url,
    type = DEFAULT_TYPE,
    price,
    category,
    keywords,
    siteName = DEFAULT_SITE_NAME
  } = options;

  // 1. Page Title
  const formattedTitle = title
    ? (title.includes(DEFAULT_SITE_NAME) ? title : `${title} — ${DEFAULT_SITE_NAME}`)
    : DEFAULT_TITLE;
  document.title = formattedTitle;

  // 2. Canonical URL
  const absoluteUrl = url ? getAbsoluteUrl(url) : (typeof window !== 'undefined' ? window.location.href : 'https://shahlajuk.com');
  setCanonicalUrl(absoluteUrl);

  // 3. Standard Meta Description & Keywords
  const finalDesc = description || DEFAULT_DESCRIPTION;
  setMetaTag('name', 'description', finalDesc);
  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }

  // 4. OpenGraph (Facebook, WhatsApp, LinkedIn, Messenger)
  setMetaTag('property', 'og:site_name', siteName);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:title', formattedTitle);
  setMetaTag('property', 'og:description', finalDesc);
  setMetaTag('property', 'og:url', absoluteUrl);

  const absoluteImageUrl = getAbsoluteUrl(image);
  setMetaTag('property', 'og:image', absoluteImageUrl);
  setMetaTag('property', 'og:image:secure_url', absoluteImageUrl);
  setMetaTag('property', 'og:image:alt', title || DEFAULT_SITE_NAME);
  setMetaTag('property', 'og:image:width', '1200');
  setMetaTag('property', 'og:image:height', '630');

  // Product specific OpenGraph extensions
  if (type === 'product' && price) {
    setMetaTag('property', 'product:price:amount', String(price));
    setMetaTag('property', 'product:price:currency', 'BDT');
    if (category) {
      setMetaTag('property', 'product:category', category);
    }
  } else {
    setMetaTag('property', 'product:price:amount', null);
    setMetaTag('property', 'product:price:currency', null);
    setMetaTag('property', 'product:category', null);
  }

  // 5. Twitter Card Meta
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', formattedTitle);
  setMetaTag('name', 'twitter:description', finalDesc);
  setMetaTag('name', 'twitter:image', absoluteImageUrl);
}
