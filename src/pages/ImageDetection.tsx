import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, ImageIcon, X, Download } from 'lucide-react';
import { detectFromCanvas, DetectionResponse } from '@/services/detection';
import { drawDetections } from '@/components/DetectionOverlay';
import StatusBadge from '@/components/StatusBadge';
import ModelLoader from '@/components/ModelLoader';

function ImageView() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Max 10MB.');
      return;
    }

    setError(null);
    setResult(null);
    setProcessing(true);

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const res = await detectFromCanvas(canvas);
      setResult(res);

      // Draw results on canvas
      if (res.results.length > 0) {
        drawDetections(ctx, res.results);
      }

      setProcessing(false);
    };
    img.onerror = () => {
      setError('Failed to load image. File may be corrupted.');
      setProcessing(false);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'mask-detection-result.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const reset = () => {
    setImageUrl(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Image Detection
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {!imageUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[50vh] glass"
          >
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-foreground mb-2">Drop image here or click to upload</p>
            <p className="text-sm text-muted-foreground">Supports PNG, JPG, WEBP — Max 10MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImage(file);
              }}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            {/* Canvas Result */}
            <div className="relative rounded-xl overflow-hidden border border-border bg-card">
              <canvas ref={canvasRef} className="w-full h-auto" />
              {processing && (
                <div className="absolute inset-0 bg-card/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-foreground font-medium">Analyzing image...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {result && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Results</h2>
                  <div className="flex gap-2">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                      <Download className="w-4 h-4" /> Save Result
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
                      <X className="w-4 h-4" /> Clear
                    </button>
                  </div>
                </div>

                {result.success && result.results.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      {result.faces_detected} face{result.faces_detected > 1 ? 's' : ''} detected in{' '}
                      <span className="font-mono text-primary">{Math.round(result.processing_time_ms ?? 0)}ms</span>
                    </p>
                    {result.results.map((r, i) => (
                      <StatusBadge key={i} label={r.label} confidence={r.confidence} size="lg" />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{result.error || 'No faces detected.'}</p>
                )}
              </div>
            )}

            {error && (
              <div className="glass rounded-xl p-4 border-danger/30 bg-danger/5">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
        {!imageUrl && <canvas ref={canvasRef} className="hidden" />}
      </main>
    </div>
  );
}

export default function ImageDetectionPage() {
  return (
    <ModelLoader>
      <ImageView />
    </ModelLoader>
  );
}
