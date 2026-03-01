import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, CameraOff, Users, Timer, Activity } from 'lucide-react';
import { detectFromCanvas, DetectionResponse } from '@/services/detection';
import StatusBadge from '@/components/StatusBadge';
import ModelLoader from '@/components/ModelLoader';
import { drawDetections } from '@/components/DetectionOverlay';

function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [fps, setFps] = useState(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const fpsFrames = useRef(0);
  const fpsTime = useRef(performance.now());

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
        setError(null);
      }
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (e.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please try again.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const detect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !overlayRef.current || videoRef.current.paused) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas.getContext('2d')!;
    const octx = overlay.getContext('2d')!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const now = performance.now();
    // Throttle detection to ~10fps
    if (now - lastTimeRef.current > 100) {
      lastTimeRef.current = now;
      const res = await detectFromCanvas(canvas);
      setResult(res);

      // Draw overlay
      octx.clearRect(0, 0, overlay.width, overlay.height);
      if (res.results.length > 0) {
        drawDetections(octx, res.results);
      }
    }

    // FPS counter
    fpsFrames.current++;
    if (now - fpsTime.current > 1000) {
      setFps(fpsFrames.current);
      fpsFrames.current = 0;
      fpsTime.current = now;
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (streaming) {
      animFrameRef.current = requestAnimationFrame(detect);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [streaming, detect]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Live Detection
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-primary">
              <Activity className="w-3 h-3" />
              {fps} FPS
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <CameraOff className="w-16 h-16 text-danger" />
            <p className="text-danger font-semibold text-lg">Camera Error</p>
            <p className="text-muted-foreground text-center max-w-md">{error}</p>
            <button onClick={startCamera} className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2">
              <div className="relative rounded-xl overflow-hidden border border-border bg-card aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <canvas ref={overlayRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

                {!streaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card">
                    <div className="animate-pulse text-muted-foreground">Starting camera...</div>
                  </div>
                )}

                {/* Scan line effect */}
                <div className="absolute inset-0 scan-line pointer-events-none" />
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Detection Status</h2>

                {result?.success && result.results.length > 0 ? (
                  <div className="space-y-3">
                    {result.results.map((r, i) => (
                      <StatusBadge key={i} label={r.label} confidence={r.confidence} size="lg" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      {result?.error || 'Waiting for face detection...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stats</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold font-mono text-foreground">{result?.faces_detected ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Faces</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold font-mono text-primary">{result?.processing_time_ms ? Math.round(result.processing_time_ms) : '—'}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Timer className="w-3 h-3" /> ms
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CameraDetectionPage() {
  return (
    <ModelLoader>
      <CameraView />
    </ModelLoader>
  );
}
