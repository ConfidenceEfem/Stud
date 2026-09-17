import styled from 'styled-components';
import { colors, font, radius } from '../theme';

export const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${font.mono};
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${colors.faint};
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: ${font.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: ${radius.pill};
  border: 1px solid ${(p) => p.$border || colors.stroke};
  color: ${(p) => p.$color || colors.muted};
  background: ${(p) => p.$bg || 'transparent'};

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    display: ${(p) => (p.$dot === false ? 'none' : 'block')};
  }
`;

export const statusBadgeProps = (status) => {
  switch (status) {
    case 'live':
      return { $color: colors.up, $bg: 'rgba(51,209,122,0.1)', $border: 'rgba(51,209,122,0.35)' };
    case 'upcoming':
      return { $color: colors.stamp, $bg: 'rgba(255,204,1,0.1)', $border: 'rgba(255,204,1,0.35)' };
    case 'sold out':
      return { $color: colors.faint, $bg: 'rgba(140,136,148,0.08)', $border: colors.stroke, $dot: false };
    case 'graduated':
      return { $color: colors.up, $bg: 'rgba(51,209,122,0.1)', $border: 'rgba(51,209,122,0.35)' };
    case 'bonding':
      return { $color: colors.stamp, $bg: 'rgba(255,204,1,0.1)', $border: 'rgba(255,204,1,0.35)' };
    default:
      return {};
  }
};

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: ${font.body};
  font-weight: 700;
  font-size: 13.5px;
  letter-spacing: 0.01em;
  padding: ${(p) => (p.$sm ? '8px 14px' : '12px 20px')};
  border-radius: ${radius.md};
  border: 1px solid transparent;
  transition: transform 0.12s ease, filter 0.12s ease, background 0.12s ease;

  ${(p) =>
    p.$variant === 'ghost'
      ? `
    background: transparent;
    border-color: ${colors.stroke};
    color: ${colors.paper};
    &:hover { border-color: ${colors.stamp}; color: ${colors.stamp}; }
  `
      : p.$variant === 'outline'
      ? `
    background: rgba(255,204,1,0.06);
    border-color: rgba(255,204,1,0.4);
    color: ${colors.stamp};
    &:hover { background: rgba(255,204,1,0.12); }
  `
      : `
    background: ${colors.stamp};
    color: #14110A;
    &:hover { filter: brightness(1.06); transform: translateY(-1px); }
    &:active { transform: translateY(0); }
  `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Mono = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
`;

export const PriceChange = styled.span`
  font-family: ${font.mono};
  font-size: 12.5px;
  font-weight: 600;
  color: ${(p) => (p.$value >= 0 ? colors.up : colors.down)};
  display: inline-flex;
  align-items: center;
  gap: 2px;

  &::before {
    content: '${(p) => (p.$value >= 0 ? '▲' : '▼')}';
    font-size: 9px;
  }
`;

export const Avatar = styled.div`
  width: ${(p) => p.$size || '40px'};
  height: ${(p) => p.$size || '40px'};
  border-radius: 50%;
  flex-shrink: 0;
  background: conic-gradient(from 180deg, ${colors.stamp}, #ff9a1f, ${colors.stamp});
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${font.display};
  color: ${colors.void};
  font-size: ${(p) => (p.$size ? `calc(${p.$size} * 0.42)` : '17px')};
`;

export const Divider = styled.div`
  height: 1px;
  background: ${colors.stroke};
  width: 100%;
`;

// Small pill used across the marketplace/trending/profile pages to be
// honest about whether what's on screen is real on-chain/API data or the
// bundled demo dataset (shown when an API key isn't configured yet, or a
// live fetch failed and we fell back gracefully).
export const LiveIndicator = ({ live, loading, label }) => {
  if (loading) {
    return (
      <Badge $color={colors.faint} $border={colors.stroke}>
        Loading{label ? ` ${label}` : ''}…
      </Badge>
    );
  }
  return live ? (
    <Badge $color={colors.up} $border="rgba(51,209,122,0.35)" $bg="rgba(51,209,122,0.08)">
      Live{label ? ` ${label}` : ''}
    </Badge>
  ) : (
    <Badge $color={colors.faint} $border={colors.stroke}>
      Demo data{label ? ` · ${label}` : ''}
    </Badge>
  );
};

export const Sparkline = ({ data, positive = true, width = 76, height = 28 }) => {
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const color = positive ? colors.up : colors.down;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
