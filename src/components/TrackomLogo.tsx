interface TrackomLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  glowing?: boolean;
}

export default function TrackomLogo({ size = 32, className = '', showText = true, glowing = false }: TrackomLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Speech Bubble Icon — extracted from brand video */}
      <div className={`relative flex items-center justify-center ${glowing ? 'animate-pulse-glow' : ''}`} style={{ width: size, height: size }}>
        {/* Glow layer */}
        {glowing && (
          <div
            className="absolute inset-0 rounded-lg blur-md opacity-40"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
          />
        )}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          className="relative z-10"
        >
          {/* Speech bubble shape */}
          <defs>
            <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          {/* Outer speech bubble */}
          <path
            d="M8 8C8 5.79 9.79 4 12 4H36C38.21 4 40 5.79 40 8V28C40 30.21 38.21 32 36 32H20L12 40V32H12C9.79 32 8 30.21 8 28V8Z"
            stroke="url(#bubbleGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showText && (
        <span className="font-display font-bold text-xl tracking-tight text-white">
          Trackom
        </span>
      )}
    </div>
  );
}
