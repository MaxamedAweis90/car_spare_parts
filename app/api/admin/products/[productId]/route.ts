import { NextRequest, NextResponse } from "next/server";
import { Query, type Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import { buildProductImageUrl, type ProductDocument } from "@/lib/server/productService";
import { deleteProductImage, uploadProductImage } from "@/lib/server/productImageService";
import {
  listCompatibilitiesForProduct,
  replaceCompatibilitiesForProduct,
  type CompatibilityDocument as BaseCompatibilityDocument,
  type CompatibilityInput,
} from "@/lib/server/compatibilityService";

type CompatibilityDocument = BaseCompatibilityDocument & { label?: string };

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

function parseStringArrayJson(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((v) => String(v)).map((v) => v.trim()).filter(Boolean);
}

type CompatibilityOptionDocument = Models.Document & {
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  label?: string;
};

function ensureCompatibilityOptionsCollectionId() {
  const id =
    process.env.APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID;

  if (!id) {
    throw new Error(
      "Missing Appwrite compatibility options collection id (APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID)"
    );
  }

  return String(id);
}

function toCompatibilityInput(doc: CompatibilityOptionDocument): CompatibilityInput {
  return {
    vehicleType: String((doc as any).vehicleType ?? "").trim(),
    make: String((doc as any).make ?? "").trim(),
    model: String((doc as any).model ?? "").trim(),
    yearFrom: Number((doc as any).yearFrom),
    yearTo: Number((doc as any).yearTo),
  };
}

async function loadCompatibilityOptionDocsByIds(ids: string[]) {
  if (!ids.length) return [] as CompatibilityOptionDocument[];
  const collectionId = ensureCompatibilityOptionsCollectionId();
  const list = await databasesServer.listDocuments<CompatibilityOptionDocument>(
    appwriteConfig.databaseId,
    collectionId,
    [Query.equal("$id", ids), Query.limit(Math.min(ids.length, 200))]
  );
  return list.documents as CompatibilityOptionDocument[];
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

    const sellerId = String((product as any).sellerId ?? "").trim();
    const compatibilities = sellerId
      ? ((await listCompatibilitiesForProduct({ sellerId, productId, limit: 200 }).catch(() => [])) as CompatibilityDocument[])
      : ([] as CompatibilityDocument[]);

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

    // Optional: replace compatibilities (stored in compatibilities collection, not on product document).
    if (formData.has("compatibilityOptionIds")) {
      const ids = parseStringArrayJson(formData.get("compatibilityOptionIds"));
      const entries: CompatibilityInput[] = ids.length
        ? (await loadCompatibilityOptionDocsByIds(ids)).map(toCompatibilityInput)
        : [];
      const sellerId = String((updates as any).sellerId ?? (existing as any).sellerId ?? "").trim();
      if (sellerId) {
        await replaceCompatibilitiesForProduct({ sellerId, productId, entries }).catch((e) => {
          console.error("Failed to save compatibilities for product", e);
        });
      }
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

    const sellerId = String((updated as any).sellerId ?? (existing as any).sellerId ?? "").trim();
    const compatibilities = sellerId
      ? ((await listCompatibilitiesForProduct({ sellerId, productId, limit: 200 }).catch(() => [])) as CompatibilityDocument[])
      : ([] as CompatibilityDocument[]);

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
