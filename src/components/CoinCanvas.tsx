import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { drawCoin, type CoinState } from '../core/coin.ts';
import { useTheme } from '../hooks/useTheme.ts';

export interface CoinCanvasProps {
  id: string;
  state: CoinState;
  size?: number;
}

/** The gold qubit coin. `state` is null (superposition), 0 or 1. The canvas
 *  element is exposed through the ref so callers can animate or pulse it. */
const CoinCanvas = forwardRef<HTMLCanvasElement | null, CoinCanvasProps>(function CoinCanvas(
  { id, state, size = 130 },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();
  useImperativeHandle(ref, () => canvasRef.current!);

  // Redraw on state change and on theme change (the digits follow the theme).
  useEffect(() => {
    drawCoin(canvasRef.current, state);
  }, [state, isDark]);

  return <canvas id={id} ref={canvasRef} width={size} height={size} role="img" />;
});

export default CoinCanvas;
