import { useEffect, useRef } from 'react';
import { BlochRenderer } from '../core/blochRenderer.ts';
import type { BlochVec } from '../core/qubit.ts';
import { useTheme } from '../hooks/useTheme.ts';

export interface BlochSphereProps {
  id: string;
  width?: number;
  height?: number;
  vector: BlochVec;
  label?: string;
  animate?: boolean;
  onDrag?: (theta: number, phi: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  ariaLabel?: string;
}

export default function BlochSphere({
  id,
  width = 260,
  height = 260,
  vector,
  label = '',
  animate = true,
  onDrag,
  onKeyDown,
  ariaLabel,
}: BlochSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<BlochRenderer | null>(null);
  const onDragRef = useRef(onDrag);
  onDragRef.current = onDrag;
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const renderer = new BlochRenderer(canvas, width, height);
    rendererRef.current = renderer;
    const cleanupTooltips = renderer.enableTooltips();
    let cleanupDrag: (() => void) | undefined;
    if (onDragRef.current) {
      cleanupDrag = renderer.enableDrag((theta, phi) => {
        onDragRef.current?.(theta, phi);
      });
    }
    renderer.cur = { x: vector.x, y: vector.y, z: vector.z };
    renderer.draw(vector.x, vector.y, vector.z, label);

    return () => {
      if (renderer.animId) cancelAnimationFrame(renderer.animId);
      cleanupTooltips();
      cleanupDrag?.();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.resize(width, height);
    renderer.draw(renderer.cur.x, renderer.cur.y, renderer.cur.z);
  }, [width, height]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (animate) {
      renderer.animateTo(vector.x, vector.y, vector.z, label);
    } else {
      if (renderer.animId) {
        cancelAnimationFrame(renderer.animId);
        renderer.animId = null;
      }
      renderer.cur = { x: vector.x, y: vector.y, z: vector.z };
      renderer.tgt = { x: vector.x, y: vector.y, z: vector.z };
      renderer.draw(vector.x, vector.y, vector.z, label);
    }
  }, [vector.x, vector.y, vector.z, label, animate]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.draw(renderer.cur.x, renderer.cur.y, renderer.cur.z);
  }, [isDark]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      width={width}
      height={height}
      tabIndex={onDrag || onKeyDown ? 0 : undefined}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    />
  );
}
