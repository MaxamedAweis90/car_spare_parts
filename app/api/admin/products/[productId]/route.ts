import { NextRequest, NextResponse } from "next/server";
import { Query, type Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { buildProductImageUrl, type ProductDocument } from "@/lib/server/productService";
import { deleteProductImage, uploadProductImage } from "@/lib/server/productImageService";

type CompatibilityDocument = Models.Document & {
  productId: string;
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  label?: string;
};

type ProductResponse = ProductDocument & {
  imageIds?: string[];
  imageUrls?: string[];
  compatibilities?: CompatibilityDocument[];
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return NaN;
}

function ensureCompatibilitiesCollectionId() {
  const id =
    process.env.APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.APPWRITE_COMPATIBILITIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITIES_COLLECTION_ID;

  if (!id) {
    throw new Error(
      "Missing Appwrite compatibilities collection id (APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID)"
    );
  }

  return String(id);
}

function parseStringArrayJson(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((v) => String(v)).map((v) => v.trim()).filter(Boolean);
}

async function listCompatibilitiesForProduct(productId: string) {
  const compatCollectionId = ensureCompatibilitiesCollectionId();
  const list = await databasesServer.listDocuments<CompatibilityDocument>(
    appwriteConfig.databaseId,
    compatCollectionId,
    [Query.equal("productId", productId), Query.orderDesc("$createdAt"), Query.limit(200)]
  );
  return list.documents as CompatibilityDocument[];
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  try {
    await requireAdmin(req);
    const { productId } = await ctx.params;

    const product = await databasesServer.getDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId
    );

    const imageIds = Array.isArray((product as any).imageIds) ? ((product as any).imageIds as string[]) : [];
    const imageUrls = imageIds.map((id) => buildProductImageUrl(id) ?? "").filter(Boolean);

    const compatibilities = await listCompatibilitiesForProduct(productId).catch(() => []);

    const response: ProductResponse = {
      ...(product as any),
      imageIds,
      imageUrls,
      compatibilities,
    };

    return NextResponse.json({ product: response });
  } catch (error: any) {
    console.error("Admin product GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  try {
    await requireAdmin(req);
    const { productId } = await ctx.params;

    const existing = await databasesServer.getDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId
    );

    const formData = await req.formData();
    const updates: Record<string, unknown> = {};

    if (typeof formData.get("name") === "string") {
      const name = String(formData.get("name") ?? "").trim();
      if (!name) return jsonError("Product name is required", 400);
      updates.name = name;
    }

    if (formData.has("description")) updates.description = String(formData.get("description") ?? "").trim() || null;
    if (formData.has("brand")) updates.brand = String(formData.get("brand") ?? "").trim() || null;
    if (formData.has("condition")) updates.condition = String(formData.get("condition") ?? "").trim() || null;
    if (formData.has("partNumber")) updates.partNumber = String(formData.get("partNumber") ?? "").trim() || null;

    if (formData.has("price")) {
      const price = toNumber(formData.get("price"));
      if (!Number.isFinite(price)) return jsonError("Price must be a valid number", 400);
      updates.price = price;
    }

    if (formData.has("stock")) {
      const stock = toNumber(formData.get("stock"));
      if (!Number.isFinite(stock)) return jsonError("Stock must be a valid number", 400);
      updates.stock = stock;
    }

    if (formData.has("sellerId")) {
      const sellerId = String(formData.get("sellerId") ?? "").trim();
      if (!sellerId) return jsonError("sellerId is required", 400);
      updates.sellerId = sellerId;
    }

    if (formData.has("mainCategoryId")) {
      const cat = String(formData.get("mainCategoryId") ?? "").trim();
      if (!cat) return jsonError("Category is required", 400);
      updates.mainCategoryId = cat;
    }

    if (formData.has("compatibilityOptionIds")) {
      updates.compatibilityOptionIds = parseStringArrayJson(formData.get("compatibilityOptionIds"));
    }

    // Optional image replacement.
    const replaceImages = String(formData.get("replaceImages") ?? "false").toLowerCase() === "true";
    const newImages = formData.getAll("images");

    let imageIds: string[] = Array.isArray((existing as any).imageIds) ? ((existing as any).imageIds as string[]) : [];

    if (replaceImages && newImages.length) {
      const nextImageIds: string[] = [];
      for (const item of newImages) {
        if (!(item instanceof Blob)) continue;
        const bytes = new Uint8Array(await item.arrayBuffer());
        if (!bytes.length) continue;
        const filename = (item as File).name || "product-image";
        const fileId = await uploadProductImage(bytes, filename);
        nextImageIds.push(fileId);
      }

      for (const oldId of imageIds) {
        if (!nextImageIds.includes(oldId)) await deleteProductImage(oldId);
      }

      imageIds = nextImageIds;
      updates.imageIds = imageIds;
      updates.imageId = imageIds[0] ?? null;
    }

    const updated = await databasesServer.updateDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId,
      updates
    );

    const finalImageIds = Array.isArray((updated as any).imageIds) ? ((updated as any).imageIds as string[]) : imageIds;
    const imageUrls = finalImageIds.map((id) => buildProductImageUrl(id) ?? "").filter(Boolean);

    const compatibilities = await listCompatibilitiesForProduct(productId).catch(() => []);

    const response: ProductResponse = {
      ...(updated as any),
      imageIds: finalImageIds,
      imageUrls,
      compatibilities,
    };

    return NextResponse.json({ product: response });
  } catch (error: any) {
    console.error("Admin product PATCH error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  try {
    await requireAdmin(req);
    const { productId } = await ctx.params;

    const product = await databasesServer.getDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId
    );

    const imageIds: string[] = Array.isArray((product as any).imageIds) ? ((product as any).imageIds as string[]) : [];

    await databasesServer.deleteDocument(appwriteConfig.databaseId, appwriteConfig.productsCollectionId, productId);

    for (const id of imageIds) {
      await deleteProductImage(id);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Admin product DELETE error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
