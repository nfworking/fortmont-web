"use client";

import { motion, MotionProps } from "framer-motion";
import React from "react";

type MotionWrapperProps = MotionProps & {
  children: React.ReactNode;
};

const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, ...props }) => {
  return <motion.div {...props}>{children}</motion.div>;
};

export default MotionWrapper;
