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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Create admin account
      </h2>

      <label className="block text-sm font-semibold text-slate-700">
        Name
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
            placeholder="Admin Name"
          />
        </div>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Email
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
            placeholder="admin@example.com"
          />
        </div>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Password
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i
              className={`fa-regular ${
                showPassword ? "fa-eye-slash" : "fa-eye"
              }`}
              aria-hidden
            ></i>
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Must be at least 8 characters
        </p>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Confirm password
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            <i
              className={`fa-regular ${
                showConfirmPassword ? "fa-eye-slash" : "fa-eye"
              }`}
              aria-hidden
            ></i>
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-700 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Admin"}
      </button>

      {message && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {message}
        </div>
      )}
    </form>
  );
}

