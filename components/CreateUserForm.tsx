"use client";

import { useState } from "react";
import { createUser } from "@/services/users";

type CreateRole = "admin" | "seller";

export default function CreateUserForm({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateRole>("seller");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await createUser({
        name,
        email,
        role,
        creatorId: currentUserId, // admin ID
      });

      if (res?.$id) {
        setMessage("User created successfully");
        setName("");
        setEmail("");
        setRole("seller");
      } else {
        setMessage(res?.error || "Failed to create user");
      }
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border rounded max-w-md mx-auto mt-6"
    >
      <h2 className="text-xl font-semibold mb-4">
        Admin . Create User
      </h2>

      <label className="block mb-3">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border rounded mt-1"
        />
      </label>

      <label className="block mb-3">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded mt-1"
        />
      </label>

      <label className="block mb-4">
        Role
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as CreateRole)}
          className="w-full p-2 border rounded mt-1"
        >
          <option value="admin">Admin</option>
          <option value="seller">Seller</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-700">{message}</p>
      )}
    </form>
  );
}
