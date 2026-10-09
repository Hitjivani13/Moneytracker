import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  gradient = 'gradient-primary',
  subtitle,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`${gradient} rounded-[22px] min-h-[118px] md:min-h-[128px] p-5 md:p-6 relative overflow-hidden animate-count-up shadow-lg shadow-surface-900/10 ${className}`}
      style={style}
    >
      {/* Decorative Background Icon */}
      {icon && (
        <div className="absolute top-4 right-4 opacity-[0.14] pointer-events-none">
          <div className="w-12 h-12 flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-w-0 pr-10">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] leading-tight text-white/75 break-words">
          {title}
        </p>

        <p className="text-2xl md:text-[1.7rem] font-bold text-white mt-3 tabular-nums leading-none tracking-tight break-words">
          {value}
        </p>

        {subtitle && (
          <p className="text-xs text-white/65 mt-2 leading-tight">{subtitle}</p>
        )}

        {typeof trendValue !== 'undefined' && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <div
              className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend === 'up'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/20 text-white'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{trendValue}%</span>
            </div>
            <span className="text-xs text-white/50">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}
