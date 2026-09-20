import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move, Maximize2 } from 'lucide-react';
import { playSound } from '../utils/audio';

interface WorkspaceZoomContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const WorkspaceZoomContainer: React.FC<WorkspaceZoomContainerProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const touchState = useRef<{
    initialDistance: number;
    initialScale: number;
    initialPan: { x: number; y: number };
    startCenter: { x: number; y: number };
  }>({
    initialDistance: 0,
    initialScale: 1,
    initialPan: { x: 0, y: 0 },
    startCenter: { x: 0, y: 0 },
  });

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
    playSound('snap');
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, Math.round((prev - 0.15) * 100) / 100));
    playSound('snap');
  };

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    playSound('click');
  };

  // Touch event handlers for 2-finger pinch & pan
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      touchState.current = {
        initialDistance: dist,
        initialScale: scale,
        initialPan: { ...pan },
        startCenter: { x: centerX, y: centerY },
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState.current.initialDistance > 0) {
      // Prevent browser native zoom during workspace 2-finger gesture
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      // Pinch Scale
      const scaleFactor = currentDist / touchState.current.initialDistance;
      const newScale = Math.min(2.5, Math.max(0.6, touchState.current.initialScale * scaleFactor));
      setScale(Math.round(newScale * 100) / 100);

      // 2-Finger Drag Pan
      const deltaX = centerX - touchState.current.startCenter.x;
      const deltaY = centerY - touchState.current.startCenter.y;
      setPan({
        x: touchState.current.initialPan.x + deltaX,
        y: touchState.current.initialPan.y + deltaY,
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchState.current.initialDistance = 0;
    }
  };

  return (
    <div
      ref={containerRef}
      id="workspace-viewport"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`relative w-full h-full min-h-0 overflow-hidden select-none bg-slate-950 flex flex-col ${className}`}
    >
      {/* Floating Canvas Zoom & Pan Control Dock */}
      <div
        id="canvas-zoom-dock"
        className="absolute bottom-3 right-3 z-30 flex items-center bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl p-1 shadow-xl text-slate-300 text-xs"
      >
        <button
          id="zoom-out-btn"
          onClick={handleZoomOut}
          title="Zoom Out (0.6x min)"
          className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="px-2 font-mono text-[11px] font-bold text-cyan-400 min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          id="zoom-in-btn"
          onClick={handleZoomIn}
          title="Zoom In (2.5x max)"
          className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          id="zoom-reset-btn"
          onClick={handleResetZoom}
          title="Reset Zoom & Pan (100%)"
          className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scalable & Pannable Interactive Canvas Layer */}
      <div
        id="workspace-content-layer"
        className="w-full h-full min-h-0 flex-1 flex flex-col origin-top transition-transform duration-75 overflow-hidden"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
