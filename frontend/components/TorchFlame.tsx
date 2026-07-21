'use client';

import { useEffect, useRef } from 'react';

export default function TorchFlame({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Torch body */}
      <div className="w-4 h-12 bg-gradient-to-b from-amber-800 to-stone-700 rounded-sm mx-auto relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-amber-600 rounded-t" />
      </div>
      {/* Flame layers */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6">
        <div
          className="w-6 h-10 rounded-full animate-torch-flicker"
          style={{
            background: 'radial-gradient(ellipse at bottom, #ff6b35 0%, #ffa500 40%, #ffff00 80%, transparent 100%)',
            filter: 'blur(2px)',
            animation: 'torch-flicker 0.4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute inset-0 w-4 h-8 mx-auto rounded-full"
          style={{
            background: 'radial-gradient(ellipse at bottom, #fff 0%, #ffff00 30%, transparent 80%)',
            filter: 'blur(1px)',
            animation: 'torch-flicker 0.3s ease-in-out infinite reverse',
          }}
        />
        {/* Glow */}
        <div
          className="absolute -inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,53,0.3) 0%, transparent 70%)',
            animation: 'torch-flicker 0.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
