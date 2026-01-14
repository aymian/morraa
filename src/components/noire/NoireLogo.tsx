import { motion } from "framer-motion";

/**
 * NOIRE Logo - Custom designed icon
 * Represents sound waves merging into a stylized "N" shape
 * Elegant, minimal, memorable
 */

interface NoireLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const NoireLogo = ({ size = 32, showText = true, className = "" }: NoireLogoProps) => {
  return (
    <motion.div 
      className={`flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon - Abstract sound wave forming an elegant "N" shape */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="noireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(38, 90%, 60%)" />
            <stop offset="100%" stopColor="hsl(45, 80%, 70%)" />
          </linearGradient>
          <linearGradient id="noireGradientDark" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(280, 50%, 25%)" />
            <stop offset="100%" stopColor="hsl(280, 60%, 40%)" />
          </linearGradient>
        </defs>

        {/* Outer ring - represents sound boundary */}
        <motion.circle
          cx="24"
          cy="24"
          r="22"
          stroke="url(#noireGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Sound wave lines forming abstract N */}
        <motion.path
          d="M14 32V16L24 28L34 16V32"
          stroke="url(#noireGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />

        {/* Center accent dot - the "soul" of the sound */}
        <motion.circle
          cx="24"
          cy="22"
          r="3"
          fill="url(#noireGradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />

        {/* Subtle glow ring */}
        <motion.circle
          cx="24"
          cy="22"
          r="6"
          stroke="hsl(38, 90%, 60%)"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.6, delay: 1 }}
        />
      </motion.svg>

      {/* Text */}
      {showText && (
        <motion.span 
          className="font-display text-xl tracking-wider text-foreground"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          NOIRE
        </motion.span>
      )}
    </motion.div>
  );
};

export default NoireLogo;
