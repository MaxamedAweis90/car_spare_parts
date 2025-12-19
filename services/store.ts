import type { SellerStorePayload, SellerStoreResponse } from "@/lib/types/seller-store";

async function handleJson<T>(res: Response) {
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || "Request failed");
  }
  return body as T;
}

export async function getSellerStore() {
  const res = await fetch("/api/seller/store", { cache: "no-store" });
  return res;
}

export async function createSellerStore() {
  const res = await fetch("/api/seller/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return handleJson<{ store: SellerStoreResponse }>(res);
}

export async function updateSellerStore(payload: SellerStorePayload) {
  const res = await fetch("/api/seller/store", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson<{ store: SellerStoreResponse }>(res);
}

export async function updateSellerStoreAvatar(file: File) {
  const data = new FormData();
  data.set("file", file);
  data.set("filename", file.name);

  const res = await fetch("/api/seller/store/avatar", {
    method: "POST",
    body: data,
  });
  return handleJson<{ store: SellerStoreResponse }>(res);
}

export async function updateSellerStoreBanner(file: File) {
  const data = new FormData();
  data.set("file", file);
  data.set("filename", file.name);

  const res = await fetch("/api/seller/store/banner", {
    method: "POST",
    body: data,
  });
  return handleJson<{ store: SellerStoreResponse }>(res);
}

export async function getPublicStore(slug: string) {
  const res = await fetch(`/api/stores/${slug}`, { cache: "no-store" });
  return handleJson<{ store: SellerStoreResponse }>(res);
}
