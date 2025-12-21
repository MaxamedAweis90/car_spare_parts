import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { requireAdmin } from "@/lib/server/requireAdmin";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function startOfUtcWeek(date: Date) {
  // Monday as start of week
  const day = date.getUTCDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // Mon=0, Sun=6
  const dayStart = startOfUtcDay(date);
  dayStart.setUTCDate(dayStart.getUTCDate() - diff);
  return dayStart;
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

async function countUsers(queries: string[]) {
  const list = await databasesServer.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [...queries, Query.limit(1)]
  );
  return list.total;
}

async function countOrdersSince(isoStart: string) {
  const list = await databasesServer.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.ordersCollectionId,
    [Query.greaterThanEqual("$createdAt", isoStart), Query.limit(1)]
  );
  return list.total;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [
      usersTotal,
      usersActive,
      usersInactive,
      sellersTotal,
      sellersActive,
      sellersInactive,
      sellersPending,
    ] = await Promise.all([
      countUsers([]),
      countUsers([Query.equal("isActive", true)]),
      countUsers([Query.equal("isActive", false)]),
      countUsers([Query.equal("role", "seller")]),
      countUsers([Query.equal("role", "seller"), Query.equal("isActive", true)]),
      countUsers([Query.equal("role", "seller"), Query.equal("isActive", false)]),
      countUsers([Query.equal("role", "seller"), Query.equal("sellerApproved", false)]),
    ]);

    const now = new Date();
    const dayStart = startOfUtcDay(now).toISOString();
    const weekStart = startOfUtcWeek(now).toISOString();
    const yearStart = startOfUtcYear(now).toISOString();

    // NOTE: There is no visitor analytics collection currently.
    // We approximate "visitors" using order volume in each time window.
    const [visitorsDay, visitorsWeek, visitorsYear] = await Promise.all([
      countOrdersSince(dayStart),
      countOrdersSince(weekStart),
      countOrdersSince(yearStart),
    ]);

    return NextResponse.json({
      users: {
        total: usersTotal,
        active: usersActive,
        inactive: usersInactive,
      },
      sellers: {
        total: sellersTotal,
        active: sellersActive,
        inactive: sellersInactive,
        pendingApproval: sellersPending,
      },
      visitors: {
        day: visitorsDay,
        week: visitorsWeek,
        year: visitorsYear,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status }
    );
  }
}
