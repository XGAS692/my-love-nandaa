
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import * as CameraModule from '@mediapipe/camera_utils';
import * as HandsModule from '@mediapipe/hands';
import { HandGesture } from '../types';

// Safely extract classes from MediaPipe modules
const Camera = (CameraModule as any).Camera || (CameraModule as any).default?.Camera || (CameraModule as any).default;
const Hands = (HandsModule as any).Hands || (HandsModule as any).default?.Hands || (HandsModule as any).default;

interface VisualizerProps {
  onGestureChange: (gesture: HandGesture) => void;
  onFpsUpdate: (fps: number) => void;
}

const PARTICLE_COUNT = 35000;

const Visualizer: React.FC<VisualizerProps> = ({ onGestureChange, onFpsUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    geometry: THREE.BufferGeometry;
    positions: Float32Array;
    colors: Float32Array;
  } | null>(null);

  const currentGestureRef = useRef<HandGesture>(HandGesture.IDLE);
  const targetPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const palmCenterRef = useRef<{ x: number, y: number, z: number }>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const palette = [
      new THREE.Color(0x8B00FF), // Violet
      new THREE.Color(0x00FF88), // Neon Green
      new THREE.Color(0x00FFFF), // Cyan
      new THREE.Color(0xFF00FF), // Magenta
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Generate Heart Texture
    const createHeartTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.font = "100px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText("♥", 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const material = new THREE.PointsMaterial({
      size: 5.0, // Increased size for visibility of the heart shape
      map: createHeartTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    sceneRef.current = { scene, camera, renderer, particles, geometry, positions, colors };

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      onResults(results);
    });

    const video = videoRef.current!;
    const cameraInstance = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });
    cameraInstance.start();

    let frameCount = 0;
    let lastTime = performance.now();
    
    const animate = () => {
      const time = performance.now() * 0.001;
      frameCount++;
      if (performance.now() - lastTime > 1000) {
        onFpsUpdate(Math.round((frameCount * 1000) / (performance.now() - lastTime)));
        frameCount = 0;
        lastTime = performance.now();
      }

      if (sceneRef.current) {
        const { renderer, scene, camera, geometry } = sceneRef.current;
        updateParticlePositions(time);
        geometry.attributes.position.needsUpdate = true;
        
        camera.position.x = Math.sin(time * 0.15) * 100;
        camera.position.y = Math.cos(time * 0.1) * 50;
        camera.lookAt(0, 0, 0);
        
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      cameraInstance.stop();
    };
  }, []);

  const onResults = (results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const gesture = detectGesture(landmarks);
      
      const palmX = (0.5 - landmarks[9].x) * 1000;
      const palmY = (0.5 - landmarks[9].y) * 800;
      
      palmCenterRef.current = { x: palmX, y: palmY, z: 0 };

      if (gesture !== currentGestureRef.current) {
        currentGestureRef.current = gesture;
        onGestureChange(gesture);
        generateTargetPositions(gesture);
      }
    } else {
      if (currentGestureRef.current !== HandGesture.IDLE) {
        currentGestureRef.current = HandGesture.IDLE;
        onGestureChange(HandGesture.IDLE);
        generateTargetPositions(HandGesture.IDLE);
      }
    }
  };

  const detectGesture = (lm: any[]): HandGesture => {
    const isFingerOpen = (tip: number, pip: number) => lm[tip].y < lm[pip].y;

    const indexOpen = isFingerOpen(8, 6);
    const middleOpen = isFingerOpen(12, 10);
    const ringOpen = isFingerOpen(16, 14);
    const pinkyOpen = isFingerOpen(20, 18);

    const openCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

    // Rock on (I Love You)
    if (indexOpen && pinkyOpen && !middleOpen && !ringOpen) return HandGesture.ROCK_ON;
    // Victory (Heart)
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) return HandGesture.PEACE;
    // Thumbs Up
    if (lm[4].y < lm[3].y - 0.1 && openCount === 0) return HandGesture.THUMBS_UP;
    // Fist
    if (openCount === 0) return HandGesture.FIST;

    return HandGesture.IDLE;
  };

  const generateTargetPositions = (gesture: HandGesture) => {
    const targets = targetPositionsRef.current;
    
    switch (gesture) {
      case HandGesture.ROCK_ON:
        // --- SAMPLING TEXT "I LOVE YOU NANDA" ---
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        // Increase width for longer text
        canvas.width = 1200;
        canvas.height = 200;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('I LOVE YOU NANDA', 600, 100);
        
        const imageData = ctx.getImageData(0, 0, 1200, 200);
        const points: {x: number, y: number}[] = [];
        
        // Sample pixels with a step
        for (let y = 0; y < 200; y += 2) {
          for (let x = 0; x < 1200; x += 2) {
            const alpha = imageData.data[(y * 1200 + x) * 4 + 3];
            if (alpha > 128) {
              points.push({ x: x - 600, y: -(y - 100) });
            }
          }
        }

        // Fill target array with sampled points
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const pt = points[i % points.length];
          const offset = (Math.random() - 0.5) * 8;
          targets[i * 3] = pt.x * 1.5 + offset;
          targets[i * 3 + 1] = pt.y * 1.5 + offset;
          targets[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        break;

      case HandGesture.FIST:
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          targets[i * 3] = (Math.random() - 0.5) * 10;
          targets[i * 3 + 1] = (Math.random() - 0.5) * 10;
          targets[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        break;

      case HandGesture.THUMBS_UP:
        const sphereRadius = 220;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
          const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
          targets[i * 3] = sphereRadius * Math.cos(theta) * Math.sin(phi);
          targets[i * 3 + 1] = sphereRadius * Math.sin(theta) * Math.sin(phi);
          targets[i * 3 + 2] = sphereRadius * Math.cos(phi);
        }
        break;

      case HandGesture.PEACE:
        const heartScale = 15;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const t = (i / PARTICLE_COUNT) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const offset = (Math.random() - 0.5) * 20;
          targets[i * 3] = x * heartScale + offset;
          targets[i * 3 + 1] = y * heartScale + offset;
          targets[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        break;

      default: // IDLE
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          targets[i * 3] = (Math.random() - 0.5) * 1200;
          targets[i * 3 + 1] = (Math.random() - 0.5) * 1000;
          targets[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }
        break;
    }
  };

  const updateParticlePositions = (time: number) => {
    if (!sceneRef.current) return;
    const { positions } = sceneRef.current;
    const targets = targetPositionsRef.current;
    const palm = palmCenterRef.current;
    const lerpFactor = 0.08;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      
      let tx = targets[idx] + palm.x;
      let ty = targets[idx + 1] + palm.y;
      let tz = targets[idx + 2];

      if (currentGestureRef.current === HandGesture.IDLE) {
        tx += Math.sin(time + i * 0.001) * 20;
        ty += Math.cos(time + i * 0.001) * 20;
      }

      positions[idx] += (tx - positions[idx]) * lerpFactor;
      positions[idx + 1] += (ty - positions[idx + 1]) * lerpFactor;
      positions[idx + 2] += (tz - positions[idx + 2]) * lerpFactor;
    }
  };

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="absolute inset-0 z-10" />
      <video
        ref={videoRef}
        className="absolute bottom-4 right-4 w-48 h-36 rounded-2xl border-2 border-emerald-500/30 grayscale opacity-20 hover:opacity-100 transition-all duration-500 z-30 pointer-events-none scale-x-[-1] object-cover"
        playsInline
        muted
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 pointer-events-none z-10" />
    </div>
  );
};

export default Visualizer;
