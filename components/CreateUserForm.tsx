"use client";

import { useState } from "react";
import { createUser } from "@/services/users";

export default function CreateUserForm({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const res = await createUser({
        name,
        email,
        password,
        role: "admin",
        creatorId: currentUserId, // admin ID
      });

      if (res?.$id || res?.user?.$id) {
        setMessage("Admin created successfully");
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
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
        Create admin (main admin only)
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

      <label className="block mb-3">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded mt-1"
        />
      </label>

      <label className="block mb-3">
        Confirm password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-2 border rounded mt-1"
        />
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
