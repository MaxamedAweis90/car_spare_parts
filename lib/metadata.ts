import { Metadata } from "next";

// Base URL for the application
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://somaparts.com";
export const SITE_NAME = "SomaParts";
export const SITE_DESCRIPTION =
  "Premium car spare parts marketplace in Somalia. Find quality auto parts, accessories, and components for all vehicle makes and models. Fast delivery, verified sellers, and competitive prices.";

// Default metadata configuration
export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} - Premium Car Spare Parts Marketplace`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "car spare parts",
    "auto parts Somalia",
    "vehicle parts",
    "car accessories",
    "automotive parts",
    "car components",
    "spare parts marketplace",
    "SomaParts",
    "car parts online",
    "vehicle accessories",
    "brake parts",
    "engine parts",
    "transmission parts",
    "suspension parts",
    "electrical parts",
    "body parts",
    // Core Somali phrases (very common)
    "qalabka baabuurka",
    "qalabka gaariga",
    "qalab baabuur",
    "qeybaha baabuurka",
    "qeybaha gaariga",
    "qalabka gawaarida",
    "qalabka auto",
    "spare parts baabuur",
    "baabuur parts",

    // Buying / selling intent (important)
    "iibinta qalabka baabuurka",
    "iibso qalabka baabuurka",
    "somalia car selling",
    "somalia car parts selling",
    "car selling somalia",
    "gaariga iib ah",
    "baabuur iib ah",
    "qalab baabuur iib ah",
    "spare parts iib ah",
    "auto parts iib ah",

    // Marketplace / online behavior
    "suuqa qalabka baabuurka",
    "suuqa spare parts",
    "online qalabka baabuurka",
    "somalia auto market",
    "baabuur online lagu iibiyo",
    "gaari parts online",
    "somali car marketplace",

    // Common part-specific Somali searches
    "batari baabuur",
    "baytari gaari",
    "taayir baabuur",
    "tayar baabuur",
    "brake baabuur",
    "brake pad baabuur",
    "matoor baabuur",
    "engine baabuur",
    "gear baabuur",
    "radiator baabuur",
    "shock baabuur",
    "suspension baabuur",
    "koronto baabuur",
    "nalalka baabuurka",
    "filters baabuur",

    // Location-driven (high conversion)
    "qalabka baabuurka Muqdisho",
    "auto parts Muqdisho",
    "qalabka baabuurka Hargeisa",
    "auto parts Hargeisa",
    "qalabka baabuurka Garowe",
    "qalabka baabuurka Kismayo",
    "somalia auto parts shop",

    // Mixed Somali + English (very realistic)
    "baabuur spare parts",
    "gaari spare parts",
    "auto qalab",
    "car parts soomaaliya",
    "somalia spare parts market",
    "used car parts somalia",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Premium Car Spare Parts Marketplace`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Premium Car Spare Parts`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Premium Car Spare Parts Marketplace`,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image.png"],
    creator: "@somaparts",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual code
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: "automotive",
};

// Generate metadata for product pages
export function generateProductMetadata({
  title,
  description,
  image,
  price,
  availability,
  slug,
}: {
  title: string;
  description: string;
  image?: string;
  price?: number;
  availability?: string;
  slug: string;
}): Metadata {
  const url = `${BASE_URL}/products/${slug}`;

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 600,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate metadata for category pages
export function generateCategoryMetadata({
  name,
  description,
  slug,
}: {
  name: string;
  description?: string;
  slug: string;
}): Metadata {
  const url = `${BASE_URL}/categories/${slug}`;
  const metaDescription =
    description ||
    `Browse ${name} spare parts at ${SITE_NAME}. Quality automotive parts with fast delivery and competitive prices.`;

  return {
    title: `${name} - Car Spare Parts`,
    description: metaDescription,
    openGraph: {
      type: "website",
      url,
      title: `${name} - ${SITE_NAME}`,
      description: metaDescription,
    },
    twitter: {
      card: "summary",
      title: `${name} - ${SITE_NAME}`,
      description: metaDescription,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate metadata for seller store pages
export function generateStoreMetadata({
  name,
  description,
  avatar,
  slug,
}: {
  name: string;
  description?: string;
  avatar?: string;
  slug: string;
}): Metadata {
  const url = `${BASE_URL}/stores/${slug}`;
  const metaDescription =
    description ||
    `Shop quality car spare parts from ${name} on ${SITE_NAME}. Verified seller with competitive prices and fast delivery.`;

  return {
    title: `${name} - Seller Store`,
    description: metaDescription,
    openGraph: {
      type: "website",
      url,
      title: `${name} - ${SITE_NAME}`,
      description: metaDescription,
      images: avatar
        ? [
            {
              url: avatar,
              width: 400,
              height: 400,
              alt: name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary",
      title: `${name} - ${SITE_NAME}`,
      description: metaDescription,
      images: avatar ? [avatar] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Structured data for organization
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/spartpartslogo-01.png`,
  description: SITE_DESCRIPTION,
  sameAs: [
    // Add your social media URLs here
    // 'https://facebook.com/somaparts',
    // 'https://twitter.com/somaparts',
    // 'https://instagram.com/somaparts',
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Service",
    availableLanguage: ["English", "Somali"],
  },
};

// Structured data for website
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: BASE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// Generate structured data for products
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = "USD",
  availability,
  brand,
  sku,
  condition = "NewCondition",
}: {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency?: string;
  availability: string;
  brand?: string;
  sku?: string;
  condition?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || `${BASE_URL}/spartpartslogo-01.png`,
    brand: brand
      ? {
          "@type": "Brand",
          name: brand,
        }
      : undefined,
    sku,
    offers: {
      "@type": "Offer",
      url: BASE_URL,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability === "in_stock" ? "InStock" : "OutOfStock"}`,
      itemCondition: `https://schema.org/${condition}`,
    },
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}
