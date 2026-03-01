import { useEffect, useState } from 'react';
import { loadModel, isModelLoaded } from '@/services/detection';
import { Loader2, BrainCircuit } from 'lucide-react';

export default function ModelLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(!isModelLoaded());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isModelLoaded()) {
      setLoading(false);
      return;
    }
    loadModel()
      .then(() => setLoading(false))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BrainCircuit className="w-16 h-16 text-danger" />
        <p className="text-danger font-semibold text-lg">Model Load Failed</p>
        <p className="text-muted-foreground text-sm max-w-md text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <BrainCircuit className="w-16 h-16 text-primary animate-pulse-glow" />
          <Loader2 className="w-6 h-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
        </div>
        <p className="text-foreground font-semibold text-lg">Loading AI Model...</p>
        <p className="text-muted-foreground text-sm">Initializing face detection engine</p>
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
