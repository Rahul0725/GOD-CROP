
import React, { useRef, useEffect, useState } from 'react';
import { ImageFile, CropState, WatermarkState } from '../types';

interface Props {
  image: ImageFile;
  cropState: CropState;
  onCropChange: (state: CropState) => void;
  watermark: WatermarkState;
  isProcessing?: boolean;
}

const ImageEditor: React.FC<Props> = ({ image, cropState, onCropChange, watermark, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = image.preview;
    img.onload = () => setImgElement(img);
  }, [image.preview]);

  useEffect(() => {
    if (!canvasRef.current || !imgElement || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Professional scaling padding
    const padding = 20;
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    let displayWidth = availableWidth;
    let displayHeight = availableWidth / (cropState.aspectRatio || imgElement.width / imgElement.height);

    if (displayHeight > availableHeight) {
      displayHeight = availableHeight;
      displayWidth = displayHeight * (cropState.aspectRatio || imgElement.width / imgElement.height);
    }

    canvas.width = displayWidth * window.devicePixelRatio;
    canvas.height = displayHeight * window.devicePixelRatio;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Drawing context
    ctx.save();
    applyShapeMask(ctx, displayWidth, displayHeight, cropState);
    ctx.clip();

    const imgRatio = imgElement.width / imgElement.height;
    const canvasRatio = displayWidth / displayHeight;
    
    let drawW = displayWidth;
    let drawH = displayHeight;
    let drawX = 0;
    let drawY = 0;

    if (imgRatio > canvasRatio) {
      drawW = displayHeight * imgRatio;
      drawX = (displayWidth - drawW) / 2;
    } else {
      drawH = displayWidth / imgRatio;
      drawY = (displayHeight - drawH) / 2;
    }

    ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Subtle edge border for clipped shape
    ctx.save();
    applyShapeMask(ctx, displayWidth, displayHeight, cropState);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    if (watermark.enabled) {
      ctx.save();
      ctx.globalAlpha = watermark.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(watermark.text || '', displayWidth - 12, displayHeight - 12);
      ctx.restore();
    }

  }, [imgElement, cropState, watermark]);

  const applyShapeMask = (ctx: CanvasRenderingContext2D, w: number, h: number, state: CropState) => {
    ctx.beginPath();
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h);

    switch (state.shape) {
      case 'circle':
        ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
        break;
      case 'rounded':
        const r = Math.min(state.cornerRadius, size / 2);
        ctx.roundRect(0, 0, w, h, [r]);
        break;
      case 'pill':
        ctx.roundRect(0, 0, w, h, [size / 2]);
        break;
      case 'squircle':
        ctx.roundRect(0, 0, w, h, [size * 0.28]);
        break;
      case 'triangle':
        drawPolygon(ctx, cx, cy, 3, size / 2, -Math.PI / 2);
        break;
      case 'diamond':
        drawPolygon(ctx, cx, cy, 4, size / 2, 0);
        break;
      case 'pentagon':
        drawPolygon(ctx, cx, cy, 5, size / 2, -Math.PI / 2);
        break;
      case 'hexagon':
        drawPolygon(ctx, cx, cy, 6, size / 2, -Math.PI / 2);
        break;
      case 'octagon':
        drawPolygon(ctx, cx, cy, 8, size / 2, -Math.PI / 2);
        break;
      case 'polygon':
        drawPolygon(ctx, cx, cy, state.shapeConfig.sides, size / 2, -Math.PI / 2);
        break;
      case 'star':
        drawStar(ctx, cx, cy, state.shapeConfig.points, size / 2, (size / 2) * state.shapeConfig.innerRadius);
        break;
      case 'heart':
        drawHeart(ctx, cx, cy, size);
        break;
      case 'badge':
        drawStar(ctx, cx, cy, 24, size / 2, (size / 2) * 0.9);
        break;
      case 'blob':
      case 'liquid':
        drawBlob(ctx, cx, cy, size / 2.1, state.shapeConfig.seed, state.shapeConfig.complexity);
        break;
      case 'svg_path':
        if (state.shapeConfig.svgPath) {
          const path = new Path2D(state.shapeConfig.svgPath);
          ctx.fill(path);
        } else {
          ctx.rect(0, 0, w, h);
        }
        break;
      case 'ai_cutout':
        ctx.ellipse(cx, cy, w * 0.38, h * 0.45, 0.05, 0, Math.PI * 2);
        break;
      default:
        ctx.rect(0, 0, w, h);
    }
  };

  const drawPolygon = (ctx: CanvasRenderingContext2D, x: number, y: number, sides: number, radius: number, startAngle: number) => {
    if (sides < 3) return;
    const step = (Math.PI * 2) / sides;
    ctx.moveTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
    for (let i = 1; i <= sides; i++) {
      ctx.lineTo(x + radius * Math.cos(startAngle + step * i), y + radius * Math.sin(startAngle + step * i));
    }
  };

  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, points: number, outer: number, inner: number) => {
    let angle = Math.PI / points;
    ctx.moveTo(x, y - outer);
    for (let i = 0; i < 2 * points; i++) {
      let r = i % 2 === 0 ? outer : inner;
      let currAngle = i * angle - Math.PI / 2;
      ctx.lineTo(x + r * Math.cos(currAngle), y + r * Math.sin(currAngle));
    }
    ctx.closePath();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const s = size * 0.8;
    ctx.moveTo(x, y + s / 4);
    ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s / 4);
    ctx.bezierCurveTo(x - s / 2, y + s / 2, x, y + s * 0.75, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.75, x + s / 2, y + s / 2, x + s / 2, y + s / 4);
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
  };

  const drawBlob = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, seed: number, points: number) => {
    const step = (Math.PI * 2) / points;
    const random = (s: number) => {
      let v = Math.sin(s * 12.9898 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };

    ctx.moveTo(x + radius, y);
    for (let i = 0; i < points; i++) {
      const angle = i * step;
      const r = radius * (0.85 + 0.3 * random(i));
      const nextAngle = (i + 1) * step;
      const nextR = radius * (0.85 + 0.3 * random(i + 1));
      
      const cp1x = x + (r * 1.35) * Math.cos(angle + step * 0.4);
      const cp1y = y + (r * 1.35) * Math.sin(angle + step * 0.4);
      const cp2x = x + (nextR * 1.35) * Math.cos(nextAngle - step * 0.4);
      const cp2y = y + (nextR * 1.35) * Math.sin(nextAngle - step * 0.4);
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x + nextR * Math.cos(nextAngle), y + nextR * Math.sin(nextAngle));
    }
    ctx.closePath();
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center pointer-events-none">
       <div className="relative shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-500 overflow-hidden rounded-sm">
         <canvas ref={canvasRef} className="block" />
       </div>
    </div>
  );
};

export default ImageEditor;
