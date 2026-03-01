import { DetectionResult, MaskLabel } from '@/services/detection';

interface DetectionOverlayProps {
  results: DetectionResult[];
  canvasWidth: number;
  canvasHeight: number;
  displayWidth: number;
  displayHeight: number;
}

const colors: Record<MaskLabel, string> = {
  'Mask': '#22c55e',
  'No Mask': '#ef4444',
  'Incorrect Mask': '#eab308',
};

export function drawDetections(
  ctx: CanvasRenderingContext2D,
  results: DetectionResult[],
  scaleX: number = 1,
  scaleY: number = 1
) {
  results.forEach((r) => {
    const [x, y, w, h] = r.box;
    const color = colors[r.label];
    const sx = x * scaleX;
    const sy = y * scaleY;
    const sw = w * scaleX;
    const sh = h * scaleY;

    // Bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, sw, sh);

    // Corner accents
    const cornerLen = Math.min(sw, sh) * 0.2;
    ctx.lineWidth = 4;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(sx, sy + cornerLen);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx + cornerLen, sy);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(sx + sw - cornerLen, sy);
    ctx.lineTo(sx + sw, sy);
    ctx.lineTo(sx + sw, sy + cornerLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(sx, sy + sh - cornerLen);
    ctx.lineTo(sx, sy + sh);
    ctx.lineTo(sx + cornerLen, sy + sh);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(sx + sw - cornerLen, sy + sh);
    ctx.lineTo(sx + sw, sy + sh);
    ctx.lineTo(sx + sw, sy + sh - cornerLen);
    ctx.stroke();

    // Label background
    const label = `${r.label} ${Math.round(r.confidence * 100)}%`;
    ctx.font = 'bold 14px Inter, sans-serif';
    const metrics = ctx.measureText(label);
    const labelH = 24;
    const labelW = metrics.width + 16;

    ctx.fillStyle = color;
    ctx.fillRect(sx, sy - labelH - 4, labelW, labelH);

    ctx.fillStyle = r.label === 'Incorrect Mask' ? '#000' : '#fff';
    ctx.fillText(label, sx + 8, sy - 10);
  });
}

export default function DetectionOverlay({
  results,
  canvasWidth,
  canvasHeight,
  displayWidth,
  displayHeight,
}: DetectionOverlayProps) {
  const scaleX = displayWidth / canvasWidth;
  const scaleY = displayHeight / canvasHeight;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={displayWidth}
      height={displayHeight}
      viewBox={`0 0 ${displayWidth} ${displayHeight}`}
    >
      {results.map((r, i) => {
        const [x, y, w, h] = r.box;
        const color = colors[r.label];
        return (
          <g key={i}>
            <rect
              x={x * scaleX}
              y={y * scaleY}
              width={w * scaleX}
              height={h * scaleY}
              fill="none"
              stroke={color}
              strokeWidth={3}
              rx={4}
            />
            <rect
              x={x * scaleX}
              y={y * scaleY - 28}
              width={140}
              height={24}
              fill={color}
              rx={4}
            />
            <text
              x={x * scaleX + 8}
              y={y * scaleY - 10}
              fill={r.label === 'Incorrect Mask' ? '#000' : '#fff'}
              fontSize={13}
              fontWeight="bold"
              fontFamily="Inter, sans-serif"
            >
              {r.label} {Math.round(r.confidence * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
