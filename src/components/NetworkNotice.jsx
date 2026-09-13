import styled from 'styled-components';
import { AlertTriangle } from 'lucide-react';
import { colors, font, radius } from '../theme';
import { NETWORK } from '../config/env';

const Box = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  margin-top: 14px;
  border-radius: ${radius.md};
  border: 1px solid rgba(255,204,1,0.3);
  background: rgba(255,204,1,0.06);
  font-size: 12px;
  line-height: 1.5;
  color: ${colors.muted};

  code {
    font-family: ${font.mono};
    color: ${colors.paper};
  }
`;

// Shown on Create/Launch pages. The #1 cause of "wallet says insufficient
// balance right after I used the faucet" is that the wallet extension's
// active network doesn't match this app's — wallets check balance against
// whatever cluster *they're* set to, completely independent of the RPC
// this app talks to. This makes that mismatch obvious up front instead of
// after a confusing failed transaction.
export default function NetworkNotice() {
  return (
    <Box>
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} color={colors.stamp} />
      <span>
        This app is set to <code>{NETWORK}</code>. Make sure your wallet extension is on the{' '}
        <b>same network</b> — in Phantom: Settings → Developer Settings → Testnet Mode → Devnet.
        If your wallet says "insufficient balance" right after using a faucet, this mismatch is
        almost always why: the wallet is checking a different network's balance than the one you
        funded.
      </span>
    </Box>
  );
}
