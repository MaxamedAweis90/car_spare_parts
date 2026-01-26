"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { CloseOutlined, DownloadOutlined } from "@ant-design/icons";

export default function PwaInstallBanner() {
  const { deferredPrompt, isAppInstalled, promptInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (deferredPrompt && !isAppInstalled) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [deferredPrompt, isAppInstalled]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 bg-white shadow-md border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-transform duration-300 transform translate-y-0">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 overflow-hidden rounded-lg shadow-sm hover:scale-105 transition-transform duration-200">
          <Image
            src="/spartpartslogo-01.png"
            alt="App Icon"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Car Spare Parts
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Install for a better experience
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={promptInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <DownloadOutlined />
          Install
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1.5 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close install banner"
        >
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
}
