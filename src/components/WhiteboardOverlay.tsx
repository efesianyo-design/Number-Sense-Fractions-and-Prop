import React, { useRef, useState, useEffect } from 'react';
import { 
  Pen, 
  Highlighter, 
  Eraser, 
  RotateCcw, 
  X, 
  Palette,
  Minus,
  Check
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface WhiteboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser';

export const WhiteboardOverlay: React.FC<WhiteboardOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState<string>('#2563EB'); // default blue
  const [lineWidth, setLineWidth] = useState<number>(3);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const colors = [
    '#2563EB', // Blue
    '#DC2626', // Red
    '#16A34A', // Green
    '#D97706', // Amber
    '#9333EA', // Purple
    '#0F172A', // Black
  ];

  // Resize canvas to match screen
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      // Store current drawing before resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const ctx = canvas.getContext('2d');
      if (ctx && tempCanvas.width > 0) {
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPosRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 5;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color + '55'; // semi-transparent
      ctx.lineWidth = lineWidth * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    lastPosRef.current = { x, y };
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isDrawingRef.current) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      playSound('pop');
    }
  };

  return (
    <div
      id="whiteboard-overlay-container"
      className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between"
    >
      {/* Floating Toolbar on Top Center */}
      <div className="pointer-events-auto mx-auto mt-16 bg-white/95 backdrop-blur-md border border-slate-300 rounded-2xl p-2 shadow-2xl flex items-center gap-2 animate-fadeIn text-slate-800">
        
        {/* Tool Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setTool('pen'); playSound('click'); }}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              tool === 'pen' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Pen Tool"
          >
            <Pen className="w-4 h-4" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          <button
            onClick={() => { setTool('highlighter'); playSound('click'); }}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              tool === 'highlighter' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Highlighter Tool"
          >
            <Highlighter className="w-4 h-4" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          <button
            onClick={() => { setTool('eraser'); playSound('click'); }}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              tool === 'eraser' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Eraser</span>
          </button>
        </div>

        {/* Color Palette (Pen & Highlighter) */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1.5 px-2 border-l border-slate-200">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); playSound('click'); }}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                  color === c ? 'scale-125 border-slate-800 shadow-xs' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                title={`Color ${c}`}
              />
            ))}
          </div>
        )}

        {/* Line Thickness */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Size:</span>
          {[2, 4, 8].map((size) => (
            <button
              key={size}
              onClick={() => { setLineWidth(size); playSound('click'); }}
              className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer ${
                lineWidth === size ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              {size === 2 ? 'S' : size === 4 ? 'M' : 'L'}
            </button>
          ))}
        </div>

        {/* Actions: Clear & Close */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
          <button
            onClick={clearCanvas}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            title="Clear all drawings"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            onClick={() => { onClose(); playSound('click'); }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Exit Annotation Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Transparent Canvas Layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        className="pointer-events-auto absolute inset-0 w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
};
