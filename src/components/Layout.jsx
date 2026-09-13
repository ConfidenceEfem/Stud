import styled from 'styled-components';
import { colors, font } from '../theme';

export const Page = styled.main`
  max-width: 1240px;
  margin: 0 auto;
  padding: 40px 28px 90px;

  @media (max-width: 860px) {
    padding: 28px 16px 70px;
  }
`;

export const Section = styled.section`
  margin-top: ${(p) => p.$mt || '56px'};
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: 30px;
  color: ${colors.paper};
`;

export const SectionLink = styled.a`
  font-family: ${font.mono};
  font-size: 12px;
  color: ${colors.faint};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    color: ${colors.stamp};
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols || 3}, 1fr);
  gap: ${(p) => p.$gap || '20px'};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const ScrollRow = styled.div`
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x proximity;

  & > * {
    scroll-snap-align: start;
    flex: 0 0 270px;
  }
`;

export const Panel = styled.div`
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: 16px;
  padding: 22px;
`;
