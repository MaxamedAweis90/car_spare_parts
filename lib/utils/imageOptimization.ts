/**
 * Image optimization and validation utilities
 */

import sharp from "sharp";

export const MAX_FILE_SIZES = {
  avatar: 5 * 1024 * 1024, // 5MB
  banner: 10 * 1024 * 1024, // 10MB
  product: 10 * 1024 * 1024, // 10MB
} as const;

export type ImageType = keyof typeof MAX_FILE_SIZES;

/**
 * Validate file size before upload
 */
export function validateFileSize(bytes: Uint8Array, type: ImageType): void {
  if (bytes.length === 0) {
    throw new Error("File is empty");
  }

  const maxSize = MAX_FILE_SIZES[type];
  if (bytes.length > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    throw new Error(
      `File too large. Maximum size for ${type} is ${maxSizeMB}MB`,
    );
  }
}

/**
 * Optimize image for web delivery
 * - Resizes to max dimensions
 * - Converts to WebP format
 * - Compresses with quality setting
 */
export async function optimizeImage(
  fileBytes: Uint8Array,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {},
): Promise<Buffer> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 85 } = options;

  try {
    const optimized = await sharp(Buffer.from(fileBytes))
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return optimized;
  } catch (error) {
    // If optimization fails, return original
    console.error("Image optimization failed:", error);
    return Buffer.from(fileBytes);
  }
}

/**
 * Optimize avatar image (smaller dimensions)
 */
export async function optimizeAvatar(fileBytes: Uint8Array): Promise<Buffer> {
  return optimizeImage(fileBytes, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 90,
  });
}

/**
 * Optimize banner image
 */
export async function optimizeBanner(fileBytes: Uint8Array): Promise<Buffer> {
  return optimizeImage(fileBytes, {
    maxWidth: 1920,
    maxHeight: 600,
    quality: 85,
  });
}

/**
 * Optimize product image
 */
export async function optimizeProductImage(
  fileBytes: Uint8Array,
): Promise<Buffer> {
  return optimizeImage(fileBytes, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
  });
}
