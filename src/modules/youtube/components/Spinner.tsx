import { CSSProperties, memo } from 'react';

export interface SpinnerProps {
  size?: number;
  label?: string;
}

function SpinnerComponent({ size = 24, label = 'Loading' }: SpinnerProps) {
  const style = { '--yt-spinner-size': `${size}px` } as CSSProperties;

  return (
    <span role="status" aria-label={label} style={style}>
      <span className="yt-spinner" />
      <span className="yt-visually-hidden">{label}</span>
    </span>
  );
}

export const Spinner = memo(SpinnerComponent);
