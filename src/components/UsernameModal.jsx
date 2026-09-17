import { useState } from 'react';
import styled from 'styled-components';
import { Ticket as TicketIcon } from 'lucide-react';
import { colors, font, radius } from '../theme';
import { useWallet } from '../context/WalletContext';
import { Button } from './Atoms';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(11, 11, 13, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 380px;
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: 18px;
  padding: 30px 28px;
  text-align: center;
`;

const IconCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${colors.stamp};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.void};
  margin: 0 auto 16px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: ${colors.paper};
`;

const Sub = styled.p`
  font-size: 13px;
  color: ${colors.muted};
  margin-top: 8px;
  line-height: 1.5;
`;

const WalletTag = styled.div`
  font-family: ${font.mono};
  font-size: 11px;
  color: ${colors.faint};
  margin-top: 12px;
  padding: 6px 12px;
  border: 1px solid ${colors.stroke};
  border-radius: ${radius.pill};
  display: inline-block;
`;

const Input = styled.input`
  width: 100%;
  margin-top: 20px;
  background: ${colors.panelRaised};
  border: 1px solid ${(p) => (p.$invalid ? colors.down : colors.stroke)};
  border-radius: ${radius.md};
  padding: 12px 14px;
  font-size: 14px;
  color: ${colors.paper};
  text-align: center;
  font-family: ${font.mono};

  &:focus { border-color: ${colors.stamp}; outline: none; }
  &::placeholder { color: ${colors.faint}; }
`;

const ErrorText = styled.div`
  font-size: 11.5px;
  color: ${colors.down};
  margin-top: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

export default function UsernameModal() {
  const { needsUsername, address, saveUsername, disconnect } = useWallet();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (!needsUsername) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return setError('Pick a username to continue.');
    if (trimmed.length < 3) return setError('Username must be at least 3 characters.');
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) return setError('Letters, numbers, "_" and "." only.');
    saveUsername(trimmed);
  };

  return (
    <Overlay>
      <Card>
        <IconCircle>
          <TicketIcon size={22} />
        </IconCircle>
        <Title>Welcome to STUB</Title>
        <Sub>First time connecting this wallet — pick a username. It's saved for next time, so you won't be asked again.</Sub>
        <WalletTag>{address.slice(0, 6)}…{address.slice(-6)}</WalletTag>
        <Input
          placeholder="e.g. ferro.sol"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          $invalid={!!error}
          autoFocus
        />
        {error && <ErrorText>{error}</ErrorText>}
        <Actions>
          <Button $variant="ghost" style={{ flex: 1 }} onClick={disconnect}>
            Cancel
          </Button>
          <Button style={{ flex: 1 }} onClick={submit}>
            Save & continue
          </Button>
        </Actions>
      </Card>
    </Overlay>
  );
}
