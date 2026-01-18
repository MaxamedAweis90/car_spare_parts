"use client";

import React from "react";
// Assumes FontAwesome is available globally or imported via layout
// Using simple anchor tags for external links

export default function ContactAdminButtons() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      <a
        href="https://wa.me/25261XXXXXXX"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
      >
        <i className="fab fa-whatsapp text-lg"></i>
        <span>Contact via WhatsApp</span>
      </a>
      <a
        href="https://t.me/admin_handle"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 rounded-xl bg-[#0088cc] px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
      >
        <i className="fab fa-telegram text-lg"></i>
        <span>Contact via Telegram</span>
      </a>
    </div>
  );
}

