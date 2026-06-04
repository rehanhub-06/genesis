"use client";

import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onDismiss: () => void;
}

export default function SplashScreen({ onDismiss }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // Show splash for 3.5 seconds
    const timer = setTimeout(() => {
      setAnimateOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 500); // Wait for fade out animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] transition-opacity duration-500 ease-in-out ${animateOut ? "opacity-0" : "opacity-100"
        }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 animate-fade-in-up drop-shadow-[0_0_25px_rgba(250,204,21,0.3)]">
          <span className="gradient-text inline-block py-3 px-2">
            Genesis
          </span>
        </h1>
        <p
          className="text-lg md:text-xl text-yellow-100/60 font-medium tracking-wide animate-fade-in-up"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          "Where ideas take their first form."
        </p>

        {/* Antigravity loader at the bottom of splash */}
        <div
          className="mt-16 w-12 h-12 animate-antigravity animate-fade-in-up"
          style={{ animationDelay: "500ms", animationFillMode: "both" }}
        />
      </div>
    </div>
  );
}
