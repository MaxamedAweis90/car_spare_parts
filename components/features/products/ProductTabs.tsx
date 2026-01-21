"use client";

import { useState } from "react";

interface ProductTabsProps {
  description?: string | null;
}

export function ProductTabs({ description }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { id: "description", label: "Description" },
    { id: "video", label: "Video" },
    { id: "reviews", label: "Write Review" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex border-b border-(--color-border)">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id
                ? "text-(--color-primary)"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-(--color-primary)"></div>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[200px] animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "description" && (
          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-(--color-text-muted) leading-relaxed">
              {description ||
                "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text."}
            </p>
            <p className="text-sm text-(--color-text-muted) leading-relaxed mt-4">
              There are many variations of passages of Lorem Ipsum available,
              but the majority have suffered alteration in some form, by
              injected humour, or randomised words which don't look even
              slightly believable.
            </p>
          </div>
        )}

        {activeTab === "video" && (
          <div className="aspect-video bg-(--color-bg) rounded-2xl border border-(--color-border) flex items-center justify-center relative overflow-hidden group border-dashed">
            <div className="flex flex-col items-center gap-4 text-(--color-text-muted)">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                <i className="fa-solid fa-play text-(--color-primary) ml-1"></i>
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Product Demonstration
              </span>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-(--color-bg) rounded-2xl border border-(--color-border)">
              <h4 className="text-sm font-black text-(--color-text) uppercase tracking-widest mb-4">
                Customer Reviews
              </h4>
              <div className="flex items-center gap-4 text-(--color-text-muted)">
                <i className="fa-regular fa-comments text-2xl opacity-20"></i>
                <p className="text-sm font-medium">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-(--color-text) uppercase tracking-widest">
                Submit a Review
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="h-12 px-4 rounded-xl border border-(--color-border) bg-white text-sm focus:border-(--color-primary) focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="h-12 px-4 rounded-xl border border-(--color-border) bg-white text-sm focus:border-(--color-primary) focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className="text-sm text-yellow-400 hover:scale-110 transition-transform"
                  >
                    <i className="fa-regular fa-star"></i>
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Write your review here..."
                className="min-h-[120px] p-4 rounded-xl border border-(--color-border) bg-white text-sm focus:border-(--color-primary) focus:outline-none resize-none"
              ></textarea>
              <button
                type="submit"
                className="h-12 bg-(--color-text) text-white font-black rounded-xl hover:bg-(--color-primary) transition-all uppercase tracking-widest text-xs w-fit px-8 shadow-lg shadow-black/10"
              >
                Submit Review
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
