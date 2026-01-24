import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { cache } from "@/lib/utils/cache";

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
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
    [...queries, Query.limit(1)],
  );
  return list.total;
}

async function countOrdersSince(isoStart: string) {
  const list = await databasesServer.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.ordersCollectionId,
    [Query.greaterThanEqual("$createdAt", isoStart), Query.limit(1)],
  );
  return list.total;
}

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireAdmin(req);

    // Check cache first (5 minute TTL)
    const cacheKey = `dashboard:stats`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

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
      countUsers([
        Query.equal("role", "seller"),
        Query.equal("isActive", true),
      ]),
      countUsers([
        Query.equal("role", "seller"),
        Query.equal("isActive", false),
      ]),
      countUsers([
        Query.equal("role", "seller"),
        Query.equal("sellerApproved", false),
      ]),
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

    // FETCH HISTORICAL DATA (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const recentOrdersRaw = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      [
        Query.greaterThanEqual("$createdAt", sevenDaysAgo.toISOString()),
        Query.limit(100),
      ],
    );

    const revenueHistory: { date: string; revenue: number; count: number }[] =
      [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayOrders = recentOrdersRaw.documents.filter((doc) =>
        doc.$createdAt.startsWith(dateStr),
      );

      revenueHistory.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        count: dayOrders.length,
      });
    }

    // FETCH PENDING ADMINS (Only for main_admin)
    let pendingAdmins: any[] = [];

    // Check if user is main admin by ID
    const envMainIdsString = (
      process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
      ""
    ).trim();

    const mainAdminIds = envMainIdsString
      .split(",")
      .map((id) => id.trim().replace(/^["'](.+)["']$/, "$1"))
      .filter(Boolean);

    const isMainAdmin =
      profile.role === "main_admin" ||
      (mainAdminIds.length > 0 &&
        (mainAdminIds.includes(profile.$id) ||
          (profile.appwriteUserId &&
            mainAdminIds.includes(profile.appwriteUserId))));

    if (isMainAdmin) {
      const pendingAdminsRaw = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("status", "deactivated"), Query.limit(50)],
      );
      pendingAdmins = pendingAdminsRaw.documents
        .filter((doc) => doc.role === "admin" || doc.role === "main_admin")
        .map((doc) => ({
          name: doc.name,
          email: doc.email,
        }));
    }

    // FETCH ACTIVITIES
    let activities: any[] = [];
    try {
      const logs = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.activitiesCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(20)],
      );

      activities = logs.documents
        .map((doc) => ({
          id: doc.$id,
          adminName: doc.adminName,
          action: doc.action,
          targetName: doc.targetName,
          details: doc.details,
          createdAt: doc.$createdAt,
        }))
        .filter((act) => {
          // Main Admin sees everything
          if (isMainAdmin) return true;

          // Normal Admin sees ONLY seller related actions
          const adminActions = [
            "INVITE_ADMIN",
            "DEACTIVATE_ADMIN",
            "DELETE_ADMIN",
            "UPDATE_PASSWORD_ADMIN",
            "LOGIN_ADMIN",
          ];
          if (adminActions.includes(act.action)) return false;

          return true;
        });
    } catch (err) {
      console.warn("Failed to fetch activities", err);
    }

    const response = {
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
      pendingAdmins,
      activities,
      revenueHistory,
      generatedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes (300 seconds)
    cache.set(cacheKey, response, 300);

    return NextResponse.json(response);
  } catch (error: unknown) {
    const status =
      typeof (error as { status?: unknown })?.status === "number"
        ? (error as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status },
    );
  }
}
