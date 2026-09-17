// STUB design tokens — "trading terminal meets ticket counter"
export const colors = {
  void: '#0B0B0D',          // page background
  panel: '#151318',         // card / panel background
  panelRaised: '#1C1A21',   // hovered / raised panel
  stroke: '#2A2731',        // hairline borders, perforation lines
  stamp: '#FFCC01',         // brand yellow — the "ticket stamp"
  stampDim: '#4D3F00',      // yellow at low value, for tinted fills
  paper: '#F3EFE4',         // warm off-white, ticket-paper text
  muted: '#8C8894',         // secondary text
  faint: '#57535E',         // tertiary text / disabled
  up: '#33D17A',            // positive price movement
  down: '#FF5C5C',          // negative price movement
};

export const font = {
  display: `'Bebas Neue', 'Arial Narrow', sans-serif`, // stamped headline face
  body: `'Inter', -apple-system, sans-serif`,           // reading face
  mono: `'JetBrains Mono', 'SFMono-Regular', monospace`, // data / prices / wallets
};

export const radius = {
  sm: '4px',
  md: '10px',
  lg: '18px',
  pill: '999px',
};

export const shadow = {
  card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
  stamp: '0 0 0 1px rgba(255,204,1,0.35), 0 0 24px rgba(255,204,1,0.12)',
};
