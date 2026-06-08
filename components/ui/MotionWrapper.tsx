// components/ui/MotionWrapper.tsx
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export default function MotionWrapper({ children, ...rest }: MotionWrapperProps) {
  return <motion.div {...rest}>{children}</motion.div>;
}
