"use client";
import { motion } from "@/components/motion";

/** Warm line-art illustration for the Causal Intelligence Alert band. */
export function AlertIllustration({ domain }: { domain: "manufacturing" | "healthcare" }) {
  return domain === "manufacturing" ? <TruckArt /> : <WardArt />;
}

function TruckArt() {
  return (
    <svg width="260" height="150" viewBox="0 0 260 150" className="max-w-full">
      {/* ground arc */}
      <path d="M8 132 Q 130 100 252 132" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      {/* clock */}
      <motion.g
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <circle cx="206" cy="34" r="20" fill="#fbfaf5" stroke="#d9e4cd" strokeWidth="1.5" />
        <motion.line
          x1="206" y1="34" x2="206" y2="21" stroke="#3d5a3d" strokeWidth="2" strokeLinecap="round"
          style={{ originX: "206px", originY: "34px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <line x1="206" y1="34" x2="215" y2="34" stroke="#8b887b" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      {/* boxes */}
      <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
        <rect x="150" y="92" width="34" height="34" rx="3" fill="#e8dcc4" stroke="#c9b79a" strokeWidth="1.2" />
        <path d="M150 100 H184 M167 92 V126" stroke="#c9b79a" strokeWidth="1" />
        <rect x="186" y="104" width="24" height="22" rx="3" fill="#dcc9a6" stroke="#c9b79a" strokeWidth="1.2" />
      </motion.g>
      {/* truck */}
      <motion.g
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect x="26" y="70" width="66" height="42" rx="4" fill="#fbfaf5" stroke="#d9e4cd" strokeWidth="1.6" />
        <path d="M92 82 h20 l14 16 v14 h-34 z" fill="#3d5a3d" />
        <rect x="98" y="86" width="16" height="12" rx="2" fill="#e8efe0" />
        <circle cx="44" cy="118" r="9" fill="#2c452e" />
        <circle cx="44" cy="118" r="3.5" fill="#e8efe0" />
        <circle cx="108" cy="118" r="9" fill="#2c452e" />
        <circle cx="108" cy="118" r="3.5" fill="#e8efe0" />
      </motion.g>
      {/* motion lines */}
      <motion.g
        stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
      >
        <line x1="10" y1="80" x2="22" y2="80" />
        <line x1="6" y1="92" x2="20" y2="92" />
        <line x1="12" y1="104" x2="22" y2="104" />
      </motion.g>
    </svg>
  );
}

function WardArt() {
  return (
    <svg width="260" height="150" viewBox="0 0 260 150" className="max-w-full">
      <path d="M8 132 Q 130 100 252 132" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      {/* pulse line */}
      <motion.path
        d="M20 60 H70 l8 -22 l10 40 l8 -18 H150"
        fill="none" stroke="#d9e4cd" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.2 }}
      />
      {/* bed */}
      <motion.g initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <rect x="30" y="92" width="90" height="14" rx="3" fill="#fbfaf5" stroke="#d9e4cd" strokeWidth="1.6" />
        <rect x="30" y="80" width="20" height="12" rx="3" fill="#e8efe0" stroke="#d9e4cd" strokeWidth="1.4" />
        <line x1="34" y1="106" x2="34" y2="122" stroke="#2c452e" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="116" y1="106" x2="116" y2="122" stroke="#2c452e" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
      {/* cross */}
      <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <circle cx="200" cy="44" r="24" fill="#3d5a3d" />
        <path d="M200 32 v24 M188 44 h24" stroke="#e8efe0" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      {/* clipboard */}
      <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <rect x="160" y="86" width="34" height="42" rx="4" fill="#fbfaf5" stroke="#d9e4cd" strokeWidth="1.4" />
        <rect x="171" y="82" width="12" height="8" rx="2" fill="#c9b79a" />
        <path d="M166 98 h22 M166 106 h22 M166 114 h14" stroke="#d9e4cd" strokeWidth="1.6" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}
