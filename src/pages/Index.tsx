import { Link } from 'react-router-dom';
import { Camera, ImageIcon, Shield, ShieldAlert, ShieldX, Scan, BrainCircuit, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(hsl(175 80% 45% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(175 80% 45% / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="relative z-10 max-w-2xl mx-auto text-center animate-fade-in-up">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-8 glow-primary">
            <Scan className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tight">
            Face Mask
            <span className="text-primary"> Detection</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto">
            Real-time AI-powered mask detection using your camera or uploaded images
          </p>

          {/* Action Cards */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-16">
            <Link
              to="/camera"
              className="group glass rounded-xl p-6 text-left hover:border-primary/50 transition-all duration-300 hover:glow-primary"
            >
              <Camera className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="text-lg font-bold text-foreground mb-1">Live Camera</h2>
              <p className="text-sm text-muted-foreground">Real-time detection via webcam</p>
            </Link>

            <Link
              to="/upload"
              className="group glass rounded-xl p-6 text-left hover:border-primary/50 transition-all duration-300 hover:glow-primary"
            >
              <ImageIcon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="text-lg font-bold text-foreground mb-1">Upload Image</h2>
              <p className="text-sm text-muted-foreground">Analyze any photo for masks</p>
            </Link>
          </div>

          {/* Detection Labels */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20 text-sm">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-success font-medium">Mask</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 border border-danger/20 text-sm">
              <ShieldX className="w-4 h-4 text-danger" />
              <span className="text-danger font-medium">No Mask</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <ShieldAlert className="w-4 h-4 text-warning" />
              <span className="text-warning font-medium">Incorrect Mask</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <BrainCircuit className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">TensorFlow.js<br />AI Engine</p>
            </div>
            <div>
              <Zap className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Real-time<br />Processing</p>
            </div>
            <div>
              <Shield className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Multi-face<br />Detection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>© 2026 Mohd Kaif</p>
        <p className="mt-1 text-xs">Built with AI assistance</p>
      </footer>
    </div>
  );
};

export default Index;
