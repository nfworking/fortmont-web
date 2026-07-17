"use client";

import { motion } from "framer-motion";
import React from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1], // modern easeOutExpo curve
      }}
      className="flex-grow flex flex-col w-full h-full"
    >
      {children}
    </motion.div>
  );
}
