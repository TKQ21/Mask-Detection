import { MaskLabel } from '@/services/detection';
import { Shield, ShieldAlert, ShieldX } from 'lucide-react';

interface StatusBadgeProps {
  label: MaskLabel;
  confidence: number;
  size?: 'sm' | 'lg';
}

const config: Record<MaskLabel, { icon: typeof Shield; colorClass: string; glowClass: string; bg: string }> = {
  'Mask': {
    icon: Shield,
    colorClass: 'text-success',
    glowClass: 'glow-success',
    bg: 'bg-success/10 border-success/30',
  },
  'No Mask': {
    icon: ShieldX,
    colorClass: 'text-danger',
    glowClass: 'glow-danger',
    bg: 'bg-danger/10 border-danger/30',
  },
  'Incorrect Mask': {
    icon: ShieldAlert,
    colorClass: 'text-warning',
    glowClass: 'glow-warning',
    bg: 'bg-warning/10 border-warning/30',
  },
};

export default function StatusBadge({ label, confidence, size = 'sm' }: StatusBadgeProps) {
  const c = config[label];
  const Icon = c.icon;
  const pct = Math.round(confidence * 100);

  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-4 px-6 py-4 rounded-xl border ${c.bg} ${c.glowClass}`}>
        <Icon className={`w-10 h-10 ${c.colorClass}`} />
        <div>
          <p className={`text-2xl font-bold ${c.colorClass}`}>{label}</p>
          <p className="text-sm text-muted-foreground font-mono">{pct}% confidence</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${c.bg}`}>
      <Icon className={`w-4 h-4 ${c.colorClass}`} />
      <span className={`font-semibold ${c.colorClass}`}>{label}</span>
      <span className="text-muted-foreground font-mono text-xs">{pct}%</span>
    </div>
  );
}
