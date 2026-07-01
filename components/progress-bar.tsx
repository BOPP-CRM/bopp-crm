import { CSSProperties } from "react";
import { useApp } from "./providers/app-provider";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  barClassName?: string;
  trackClassName?: string;
  style?: CSSProperties;
  valueFormatter?: (value: number, percentage: number) => string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  className = "",
  barClassName = "",
  trackClassName = "",
  style,
  valueFormatter,
}: ProgressBarProps) {
  const { clientConfig } = useApp();

  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = (clampedValue / safeMax) * 100;
  const formattedValue = valueFormatter
    ? valueFormatter(clampedValue, percentage)
    : `${Math.round(percentage)}%`;

  return (
    <div className={`w-full ${className}`} style={style}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label ? (
            <span className="text-sm font-medium text-current">{label}</span>
          ) : (
            <span />
          )}
          {showValue && (
            <span className="text-sm font-semibold text-current">
              {formattedValue}
            </span>
          )}
        </div>
      )}

      <div
        className={`h-1.5 w-full rounded-full ${trackClassName}`}
        style={{
          background: clientConfig.ui.text_gray_color,
        }}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out relative ${barClassName}`}
          style={{
            width: `${percentage}%`,
            background: clientConfig.ui.primary_color,
          }}
        >
          <div
            className="absolute w-4 h-4 rounded-full right-0 top-1/2 transform -translate-y-1/2 z-2"
            style={{
              boxShadow: `0 0 0 3px ${clientConfig.ui.background_color}, 0 0 14px ${clientConfig.ui.primary_color}`,
              background: clientConfig.ui.primary_color,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
