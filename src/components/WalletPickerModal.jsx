import styled from 'styled-components';
import { Ghost, Flame, Hexagon, Wallet, Rabbit, ExternalLink, X, Loader2 } from 'lucide-react';
import { colors, font, radius } from '../theme';
import { useWallet } from '../context/WalletContext';

const ICONS = { Ghost, Flame, Hexagon, Wallet, Rabbit };

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
  padding: 24px;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const Title = styled.h2`
  font-size: 20px;
  color: ${colors.paper};
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: ${colors.faint};
  &:hover { color: ${colors.paper}; background: ${colors.panelRaised}; }
`;

const Sub = styled.p`
  font-size: 12.5px;
  color: ${colors.muted};
  margin-bottom: 18px;
  line-height: 1.5;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const WalletRow = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: ${radius.md};
  border: 1px solid ${colors.stroke};
  background: ${colors.panelRaised};
  text-align: left;
  transition: border-color 0.15s ease;

  &:hover { border-color: ${colors.stamp}; }
  &:disabled { opacity: 0.6; cursor: wait; }
`;

const IconCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Label = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.paper};
`;

const Status = styled.div`
  font-family: ${font.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${(p) => (p.$installed ? colors.up : colors.faint)};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ErrorBox = styled.div`
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: ${radius.md};
  border: 1px solid rgba(255, 92, 92, 0.35);
  background: rgba(255, 92, 92, 0.08);
  color: ${colors.down};
  font-size: 12px;
`;

const Spin = styled(Loader2)`
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function WalletPickerModal() {
  const { pickerOpen, closePicker, providers, connectWith, connecting, connectError } = useWallet();

  if (!pickerOpen) return null;

  return (
    <Overlay onClick={closePicker}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Head>
          <Title>Connect a wallet</Title>
          <CloseBtn onClick={closePicker} aria-label="Close"><X size={16} /></CloseBtn>
        </Head>
        <Sub>Pick the Solana wallet extension you'd like to connect with STUB.</Sub>

        <List>
          {providers.map((p) => {
            const Icon = ICONS[p.icon];
            const installed = !!p.getProvider();
            return (
              <WalletRow key={p.id} onClick={() => connectWith(p.id)} disabled={connecting}>
                <IconCircle $color={p.color}>
                  <Icon size={18} />
                </IconCircle>
                <Info>
                  <Label>{p.label}</Label>
                  <Status $installed={installed}>
                    {installed ? 'Detected' : (
                      <>
                        Not installed <ExternalLink size={10} />
                      </>
                    )}
                  </Status>
                </Info>
                {connecting && <Spin size={16} color={colors.stamp} />}
              </WalletRow>
            );
          })}
        </List>

        {connectError && <ErrorBox>{connectError}</ErrorBox>}
      </Card>
    </Overlay>
  );
}
