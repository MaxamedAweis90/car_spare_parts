"use client";

import { useState, FormEvent } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setMessage(data.message || "Thanks for subscribing!");
      setEmail("");

      // Reset status after a few seconds
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          disabled={status === "loading" || status === "success"}
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400"
          required
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={`absolute right-0 top-0 bottom-0 rounded-r-md px-5 transition-colors ${
            status === "success"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {status === "loading" ? (
            <i className="fa-solid fa-circle-notch fa-spin text-white"></i>
          ) : status === "success" ? (
            <i className="fa-solid fa-check text-white"></i>
          ) : (
            <i className="fa-solid fa-chevron-right text-white"></i>
          )}
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 text-xs ${status === "error" ? "text-red-500" : "text-green-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
