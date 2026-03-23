// NOTE: This file must only be imported by client components.
// Animation variants should be imported from './motionVariants'.
'use client';

import { motion, Variants, TargetAndTransition } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  initial?: string;
  animate?: string;
  exit?: string;
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  style?: React.CSSProperties;
}

export default function MotionWrapper({ 
  children, 
  className = "", 
  variants,
  initial = "hidden",
  animate = "visible",
  exit = "hidden",
  whileHover,
  whileTap,
  style
}: MotionWrapperProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover={whileHover}
      whileTap={whileTap}
      style={style}
    >
      {children}
    </motion.div>
  );
} 