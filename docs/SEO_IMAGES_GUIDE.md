# SEO Images Guide

You'll need to create the following images for optimal SEO and social media sharing:

## Required Images

### 1. Open Graph Image (og-image.png)

- **Size**: 1200 x 630 pixels
- **Format**: PNG or JPG
- **Location**: `/public/og-image.png`
- **Purpose**: Shown when your site is shared on Facebook, LinkedIn, etc.
- **Design Tips**:
  - Use your brand colors (blue #1890ff)
  - Include "SomaParts" logo/text prominently
  - Add tagline: "Premium Car Spare Parts Marketplace"
  - Include automotive imagery (parts, tools, vehicles)
  - Keep text readable at small sizes

### 2. Twitter Card Image (twitter-image.png)

- **Size**: 1200 x 630 pixels
- **Format**: PNG or JPG
- **Location**: `/public/twitter-image.png`
- **Purpose**: Shown when your site is shared on Twitter/X
- **Design Tips**: Same as Open Graph image (can be the same file)

### 3. Apple Touch Icon (apple-icon.png)

- **Size**: 180 x 180 pixels
- **Format**: PNG
- **Location**: `/public/apple-icon.png`
- **Purpose**: iOS home screen icon when users save your site
- **Design**: Don't add rounded corners (iOS does this automatically)

### 4. Favicon (favicon.ico)

- **Size**: 32 x 32 pixels (multi-size ICO recommended)
- **Format**: ICO
- **Location**: `/public/favicon.ico`
- **Purpose**: Browser tab icon
- **Design**: Simplified version of your logo

## Quick Creation Options

### Option 1: Use Existing Logo

You already have `spartpartslogo-01.png` and `spartpartslogo-02.png` in your public folder.
You can resize these using online tools:

- https://www.iloveimg.com/resize-image
- https://squoosh.app/
- https://favicon.io/

### Option 2: Design Tools

- **Canva**: Free templates for social media images
- **Figma**: Professional design tool
- **Adobe Express**: Quick social media graphics

### Option 3: Favicon Generators

- https://favicon.io/ - Generate from text, image, or emoji
- https://realfavicongenerator.net/ - Comprehensive favicon package

## Current Status

✅ Metadata configuration ready
✅ Image paths set in metadata
⏳ Need to create/add actual image files

## Next Steps

1. Create or resize images to the specifications above
2. Save them to the `/public` folder with the exact filenames
3. Test social sharing with:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
