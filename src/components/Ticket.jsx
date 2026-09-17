import styled from 'styled-components';
import { colors, radius, shadow } from '../theme';

// The signature element: every mintable / tradeable thing renders as a
// torn ticket stub — a top "artwork" half and a bottom "stub" half,
// separated by a perforation with punched notch holes on each edge.

export const Ticket = styled.div`
  position: relative;
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: ${radius.lg};
  overflow: hidden;
  box-shadow: ${shadow.card};
  transition: transform 0.18s ease, border-color 0.18s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 204, 1, 0.35);
  }
`;

export const TicketMedia = styled.div`
  position: relative;
  height: ${(p) => p.$h || '150px'};
  background: ${(p) =>
    p.$from && p.$to
      ? `linear-gradient(135deg, ${p.$from} 0%, ${p.$to} 100%)`
      : colors.panelRaised};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const TicketStub = styled.div`
  position: relative;
  padding: 16px 18px 18px;
  border-top: 1.5px dashed ${colors.stroke};

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -10px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${colors.void};
    border: 1px solid ${colors.stroke};
  }
  &::before {
    left: -10px;
  }
  &::after {
    right: -10px;
  }
`;

export const TicketRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;
