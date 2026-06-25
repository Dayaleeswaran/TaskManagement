import { useId } from 'react';

export default function WorkNestLogo({ size = 48, showText = false, lightText = false, animate = false }) {
  const rawId = useId();
  // Strip special characters like colons from React useId to ensure valid SVG URL identifiers
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const animatedClass = animate ? 'animate-logo' : '';

  return (
    <div className={`flex items-center ${showText ? 'space-x-3' : ''} select-none`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 overflow-visible ${animatedClass}`}
      >
        <defs>
          {/* Glowing Radial Background */}
          <radialGradient id={`glowGradient-${id}`} cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>

          {/* Nest Twigs Gradient - Vibrant Indigo to Fuchsia */}
          <linearGradient id={`nestGradient-${id}`} x1="15" y1="50" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* Main Leaf Gradient - Modern Cyan to Emerald */}
          <linearGradient id={`leafGradient-${id}`} x1="30" y1="20" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Background Leaf Gradient - Soft Purple/Indigo */}
          <linearGradient id={`leafBackGradient-${id}`} x1="20" y1="20" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>

        {/* 1. Subtle Glow Layer */}
        <circle cx="50" cy="55" r="35" fill={`url(#glowGradient-${id})`} className="wn-glow" />

        {/* 2. Nest Twigs (Cradling the growth) */}
        <g id="wn-nest-twigs">
          {/* Outer Nest Branch */}
          <path
            d="M 15 50 C 15 80, 85 80, 85 50"
            stroke={`url(#nestGradient-${id})`}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            className="wn-nest-1"
          />
          {/* Middle Nest Branch */}
          <path
            d="M 24 57 C 29 79, 71 79, 76 57"
            stroke={`url(#nestGradient-${id})`}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="wn-nest-2"
          />
          {/* Inner Nest Branch */}
          <path
            d="M 33 64 C 38 78, 62 78, 67 64"
            stroke={`url(#nestGradient-${id})`}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
            className="wn-nest-3"
          />
        </g>

        {/* 3. Sprouting Leaves on the Nest */}
        <g id="wn-nest-sprouts">
          {/* Left Sprout Leaf */}
          <path
            d="M 15 50 C 10 44, 8 36, 17 38 C 22 39, 20 46, 15 50 Z"
            fill={`url(#leafGradient-${id})`}
            className="wn-sprout-left"
          />
          {/* Right Sprout Leaf */}
          <path
            d="M 85 50 C 90 44, 92 36, 83 38 C 78 39, 80 46, 85 50 Z"
            fill={`url(#leafGradient-${id})`}
            className="wn-sprout-right"
          />
        </g>

        {/* 4. Layered Growth Leaves */}
        {/* Background Leaf */}
        <path
          d="M 32 58 C 26 45, 32 28, 48 22 C 64 16, 67 26, 62 40 C 57 54, 44 64, 32 58 Z"
          fill={`url(#leafBackGradient-${id})`}
          opacity="0.6"
          className="wn-leaf-back"
        />

        {/* Foreground Main Leaf */}
        <path
          d="M 35 65 C 28 50, 35 30, 55 22 C 75 14, 78 28, 72 45 C 66 62, 50 72, 35 65 Z"
          fill={`url(#leafGradient-${id})`}
          className="wn-leaf-front"
        />

        {/* 5. Central Checkmark (Work / Accomplishment) */}
        <path
          d="M 43 46 L 50 53 L 63 36"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="wn-checkmark"
        />
      </svg>

      {showText && (
        <div className="flex flex-col items-start leading-none select-none">
          <span className={`text-xl font-extrabold tracking-tight font-outfit ${lightText ? 'text-white' : 'text-slate-900'}`}>
            Work<span className="brand-gradient-text">Nest</span>
          </span>
          <span className="text-[8px] font-bold text-slate-400 tracking-[0.18em] mt-1 uppercase whitespace-nowrap font-outfit opacity-80">
            Manage Tasks. Grow Together.
          </span>
        </div>
      )}
    </div>
  );
}
