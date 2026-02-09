
import React from 'react';
import { HandGesture } from '../types';

interface OverlayProps {
  currentGesture: HandGesture;
  fps: number;
}

const Overlay: React.FC<OverlayProps> = ({ currentGesture, fps }) => {
  const gestureLabels: Record<HandGesture, string> = {
    [HandGesture.IDLE]: '🖐️ IDLE (FLOAT)',
    [HandGesture.ROCK_ON]: '🤘 ROCK ON (I LOVE YOU NANDA)',
    [HandGesture.PEACE]: '✌️ PEACE (HEART)',
    [HandGesture.THUMBS_UP]: '👍 THUMBS UP (SPHERE)',
    [HandGesture.FIST]: '✊ FIST (CORE)',
  };

  const instructions = [
    { icon: '🖐️', label: 'Idle: Floating Noise' },
    { icon: '🤘', label: 'Rock On: I LOVE YOU NANDA' },
    { icon: '✌️', label: 'Victory: Heart' },
    { icon: '👍', label: 'Thumbs Up: Sphere' },
    { icon: '✊', label: 'Fist: Center Core' },
  ];

  return (
    <>
      {/* Top Left Instructions */}
      <div className="absolute top-20 left-4 z-20 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-emerald-500/30 text-white w-64 shadow-2xl">
        <h3 className="text-emerald-400 font-bold mb-3 text-xs uppercase tracking-widest">Commands</h3>
        <ul className="space-y-2 text-sm">
          {instructions.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <span className="w-6 text-center">{item.icon}</span>
              <span className="text-neutral-300">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Center Status */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-2xl border-2 border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.3)] flex flex-col items-center min-w-[300px]">
          <span className="text-xs text-emerald-400/70 font-mono mb-1 uppercase tracking-tighter">Current Gesture</span>
          <span className="text-2xl font-black text-white tracking-widest uppercase italic">
            {gestureLabels[currentGesture]}
          </span>
        </div>
      </div>

      {/* Stats Overlay */}
      <div className="absolute bottom-4 right-4 z-20 font-mono text-[10px] text-neutral-500 flex flex-col items-end">
        <span>FPS: {fps}</span>
        <span>PARTICLES: 35,000</span>
        <span>ENGINE: THREE.JS + MEDIAPIPE</span>
      </div>
    </>
  );
};

export default Overlay;
