import { createGlobalStyle } from 'styled-components';
import { colors, font } from './theme';

export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }

  html, body, #root {
    height: 100%;
  }

  body {
    margin: 0;
    background: ${colors.void};
    background-image:
      radial-gradient(ellipse 900px 500px at 15% -10%, rgba(255,204,1,0.06), transparent 60%),
      radial-gradient(ellipse 700px 500px at 100% 0%, rgba(255,204,1,0.04), transparent 55%);
    color: ${colors.paper};
    font-family: ${font.body};
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4 {
    margin: 0;
    font-family: ${font.display};
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  p { margin: 0; }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font-family: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
  }

  ::selection {
    background: ${colors.stamp};
    color: ${colors.void};
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: ${colors.void}; }
  ::-webkit-scrollbar-thumb {
    background: ${colors.stroke};
    border-radius: 999px;
    border: 2px solid ${colors.void};
  }
  ::-webkit-scrollbar-thumb:hover { background: ${colors.faint}; }

  :focus-visible {
    outline: 2px solid ${colors.stamp};
    outline-offset: 2px;
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
  }
`;
