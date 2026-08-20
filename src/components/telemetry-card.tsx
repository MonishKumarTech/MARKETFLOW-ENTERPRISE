import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TelemetryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // e.g. +14.2 or -3.1
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
  isCurrency?: boolean;
}

const VARIANT_STYLES = {
  indigo: {
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    border: 'border-slate-800 hover:border-indigo-500/40',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    border: 'border-slate-800 hover:border-emerald-500/40',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    border: 'border-slate-800 hover:border-amber-500/40',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    border: 'border-slate-800 hover:border-rose-500/40',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    border: 'border-slate-800 hover:border-purple-500/40',
  },
};

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs target benchmark',
  icon: Icon,
  variant = 'indigo',
  isCurrency = false,
}) => {
  const styles = VARIANT_STYLES[variant];

  const formattedValue = typeof value === 'number' && isCurrency
    ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : typeof value === 'number'
    ? value.toLocaleString('en-US')
    : value;

  return (
    <div
      className={`relative bg-slate-900/60 backdrop-blur-sm border ${styles.border} rounded-2xl p-5 transition duration-200 shadow-lg shadow-black/20 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">{formattedValue}</h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${styles.iconBg} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                change > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : change < 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-slate-400 text-[11px]">{changeLabel}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">{subtitle || 'Telemetry locked & active'}</span>
        )}
      </div>
    </div>
  );
};
