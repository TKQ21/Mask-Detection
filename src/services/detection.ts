import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

export type MaskLabel = 'Mask' | 'No Mask' | 'Incorrect Mask';

export interface DetectionResult {
  label: MaskLabel;
  confidence: number;
  box: [number, number, number, number]; // x, y, w, h
}

export interface DetectionResponse {
  success: boolean;
  faces_detected: number;
  results: DetectionResult[];
  error?: string;
  processing_time_ms?: number;
}

let model: blazeface.BlazeFaceModel | null = null;
let modelLoading = false;

export async function loadModel(): Promise<void> {
  if (model || modelLoading) return;
  modelLoading = true;
  try {
    await tf.ready();
    model = await blazeface.load();
    // Warm up
    const dummy = tf.zeros([128, 128, 3]) as tf.Tensor3D;
    await model.estimateFaces(dummy, false);
    dummy.dispose();
  } catch (e) {
    console.error('Model load failed:', e);
    throw new Error('Failed to load face detection model');
  } finally {
    modelLoading = false;
  }
}

export function isModelLoaded(): boolean {
  return model !== null;
}

// Simulated mask classification based on face region analysis
// In production, this would be a separate CNN classifier
function classifyMask(
  imageData: ImageData,
  box: [number, number, number, number]
): { label: MaskLabel; confidence: number } {
  const [x, y, w, h] = box;
  const { data, width } = imageData;

  // Analyze the lower half of the face (mouth/nose region)
  const lowerY = Math.floor(y + h * 0.5);
  const lowerH = Math.floor(h * 0.5);

  let totalBrightness = 0;
  let colorVariance = 0;
  let blueishPixels = 0;
  let darkPixels = 0;
  let samples = 0;

  for (let py = lowerY; py < lowerY + lowerH && py < imageData.height; py += 2) {
    for (let px = Math.floor(x); px < x + w && px < width; px += 2) {
      const i = (py * width + px) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // Check for mask-like colors (blue, white, black, green)
      if (b > r + 20 && b > g + 10) blueishPixels++;
      if (brightness < 60) darkPixels++;

      colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      samples++;
    }
  }

  if (samples === 0) {
    return { label: 'No Mask', confidence: 0.5 };
  }

  const avgBrightness = totalBrightness / samples;
  const avgVariance = colorVariance / samples;
  const blueRatio = blueishPixels / samples;
  const darkRatio = darkPixels / samples;

  // Heuristic scoring - lower color variance in lower face suggests mask
  // Masks tend to be uniform in color
  const uniformityScore = Math.max(0, 1 - avgVariance / 150);
  const maskColorScore = blueRatio * 2 + darkRatio * 0.5;

  const maskScore = uniformityScore * 0.6 + Math.min(maskColorScore, 1) * 0.4;

  if (maskScore > 0.55) {
    // Check if mask covers nose (upper part of lower face)
    const noseY = Math.floor(y + h * 0.4);
    const noseH = Math.floor(h * 0.15);
    let noseCovered = 0;
    let noseSamples = 0;

    for (let py = noseY; py < noseY + noseH && py < imageData.height; py += 2) {
      for (let px = Math.floor(x + w * 0.3); px < x + w * 0.7 && px < width; px += 2) {
        const i = (py * width + px) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const v = Math.abs(r - g) + Math.abs(g - b);
        if (v < 40) noseCovered++;
        noseSamples++;
      }
    }

    const noseRatio = noseSamples > 0 ? noseCovered / noseSamples : 0;

    if (noseRatio < 0.3) {
      return {
        label: 'Incorrect Mask',
        confidence: 0.6 + Math.random() * 0.2,
      };
    }

    return {
      label: 'Mask',
      confidence: 0.7 + maskScore * 0.25,
    };
  }

  return {
    label: 'No Mask',
    confidence: 0.65 + (1 - maskScore) * 0.3,
  };
}

export async function detectFromCanvas(
  canvas: HTMLCanvasElement
): Promise<DetectionResponse> {
  const start = performance.now();

  if (!model) {
    return {
      success: false,
      faces_detected: 0,
      results: [],
      error: 'Model not loaded. Please wait for initialization.',
    };
  }

  try {
    const predictions = await model.estimateFaces(canvas, false);
    const elapsed = performance.now() - start;

    if (predictions.length === 0) {
      return {
        success: false,
        faces_detected: 0,
        results: [],
        error: 'No face detected. Please face the camera clearly.',
        processing_time_ms: elapsed,
      };
    }

    const ctx = canvas.getContext('2d');
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

    if (!imageData) {
      return {
        success: false,
        faces_detected: 0,
        results: [],
        error: 'Failed to read image data.',
      };
    }

    const results: DetectionResult[] = predictions.map((pred) => {
      const start = pred.topLeft as [number, number];
      const end = pred.bottomRight as [number, number];
      const x = start[0];
      const y = start[1];
      const w = end[0] - start[0];
      const h = end[1] - start[1];

      const box: [number, number, number, number] = [x, y, w, h];
      const classification = classifyMask(imageData, box);

      return {
        ...classification,
        box,
      };
    });

    return {
      success: true,
      faces_detected: results.length,
      results,
      processing_time_ms: elapsed,
    };
  } catch (e) {
    return {
      success: false,
      faces_detected: 0,
      results: [],
      error: 'Detection failed. Please try again.',
    };
  }
}
