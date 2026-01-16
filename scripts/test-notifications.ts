import { notifyFollowers } from "../lib/server/notificationService";

async function runTest() {
  console.log("--- Starting Notification System Test ---");

  // Mock data - replace with actual IDs from your Appwrite instance if needed
  const testStoreId = "test_store_123";
  const testStoreName = "Super Spare Parts";
  const testProductLink = "/products/test_product_456";

  console.log(
    `[TEST] Triggering "New Product" notification for store: ${testStoreName}...`
  );
  await notifyFollowers({
    storeId: testStoreId,
    storeName: testStoreName,
    type: "new_product",
    title: "🆕 New Product Added!",
    message: `${testStoreName} just added a new product: High-Performance Brakepads.`,
    link: testProductLink,
  });
  console.log("[TEST] Notification trigger complete.");

  console.log(
    `[TEST] Triggering "New Deal" notification for store: ${testStoreName}...`
  );
  await notifyFollowers({
    storeId: testStoreId,
    storeName: testStoreName,
    type: "new_deal",
    title: "🔥 New Deal Alert!",
    message: `${testStoreName} just added a new deal: 30% OFF on Engine Oil! Check it out now.`,
    link: testProductLink,
  });
  console.log("[TEST] Deal notification trigger complete.");

  console.log("--- Test Run Finished ---");
}

runTest().catch(console.error);
