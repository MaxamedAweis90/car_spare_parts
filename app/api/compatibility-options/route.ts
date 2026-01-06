import { NextRequest, NextResponse } from "next/server";
import { Query, type Models } from "node-appwrite";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

type CompatibilityOptionDocument = Models.Document & {
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  label?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function ensureCompatibilityOptionsCollectionId() {
  const id =
    process.env.APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.APPWRITE_COMPATIBILITIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITIES_COLLECTION_ID;

  if (!id) {
    throw new Error(
      "Missing Appwrite compatibilities/options collection id (set APPWRITE_COMPATIBILITIES_COLLECTION_ID or APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID)"
    );
  }

  return String(id);
}

function buildLabel(doc: CompatibilityOptionDocument) {
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

export async function GET(req: NextRequest) {
  try {
    const collectionId = ensureCompatibilityOptionsCollectionId();

    const list =
      await databasesServer.listDocuments<CompatibilityOptionDocument>(
        appwriteConfig.databaseId,
        collectionId,
        [Query.orderDesc("$createdAt"), Query.limit(200)]
      );

    const items = list.documents.map((doc) => ({
      id: doc.$id,
      label: buildLabel(doc),
      vehicleType: (doc as any).vehicleType,
      make: (doc as any).make,
      model: (doc as any).model,
      yearFrom: (doc as any).yearFrom,
      yearTo: (doc as any).yearTo,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Public compatibility-options GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
