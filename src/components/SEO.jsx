import { useEffect } from 'react';
import { applySEO } from '../utils/seo';

/**
 * Modular SEO & OpenGraph Meta Tag Component
 * 
 * Drop into any page or view:
 * <SEO 
 *   title="Modern Teak Bed"
 *   description="Solid handcrafted timber bed with soft-close joints."
 *   image="https://res.cloudinary.com/..."
 *   type="product"
 *   price={28000}
 * />
 */
export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  price,
  category,
  keywords,
  siteName
}) {
  useEffect(() => {
    applySEO({
      title,
      description,
      image,
      url,
      type,
      price,
      category,
      keywords,
      siteName
    });
  }, [title, description, image, url, type, price, category, keywords, siteName]);

  return null;
}

export function useSEO(options) {
  useEffect(() => {
    applySEO(options);
  }, [
    options?.title,
    options?.description,
    options?.image,
    options?.url,
    options?.type,
    options?.price
  ]);
}

export default SEO;
