export interface UserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: "main_admin" | "admin" | "seller" | "customer";
  isActive?: boolean;
  userId?: string;       // required for update/delete
  creatorId?: string;    // optional, send logged-in user id
  updaterId?: string;    // optional, send logged-in user id
  deleterId?: string;    // optional, send logged-in user id
  avatarId?: string;     // new field for avatar
  sellerApproved?: boolean;
}

// CREATE USER
export async function createUser(payload: UserPayload) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// GET ALL USERS
export async function getUsers(params?: { role?: string; sellerApproved?: boolean }) {
  const search = new URLSearchParams();
  if (params?.role) search.set("role", params.role);
  if (typeof params?.sellerApproved === "boolean") {
    search.set("sellerApproved", String(params.sellerApproved));
  }
  const qs = search.toString();
  const res = await fetch(`/api/users${qs ? `?${qs}` : ""}`, { method: "GET" });
  return res.json();
}

// UPDATE USER
export async function updateUser(payload: UserPayload) {
  const res = await fetch("/api/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// DELETE USER
export async function deleteUser(payload: UserPayload) {
  const res = await fetch("/api/users", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

