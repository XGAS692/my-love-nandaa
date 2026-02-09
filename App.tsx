
import React, { useState, useEffect, useRef } from 'react';
import Visualizer from './components/Visualizer';
import Overlay from './components/Overlay';
import { HandGesture } from './types';

const App: React.FC = () => {
  const [currentGesture, setCurrentGesture] = useState<HandGesture>(HandGesture.IDLE);
  const [fps, setFps] = useState(0);

  return (
    <div className="relative w-full h-screen bg-neutral-950">
      <Visualizer 
        onGestureChange={setCurrentGesture} 
        onFpsUpdate={setFps} 
      />
      
      <Overlay currentGesture={currentGesture} fps={fps} />
      
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h1 className="text-2xl font-bold text-white tracking-tighter uppercase">
          Ethereal <span className="text-emerald-400">Particles</span>
        </h1>
        <p className="text-xs text-neutral-400 font-mono">Real-time Hand Interaction</p>
      </div>
    </div>
  );
};

export default App;
