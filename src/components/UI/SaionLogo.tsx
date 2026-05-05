import React from 'react'

interface LogoProps {
  size?: number
  animated?: boolean
  className?: string
}

export default function SaionLogo({ size = 48, animated = true, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e0a4a" />
          <stop offset="100%" stopColor="#05010f" />
        </radialGradient>
        <linearGradient id="outerRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="url(#bgGrad)" />

      {/* Outer rotating ring segments */}
      <g filter="url(#glow)">
        <path
          d="M40 4 A36 36 0 0 1 76 40"
          stroke="url(#outerRing)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 40 40"
              to="360 40 40"
              dur="8s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <path
          d="M40 76 A36 36 0 0 1 4 40"
          stroke="url(#outerRing)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 40 40"
              to="360 40 40"
              dur="8s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Counter-rotating ring */}
      <g filter="url(#softGlow)">
        <path
          d="M40 10 A30 30 0 0 0 10 40"
          stroke="#4f46e5"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 40 40"
              to="-360 40 40"
              dur="12s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <path
          d="M40 70 A30 30 0 0 0 70 40"
          stroke="#a78bfa"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 40 40"
              to="-360 40 40"
              dur="12s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Hexagon shape */}
      <polygon
        points="40,18 57,28 57,52 40,62 23,52 23,28"
        stroke="url(#innerGlow)"
        strokeWidth="1.5"
        fill="rgba(124,58,237,0.08)"
        filter="url(#softGlow)"
      />

      {/* Inner hexagon */}
      <polygon
        points="40,25 51,31.5 51,48.5 40,55 29,48.5 29,31.5"
        stroke="rgba(167,139,250,0.4)"
        strokeWidth="1"
        fill="rgba(124,58,237,0.05)"
      />

      {/* Neural network nodes */}
      {[
        { x: 40, y: 18 }, { x: 57, y: 28 }, { x: 57, y: 52 },
        { x: 40, y: 62 }, { x: 23, y: 52 }, { x: 23, y: 28 }
      ].map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill="url(#coreGrad)" filter="url(#glow)">
          {animated && (
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      {/* Connection lines */}
      <g opacity="0.25" stroke="url(#innerGlow)" strokeWidth="0.75">
        <line x1="40" y1="18" x2="40" y2="40" />
        <line x1="57" y1="28" x2="40" y2="40" />
        <line x1="57" y1="52" x2="40" y2="40" />
        <line x1="40" y1="62" x2="40" y2="40" />
        <line x1="23" y1="52" x2="40" y2="40" />
        <line x1="23" y1="28" x2="40" y2="40" />
      </g>

      {/* Central core */}
      <circle cx="40" cy="40" r="10" fill="url(#bgGrad)" stroke="url(#outerRing)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="6" fill="url(#coreGrad)" filter="url(#glow)" opacity="0.9">
        {animated && (
          <animate
            attributeName="r"
            values="5;6.5;5"
            dur="2.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle cx="40" cy="40" r="2.5" fill="white" opacity="0.95" />

      {/* Orbit dot */}
      <circle cx="40" cy="8" r="3" fill="#a78bfa" filter="url(#glow)">
        {animated && (
          <>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 40 40"
              to="360 40 40"
              dur="5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="5s"
              repeatCount="indefinite"
            />
          </>
        )}
      </circle>
    </svg>
  )
}
