import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import {
  buildProductImageUrl,
  type ProductDocument,
} from "@/lib/server/productService";
import {
  deleteProductImage,
  uploadProductImage,
} from "@/lib/server/productImageService";
import { Query, type Models } from "node-appwrite";
import {
  listCompatibilitiesForProduct,
  replaceCompatibilitiesForProduct,
  type CompatibilityDocument,
  type CompatibilityInput,
} from "@/lib/server/compatibilityService";

type SellerProductResponse = ProductDocument & {
  imageIds?: string[];
  imageUrls?: string[];
  compatibilityOptions?: Array<{ id: string; label: string }>;
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
      "Missing Appwrite compatibility options collection id (APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID)",
    );
  }

  return String(id);
}

function buildCompatibilityLabel(doc: CompatibilityOptionDocument) {
  const explicit = (doc as any).label;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  const vehicleType = String((doc as any).vehicleType ?? "").trim();
  const make = String((doc as any).make ?? "").trim();
  const model = String((doc as any).model ?? "").trim();
  const yearFrom = (doc as any).yearFrom;
  const yearTo = (doc as any).yearTo;
  const years =
    typeof yearFrom === "number" && typeof yearTo === "number"
      ? `${yearFrom}-${yearTo}`
      : "";
  return [vehicleType, make, model, years].filter(Boolean).join(" ");
}

async function resolveCompatibilityOptions(ids: string[]) {
  if (!ids.length) return [] as Array<{ id: string; label: string }>;
  const collectionId = ensureCompatibilityOptionsCollectionId();
  const list = await databasesServer.listDocuments<CompatibilityOptionDocument>(
    appwriteConfig.databaseId,
    collectionId,
    [Query.equal("$id", ids), Query.limit(Math.min(ids.length, 200))],
  );
  return list.documents.map((d) => ({
    id: d.$id,
    label: buildCompatibilityLabel(d),
  }));
}

function compatibilityKey(value: {
  vehicleType?: unknown;
  make?: unknown;
  model?: unknown;
  yearFrom?: unknown;
  yearTo?: unknown;
}) {
  const vehicleType = String(value.vehicleType ?? "")
    .trim()
    .toLowerCase();
  const make = String(value.make ?? "")
    .trim()
    .toLowerCase();
  const model = String(value.model ?? "")
    .trim()
    .toLowerCase();
  const yearFrom = Number(value.yearFrom);
  const yearTo = Number(value.yearTo);
  return `${vehicleType}|${make}|${model}|${
    Number.isFinite(yearFrom) ? yearFrom : ""
  }|${Number.isFinite(yearTo) ? yearTo : ""}`;
}

async function listAllCompatibilityOptions(limit = 200) {
  const collectionId = ensureCompatibilityOptionsCollectionId();
  const list = await databasesServer.listDocuments<CompatibilityOptionDocument>(
    appwriteConfig.databaseId,
    collectionId,
    [
      Query.orderDesc("$createdAt"),
      Query.limit(Math.min(Math.max(limit, 1), 200)),
    ],
  );
  return list.documents as CompatibilityOptionDocument[];
}

async function resolveOptionIdsFromCompatibilities(
  compatDocs: CompatibilityDocument[],
) {
  if (!compatDocs.length) return [] as string[];

  const options = await listAllCompatibilityOptions(200).catch(
    () => [] as CompatibilityOptionDocument[],
  );
  const optionIdByKey = new Map<string, string>();
  for (const opt of options) {
    optionIdByKey.set(compatibilityKey(opt), opt.$id);
  }

  const ids: string[] = [];
  for (const compat of compatDocs) {
    const id = optionIdByKey.get(compatibilityKey(compat));
    if (id) ids.push(id);
  }
  return Array.from(new Set(ids));
}

function toCompatibilityInput(
  doc: CompatibilityOptionDocument,
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
    [Query.equal("$id", ids), Query.limit(Math.min(ids.length, 200))],
  );
  return list.documents as CompatibilityOptionDocument[];
}

async function getOwnedProduct(profileId: string, productId: string) {
  const doc = await databasesServer.getDocument<ProductDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.productsCollectionId,
    productId,
  );

  if ((doc as any).sellerId !== profileId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return doc;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ productId: string }> },
) {
  try {
    const { profile } = await requireSeller(req);
    const { productId } = await ctx.params;

    const product = await getOwnedProduct(profile.$id, productId);
    const imageIds = Array.isArray((product as any).imageIds)
      ? ((product as any).imageIds as string[])
      : [];
    const imageId = (product as any).imageId ?? imageIds[0] ?? null;

    const compatDocs = await listCompatibilitiesForProduct({
      sellerId: profile.$id,
      productId,
      limit: 200,
    }).catch(() => []);
    const compatibilityOptionIds = await resolveOptionIdsFromCompatibilities(
      compatDocs,
    ).catch(() => []);
    const compatibilityOptions = await resolveCompatibilityOptions(
      compatibilityOptionIds,
    ).catch(() => []);

    const response: SellerProductResponse = {
      ...(product as any),
      imageId,
      imageIds,
      imageUrls: imageIds
        .map((id) => buildProductImageUrl(id) ?? "")
        .filter(Boolean),
      compatibilityOptionIds,
      compatibilityOptions,
    };

    return NextResponse.json({ product: response });
  } catch (error: any) {
    console.error("Seller product GET error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500,
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ productId: string }> },
) {
  try {
    const { profile, account } = await requireSeller(req);
    const { productId } = await ctx.params;

    const existing = await getOwnedProduct(profile.$id, productId);

    const formData = await req.formData();

    const updates: Record<string, unknown> = {};

    const name = formData.get("name");
    if (typeof name === "string") {
      const trimmed = name.trim();
      if (!trimmed) return jsonError("Product name is required", 400);
      updates.name = trimmed;
    }

    if (typeof formData.get("description") === "string")
      updates.description = String(formData.get("description")).trim() || null;
    if (typeof formData.get("brand") === "string")
      updates.brand = String(formData.get("brand")).trim() || null;
    if (typeof formData.get("condition") === "string")
      updates.condition = String(formData.get("condition")).trim() || null;
    if (typeof formData.get("partNumber") === "string")
      updates.partNumber = String(formData.get("partNumber")).trim() || null;

    if (formData.has("price")) {
      const price = toNumber(formData.get("price"));
      if (!Number.isFinite(price))
        return jsonError("Price must be a valid number", 400);
      updates.price = price;
    }

    if (formData.has("stock")) {
      const stock = toNumber(formData.get("stock"));
      if (!Number.isFinite(stock))
        return jsonError("Stock must be a valid number", 400);
      updates.stock = stock;
      updates.isActive = stock > 0;
    }

    if (formData.has("mainCategoryId")) {
      const cat = String(formData.get("mainCategoryId") ?? "").trim();
      if (!cat) return jsonError("Category is required", 400);
      updates.mainCategoryId = cat;
    }

    // Optional: replace images or update specific images
    const replaceImages =
      String(formData.get("replaceImages") ?? "false").toLowerCase() === "true";
    const keptImageIdsRaw = formData.get("keptImageIds");
    const newImages = formData.getAll("images");

    let imageIds: string[] = Array.isArray((existing as any).imageIds)
      ? ((existing as any).imageIds as string[])
      : [];

    // Logic 1: Replace All (Legacy/Simple mode)
    if (replaceImages && newImages.length > 0 && !keptImageIdsRaw) {
      // Upload new, then delete old.
      const nextImageIds: string[] = [];
      for (const item of newImages) {
        if (!(item instanceof Blob)) continue;
        const bytes = new Uint8Array(await item.arrayBuffer());
        if (!bytes.length) continue;
        const filename = (item as File).name || "product-image";
        const fileId = await uploadProductImage(bytes, filename, account.$id);
        nextImageIds.push(fileId);
      }

      // Delete old images in parallel
      await Promise.all(
        imageIds
          .filter((oldId) => !nextImageIds.includes(oldId))
          .map((oldId) => deleteProductImage(oldId)),
      );

      imageIds = nextImageIds;
      updates.imageIds = imageIds;
      updates.imageId = imageIds[0] ?? null;
    }
    // Logic 2: Partial/Ordered Update (Manifest of Existing IDs + New File Placeholders)
    else if (keptImageIdsRaw) {
      const manifest = parseStringArrayJson(keptImageIdsRaw); // e.g. ["id1", "NEW_0", "id2"]
      const newFiles = formData.getAll("images");
      const resultImageIds: string[] = [];
      let newFilePointer = 0;

      for (const entry of manifest) {
        if (entry.startsWith("NEW_")) {
          const item = newFiles[newFilePointer++];
          if (item instanceof Blob) {
            const bytes = new Uint8Array(await item.arrayBuffer());
            if (!bytes.length) continue;
            const filename = (item as File).name || "product-image";
            const fileId = await uploadProductImage(
              bytes,
              filename,
              account.$id,
            );
            resultImageIds.push(fileId);
          }
        } else {
          // It's an existing ID
          resultImageIds.push(entry);
        }
      }

      // Cleanup dropped images in parallel
      await Promise.all(
        imageIds
          .filter((oldId) => !resultImageIds.includes(oldId))
          .map((oldId) => deleteProductImage(oldId)),
      );

      imageIds = resultImageIds;
      updates.imageIds = imageIds;
      updates.imageId = imageIds[0] ?? null;
    }

    // Optional: replace compatibilities (stored in compatibilities collection, not on product document).
    if (formData.has("compatibilityOptionIds")) {
      const ids = parseStringArrayJson(formData.get("compatibilityOptionIds"));
      const entries: CompatibilityInput[] = ids.length
        ? (await loadCompatibilityOptionDocsByIds(ids)).map(
            toCompatibilityInput,
          )
        : [];
      await replaceCompatibilitiesForProduct({
        sellerId: profile.$id,
        productId,
        entries,
      }).catch((e) => {
        console.error("Failed to save compatibilities for product", e);
      });
    }

    const updated = await databasesServer.updateDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId,
      updates,
    );

    const finalImageIds = Array.isArray((updated as any).imageIds)
      ? ((updated as any).imageIds as string[])
      : imageIds;
    const imageId = (updated as any).imageId ?? finalImageIds[0] ?? null;

    const compatDocs = await listCompatibilitiesForProduct({
      sellerId: profile.$id,
      productId,
      limit: 200,
    }).catch(() => []);
    const compatibilityOptionIds = await resolveOptionIdsFromCompatibilities(
      compatDocs,
    ).catch(() => []);
    const compatibilityOptions = await resolveCompatibilityOptions(
      compatibilityOptionIds,
    ).catch(() => []);

    const response: SellerProductResponse = {
      ...(updated as any),
      imageId,
      imageIds: finalImageIds,
      imageUrls: finalImageIds
        .map((id) => buildProductImageUrl(id) ?? "")
        .filter(Boolean),
      compatibilityOptionIds,
      compatibilityOptions,
    };

    return NextResponse.json({ product: response });
  } catch (error: any) {
    console.error("Seller product PATCH error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500,
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ productId: string }> },
) {
  try {
    const { profile } = await requireSeller(req);
    const { productId } = await ctx.params;

    const product = await getOwnedProduct(profile.$id, productId);

    const imageIds: string[] = Array.isArray((product as any).imageIds)
      ? ((product as any).imageIds as string[])
      : [];

    // Delete product document first.
    await databasesServer.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId,
    );

    // Best-effort cleanup - delete all images in parallel
    await Promise.all(imageIds.map((id) => deleteProductImage(id)));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Seller product DELETE error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500,
    );
  }
}
