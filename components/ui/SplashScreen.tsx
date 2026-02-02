"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingFilled, ToolFilled, CarFilled } from "@ant-design/icons";

export default function SplashScreen({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [stage, setStage] = useState<"icons" | "text" | "exit">("icons");
  const [iconIndex, setIconIndex] = useState(0);

  // Reduced to 3 key icons as requested
  const icons = [
    <SettingFilled key="gear" style={{ fontSize: 64, color: "#1f2937" }} />,
    <ToolFilled key="wrench" style={{ fontSize: 64, color: "#1f2937" }} />,
    <CarFilled key="car" style={{ fontSize: 64, color: "#1f2937" }} />,
  ];

  useEffect(() => {
    // Shorter duration per icon (e.g., 600ms total cycle: 300ms up, 300ms down logic implicit in animation)
    const iconInterval = setInterval(() => {
      setIconIndex((prev) => {
        if (prev === icons.length - 1) {
          clearInterval(iconInterval);
          // Wait a beat after the last icon before showing text
          setTimeout(() => setStage("text"), 200);
          return prev;
        }
        return prev + 1;
      });
    }, 500); // Faster interval (was 800)

    return () => clearInterval(iconInterval);
  }, []);

  useEffect(() => {
    if (stage === "text") {
      const timer = setTimeout(() => {
        setStage("exit");
      }, 1200); // Slightly faster hold
      return () => clearTimeout(timer);
    }

    if (stage === "exit") {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 600); // 0.6s exit match
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto flex flex-col items-center justify-center">
      {/* Background Split */}
      <AnimatePresence>
        {stage !== "exit" && (
          <>
            <motion.div
              initial={{ y: 0 }}
              exit={{
                y: "-100%",
                transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
              }}
              className="absolute top-0 left-0 w-full h-1/2 bg-green-50"
            />
            <motion.div
              initial={{ y: 0 }}
              exit={{
                y: "100%",
                transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
              }}
              className="absolute bottom-0 left-0 w-full h-1/2 bg-green-50"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Content Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Stage 1: Icon "Pop" Animation */}
        <AnimatePresence mode="wait">
          {stage === "icons" && (
            <div className="relative flex items-end justify-center h-32 w-32">
              {/* The "Bottom Circle" Anchor */}
              <motion.div
                className="absolute bottom-0 w-4 h-4 bg-green-300/50 rounded-full blur-sm"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />

              {/* Animated Icon */}
              <motion.div
                key={`icon-${iconIndex}`}
                // Start "inside" the circle (small, low y)
                initial={{ y: 0, opacity: 0, scale: 0 }}
                // Pop up securely
                animate={{
                  y: -40,
                  opacity: 1,
                  scale: 1.5,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
                // Fall back "into" the circle
                exit={{
                  y: 0,
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, ease: "easeIn" },
                }}
              >
                {icons[iconIndex]}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Stage 2: Text Reveal */}
        <AnimatePresence>
          {(stage === "text" || stage === "exit") && (
            <motion.div
              key="text-container"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              // Exit: Move UP with top half
              exit={{
                y: "-100vh",
                transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
              }}
              className="bg-white px-8 py-6 rounded-3xl shadow-2xl flex items-center gap-1 overflow-hidden"
            >
              <span className="text-4xl md:text-6xl font-[900] text-yellow-500 tracking-tight">
                Soma
              </span>
              <span className="text-4xl md:text-6xl font-[900] text-black tracking-tight">
                Parts
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
