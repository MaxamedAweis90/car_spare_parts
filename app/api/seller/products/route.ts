import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role, type Models } from "node-appwrite";
import { requireSeller } from "@/lib/server/requireSeller";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import {
  buildProductImageUrl,
  type ProductDocument,
} from "@/lib/server/productService";
import { uploadProductImage } from "@/lib/server/productImageService";
import {
  replaceCompatibilitiesForProduct,
  type CompatibilityInput,
} from "@/lib/server/compatibilityService";

type SellerProductResponse = ProductDocument & {
  imageIds?: string[];
  imageUrls?: string[];
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
  return parsed
    .map((v) => String(v))
    .map((v) => v.trim())
    .filter(Boolean);
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

function toCompatibilityInput(
  doc: CompatibilityOptionDocument
): CompatibilityInput {
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

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireSeller(req);

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 100;

    const list = await databasesServer.listDocuments<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [
        Query.equal("sellerId", profile.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]
    );

    const items: SellerProductResponse[] = list.documents.map((doc) => {
      const imageIds = Array.isArray((doc as any).imageIds)
        ? ((doc as any).imageIds as string[])
        : [];
      const imageId = (doc as any).imageId ?? imageIds[0] ?? null;
      const imageUrls = imageIds.length
        ? imageIds.map((id) => buildProductImageUrl(id) ?? "").filter(Boolean)
        : [];

      return {
        ...doc,
        imageId,
        imageIds,
        imageUrls,
      } as SellerProductResponse;
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Seller products GET error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, account } = await requireSeller(req);

    const formData = await req.formData();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return jsonError("Product name is required", 400);

    const description =
      String(formData.get("description") ?? "").trim() || null;
    const brand = String(formData.get("brand") ?? "").trim() || null;
    const condition = String(formData.get("condition") ?? "").trim() || null;
    const partNumber = String(formData.get("partNumber") ?? "").trim() || null;

    const price = toNumber(formData.get("price"));
    if (!Number.isFinite(price))
      return jsonError("Price must be a valid number", 400);

    const stock = toNumber(formData.get("stock"));
    if (!Number.isFinite(stock))
      return jsonError("Stock must be a valid number", 400);

    const mainCategoryId = String(formData.get("mainCategoryId") ?? "").trim();
    if (!mainCategoryId) return jsonError("Category is required", 400);

    const originalPriceRaw = toNumber(formData.get("originalPrice"));
    const originalPrice = Number.isFinite(originalPriceRaw)
      ? originalPriceRaw
      : price;

    const discountStartDate = formData.get("discountStartDate")
      ? String(formData.get("discountStartDate"))
      : null;

    const discountExpiry = formData.get("discountExpiry")
      ? String(formData.get("discountExpiry"))
      : null;

    const onSale = originalPrice > price;

    const images = formData.getAll("images");
    const imageIds: string[] = [];

    for (const item of images) {
      if (!(item instanceof Blob)) continue;
      const bytes = new Uint8Array(await item.arrayBuffer());
      if (!bytes.length) continue;
      const filename = (item as File).name || "product-image";
      const fileId = await uploadProductImage(bytes, filename, account.$id);
      imageIds.push(fileId);
    }

    // Seller selects admin-managed compatibility options. We store the selected *details* in the compatibilities collection
    // because the products collection may not contain a `compatibilityOptionIds` attribute.
    const compatibilityOptionIds = parseStringArrayJson(
      formData.get("compatibilityOptionIds")
    );
    const compatibilityEntries: CompatibilityInput[] =
      compatibilityOptionIds.length
        ? (await loadCompatibilityOptionDocsByIds(compatibilityOptionIds)).map(
            toCompatibilityInput
          )
        : [];

    const created = await databasesServer.createDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      ID.unique(),
      {
        name,
        description,
        price,
        stock,
        sellerId: profile.$id,
        mainCategoryId,
        brand,
        condition,
        partNumber,
        imageIds,
        imageId: imageIds[0] ?? null,
        isActive: stock > 0,
        originalPrice,
        onSale,
        discountStartDate,
        discountExpiry,
      } as any,
      [
        Permission.read(Role.any()),
        Permission.read(Role.user(profile.$id)),
        Permission.update(Role.user(profile.$id)),
        Permission.delete(Role.user(profile.$id)),
      ]
    );

    // Persist compatibility selections separately.
    await replaceCompatibilitiesForProduct({
      sellerId: profile.$id,
      productId: created.$id,
      entries: compatibilityEntries,
    }).catch((e) => {
      console.error("Failed to save compatibilities for product", e);
    });

    const response: SellerProductResponse = {
      ...(created as any),
      imageId: (created as any).imageId ?? imageIds[0] ?? null,
      imageIds,
      imageUrls: imageIds
        .map((id) => buildProductImageUrl(id) ?? "")
        .filter(Boolean),
    };

    return NextResponse.json({ product: response }, { status: 201 });
  } catch (error: any) {
    console.error("Seller products POST error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500
    );
  }
}

