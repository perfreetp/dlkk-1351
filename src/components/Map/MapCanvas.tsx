import { useRef, useEffect, useCallback } from 'react';
import type { Target, Fence, Device } from '@/types';

interface MapCanvasProps {
  targets: Target[];
  fences: Fence[];
  devices: Device[];
  showCoverage?: boolean;
  onTargetClick?: (target: Target) => void;
  onFenceClick?: (fence: Fence) => void;
  selectedTargetId?: string | null;
  selectedFenceId?: string | null;
  drawMode?: boolean;
  onDrawComplete?: (coordinates: { lat: number; lng: number }[]) => void;
  drawingPoints?: { lat: number; lng: number }[];
  onDrawingPointAdd?: (point: { lat: number; lng: number }) => void;
}

const MAP_CENTER = { lat: 39.906, lng: 116.4085 };
const MAP_SCALE = 50000;

export default function MapCanvas({
  targets,
  fences,
  devices,
  showCoverage = true,
  onTargetClick,
  onFenceClick,
  selectedTargetId,
  selectedFenceId,
  drawMode = false,
  onDrawComplete,
  drawingPoints = [],
  onDrawingPointAdd,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const latLngToPixel = useCallback((lat: number, lng: number, width: number, height: number) => {
    const x = (lng - MAP_CENTER.lng) * MAP_SCALE + width / 2;
    const y = (MAP_CENTER.lat - lat) * MAP_SCALE + height / 2;
    return { x, y };
  }, []);

  const pixelToLatLng = useCallback((x: number, y: number, width: number, height: number) => {
    const lng = (x - width / 2) / MAP_SCALE + MAP_CENTER.lng;
    const lat = MAP_CENTER.lat - (y - height / 2) / MAP_SCALE;
    return { lat, lng };
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const drawParkBoundary = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const boundary = [
      { lat: 38.900, lng: 116.395 },
      { lat: 39.915, lng: 116.395 },
      { lat: 39.915, lng: 116.420 },
      { lat: 38.900, lng: 116.420 },
    ];
    
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    boundary.forEach((point, i) => {
      const { x, y } = latLngToPixel(point.lat, point.lng, width, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }, [latLngToPixel]);

  const drawFences = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors: Record<string, { stroke: string; fill: string }> = {
      forbidden: { stroke: 'rgba(255, 61, 61, 0.8)', fill: 'rgba(255, 61, 61, 0.1)' },
      height_limit: { stroke: 'rgba(255, 138, 0, 0.8)', fill: 'rgba(255, 138, 0, 0.1)' },
      temporary: { stroke: 'rgba(255, 199, 0, 0.8)', fill: 'rgba(255, 199, 0, 0.1)' },
    };

    fences.forEach((fence) => {
      const isSelected = fence.id === selectedFenceId;
      const color = colors[fence.type];
      
      ctx.save();
      if (isSelected) {
        ctx.shadowColor = color.stroke;
        ctx.shadowBlur = 15;
      }
      
      ctx.strokeStyle = color.stroke;
      ctx.fillStyle = color.fill;
      ctx.lineWidth = isSelected ? 3 : 2;
      
      ctx.beginPath();
      fence.coordinates.forEach((point, i) => {
        const { x, y } = latLngToPixel(point.lat, point.lng, width, height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      if (fence.coordinates.length > 0) {
        const center = fence.coordinates[0];
        const { x, y } = latLngToPixel(center.lat, center.lng, width, height);
        ctx.fillStyle = color.stroke;
        ctx.font = '11px Noto Sans SC';
        ctx.fillText(fence.name, x + 5, y - 5);
      }
      
      ctx.restore();
    });
  }, [fences, selectedFenceId, latLngToPixel]);

  const drawDevices = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const typeColors: Record<string, string> = {
      radar: '#00d4ff',
      telemetry: '#00ff88',
      photoelectric: '#ff8a00',
    };

    devices.forEach((device) => {
      const { x, y } = latLngToPixel(device.position.lat, device.position.lng, width, height);
      
      if (showCoverage && device.status === 'online') {
        const radius = device.coverageRadius * 0.02;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `${typeColors[device.type]}20`);
        gradient.addColorStop(1, `${typeColors[device.type]}00`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `${typeColors[device.type]}30`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      const statusColor = device.status === 'online' ? '#00ff88' : device.status === 'fault' ? '#ff3d3d' : '#666';
      
      ctx.save();
      if (device.status === 'online') {
        ctx.shadowColor = statusColor;
        ctx.shadowBlur = 10;
      }
      
      ctx.fillStyle = typeColors[device.type];
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(device.type[0].toUpperCase(), x, y);
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px Noto Sans SC';
      ctx.textAlign = 'left';
      ctx.fillText(device.name, x + 12, y + 3);
      
      ctx.restore();
    });
  }, [devices, showCoverage, latLngToPixel]);

  const drawTargets = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    targets.forEach((target) => {
      const isSelected = target.id === selectedTargetId;
      const currentPos = target.trajectory[target.trajectory.length - 1];
      
      ctx.save();
      
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(255, 61, 61, 0)');
      gradient.addColorStop(1, 'rgba(255, 61, 61, 0.8)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      target.trajectory.forEach((point, i) => {
        const { x, y } = latLngToPixel(point.lat, point.lng, width, height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      target.trajectory.forEach((point, i) => {
        if (i % 5 === 0) {
          const { x, y } = latLngToPixel(point.lat, point.lng, width, height);
          const alpha = (i / target.trajectory.length) * 0.5 + 0.2;
          ctx.fillStyle = `rgba(255, 61, 61, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      const { x, y } = latLngToPixel(currentPos.lat, currentPos.lng, width, height);
      const pulseSize = 8 + Math.sin(time * 0.005) * 3;
      
      if (isSelected) {
        ctx.shadowColor = '#ff3d3d';
        ctx.shadowBlur = 20;
      }
      
      ctx.fillStyle = 'rgba(255, 61, 61, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, pulseSize + 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff3d3d';
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      const rad = ((target.direction - 90) * Math.PI) / 180;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(rad) * 12, y + Math.sin(rad) * 12);
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(target.id, x + 15, y - 5);
      
      ctx.restore();
    });
  }, [targets, selectedTargetId, latLngToPixel]);

  const drawDrawingPoints = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (drawingPoints.length === 0) return;
    
    ctx.save();
    ctx.strokeStyle = '#00d4ff';
    ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    drawingPoints.forEach((point, i) => {
      const { x, y } = latLngToPixel(point.lat, point.lng, width, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (drawingPoints.length >= 3) {
      const first = latLngToPixel(drawingPoints[0].lat, drawingPoints[0].lng, width, height);
      ctx.lineTo(first.x, first.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    drawingPoints.forEach((point, i) => {
      const { x, y } = latLngToPixel(point.lat, point.lng, width, height);
      ctx.setLineDash([]);
      ctx.fillStyle = '#00d4ff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`${i + 1}`, x - 3, y + 3);
    });
    
    ctx.restore();
  }, [drawingPoints, latLngToPixel]);

  const drawScanLine = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const scanY = (time * 0.1) % height;
    const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanY - 20, width, 40);
  }, []);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, width, height);
    
    drawGrid(ctx, width, height);
    drawParkBoundary(ctx, width, height);
    drawFences(ctx, width, height);
    
    if (showCoverage) {
      drawDevices(ctx, width, height);
    }
    
    drawTargets(ctx, width, height, time);
    
    if (drawMode) {
      drawDrawingPoints(ctx, width, height);
    }
    
    drawScanLine(ctx, width, height, time);
    
    animationRef.current = requestAnimationFrame(render);
  }, [drawGrid, drawParkBoundary, drawFences, drawDevices, showCoverage, drawTargets, drawMode, drawDrawingPoints, drawScanLine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [render]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = canvas;
    
    if (drawMode && onDrawingPointAdd) {
      const point = pixelToLatLng(x, y, width, height);
      onDrawingPointAdd(point);
      return;
    }
    
    for (const target of targets) {
      const currentPos = target.trajectory[target.trajectory.length - 1];
      const { x: tx, y: ty } = latLngToPixel(currentPos.lat, currentPos.lng, width, height);
      const distance = Math.sqrt((x - tx) ** 2 + (y - ty) ** 2);
      if (distance < 20 && onTargetClick) {
        onTargetClick(target);
        return;
      }
    }
    
    for (const fence of fences) {
      const center = fence.coordinates[0];
      const { x: fx, y: fy } = latLngToPixel(center.lat, center.lng, width, height);
      const distance = Math.sqrt((x - fx) ** 2 + (y - fy) ** 2);
      if (distance < 50 && onFenceClick) {
        onFenceClick(fence);
        return;
      }
    }
  }, [drawMode, onDrawingPointAdd, targets, fences, latLngToPixel, pixelToLatLng, onTargetClick, onFenceClick]);

  const handleDoubleClick = useCallback(() => {
    if (drawMode && onDrawComplete && drawingPoints.length >= 3) {
      onDrawComplete(drawingPoints);
    }
  }, [drawMode, onDrawComplete, drawingPoints]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`w-full h-full ${drawMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
    />
  );
}
