# SEO Implementation Guide for SomaParts

## ✅ What's Been Implemented

### 1. Core SEO Infrastructure

- **Comprehensive Metadata Configuration** (`lib/metadata.ts`)
  - Default site metadata with Open Graph and Twitter Cards
  - Helper functions for generating page-specific metadata
  - Structured data (JSON-LD) generators for rich snippets

### 2. Root Layout Enhancements

- Updated `app/layout.tsx` with:
  - Complete metadata including keywords, authors, and descriptions
  - Open Graph tags for social media sharing
  - Twitter Card configuration
  - Proper viewport settings for mobile
  - Organization and Website structured data

### 3. SEO Files

- **`public/manifest.json`** - PWA configuration
- **`public/robots.txt`** - Search engine crawler rules
- **`app/sitemap.ts`** - Dynamic sitemap generator

### 4. Components

- **`StructuredData.tsx`** - Reusable component for injecting JSON-LD

### 5. Documentation

- **`docs/SEO_IMAGES_GUIDE.md`** - Guide for creating SEO images
- **`docs/PRODUCT_PAGE_SEO_EXAMPLE.tsx`** - Example implementation
- **`.env.seo.example`** - Environment variables template

## 🔧 Next Steps to Complete SEO Setup

### Step 1: Add Base URL to Environment Variables

```bash
# Add to .env.local
NEXT_PUBLIC_BASE_URL=https://somaparts.com  # Replace with your actual domain
```

### Step 2: Create Required Images

You need to create these images (see `docs/SEO_IMAGES_GUIDE.md` for details):

1. **`public/og-image.png`** (1200x630) - Social media preview
2. **`public/twitter-image.png`** (1200x630) - Twitter preview
3. **`public/icon-192.png`** (192x192) - PWA icon
4. **`public/icon-512.png`** (512x512) - PWA icon
5. **`public/apple-icon.png`** (180x180) - iOS icon
6. **`public/favicon.ico`** (32x32) - Browser tab icon

**Quick Option**: Use your existing logos:

```bash
# You can resize spartpartslogo-01.png or spartpartslogo-02.png
# Using online tools like https://favicon.io/ or https://squoosh.app/
```

### Step 3: Add Metadata to Product Pages

Since your product page is a client component, you have two options:

#### Option A: Convert to Server Component (Recommended for SEO)

1. Remove `"use client"` from the product page
2. Add `generateMetadata` function (see example in `docs/PRODUCT_PAGE_SEO_EXAMPLE.tsx`)
3. Fetch data server-side
4. Add `<StructuredData>` component

#### Option B: Keep as Client Component

Create a parent layout for products:

```tsx
// app/(customer)/products/[slug]/layout.tsx
import { generateProductMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }) {
  // Fetch product and return metadata
  // See example in docs/PRODUCT_PAGE_SEO_EXAMPLE.tsx
}

export default function ProductLayout({ children }) {
  return children;
}
```

### Step 4: Add Metadata to Other Pages

Apply similar patterns to:

- **Category pages**: Use `generateCategoryMetadata()`
- **Store pages**: Use `generateStoreMetadata()`
- **Static pages** (About, Contact): Add metadata directly

Example for a static page:

```tsx
// app/about/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about SomaParts...",
};
```

### Step 5: Verify SEO Implementation

1. **Build and test locally**:

   ```bash
   npm run build
   npm start
   ```

2. **Check metadata in browser**:
   - View page source (Ctrl+U)
   - Look for `<meta>` tags in `<head>`
   - Verify JSON-LD scripts

3. **Test social sharing**:
   - [Facebook Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Inspector](https://www.linkedin.com/post-inspector/)

4. **Validate structured data**:
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema Markup Validator](https://validator.schema.org/)

5. **Check sitemap**:
   - Visit `http://localhost:3000/sitemap.xml`
   - Verify all URLs are included

### Step 6: Google Search Console Setup

1. **Get verification code**:
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Add your property
   - Get HTML tag verification code

2. **Add to metadata**:

   ```typescript
   // In lib/metadata.ts, update:
   verification: {
     google: 'your-actual-verification-code',
   }
   ```

3. **Submit sitemap**:
   - In Search Console, go to Sitemaps
   - Submit: `https://yourdomain.com/sitemap.xml`

### Step 7: Optional Enhancements

#### Analytics

```bash
# Add to .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Then create `components/analytics/GoogleAnalytics.tsx`:

```tsx
import Script from "next/script";

export default function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
```

#### Breadcrumbs with Structured Data

```tsx
import { generateBreadcrumbSchema } from "@/lib/metadata";

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Products", url: "/products" },
  { name: product.name, url: `/products/${product.slug}` },
];

<StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />;
```

## 📊 SEO Checklist

- [x] Root layout metadata configured
- [x] Open Graph tags added
- [x] Twitter Cards configured
- [x] Structured data (JSON-LD) implemented
- [x] Sitemap generator created
- [x] Robots.txt configured
- [x] PWA manifest created
- [ ] Base URL environment variable added
- [ ] SEO images created and added
- [ ] Product page metadata implemented
- [ ] Category page metadata implemented
- [ ] Store page metadata implemented
- [ ] Google Search Console verified
- [ ] Sitemap submitted to Google
- [ ] Social sharing tested
- [ ] Structured data validated

## 🎯 Expected SEO Benefits

1. **Better Search Rankings**: Comprehensive metadata helps Google understand your content
2. **Rich Snippets**: Product structured data can show prices, ratings, and availability in search results
3. **Social Sharing**: Attractive previews when shared on Facebook, Twitter, LinkedIn
4. **Mobile Experience**: PWA support for installable app experience
5. **Crawlability**: Proper sitemap and robots.txt guide search engines
6. **User Trust**: Professional appearance in search results and social media

## 📚 Resources

- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
