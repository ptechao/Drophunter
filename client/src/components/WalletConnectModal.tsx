import { useState, useEffect, useRef } from 'react';
import { Loader2, QrCode, X, Wallet } from 'lucide-react';
import QRCode from 'qrcode';
import { ethers } from 'ethers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

let _wcProvider: any = null;

async function getWcProvider() {
  if (_wcProvider) return _wcProvider;
  const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
  _wcProvider = await EthereumProvider.init({
    projectId: '9b0a7f0e9e3dc5e3a5f3c5e8b6f1a2d3',
    chains: [1, 137, 8453],
    showQrModal: false,
    metadata: {
      name: 'DropHunter',
      description: 'AI 空投獵人',
      url: 'https://drophunter.gocc.store',
      icons: [],
    },
  });
  return _wcProvider;
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [metaMaskConnecting, setMetaMaskConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile] = useState(() => isMobileDevice());

  const hasMetaMask = typeof window !== 'undefined'
    && typeof (window as any).ethereum !== 'undefined'
    && (window as any).ethereum.isMetaMask;

  useEffect(() => {
    if (!isOpen) return;
    setUri(null);
    setError(null);
    // On desktop with MetaMask: try direct first
    // On mobile: always use WalletConnect deep link
    if (hasMetaMask && !isMobile) {
      connectMetaMaskDirectly();
    } else {
      startWalletConnect();
    }
  }, [isOpen]);

  useEffect(() => {
    // Only render QR on desktop
    if (uri && canvasRef.current && !isMobile) {
      QRCode.toCanvas(canvasRef.current, uri, {
        width: 240,
        margin: 2,
        color: { dark: '#F0B90B', light: '#0A0A0F' },
      });
    }
  }, [uri, isMobile]);

  const connectMetaMaskDirectly = async () => {
    setMetaMaskConnecting(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        onConnect(accounts[0]);
        onClose();
      }
    } catch (e: any) {
      if (e?.code === 4001) {
        setError('MetaMask 連線已取消');
      } else {
        setError('MetaMask 連線失敗：' + (e?.message || '未知錯誤'));
      }
    } finally {
      setMetaMaskConnecting(false);
    }
  };

  const startWalletConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const provider = await getWcProvider();
      provider.on('display_uri', (newUri: string) => {
        setUri(newUri);
      });
      provider.on('disconnect', () => {
        setUri(null);
        setConnecting(false);
        setError('WalletConnect 已斷開');
      });
      await provider.connect();
      const accounts: string[] = provider.accounts;
      if (accounts.length > 0) {
        (window as any).__wcProvider = provider;
        onConnect(accounts[0]);
        onClose();
      }
    } catch (e: any) {
      if (e?.message?.includes('rejected') || e?.message?.includes('User rejected')) {
        setError('連線已取消');
      } else {
        setError('連線失敗：' + (e?.message || '未知錯誤'));
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (_wcProvider) {
      _wcProvider.disconnect().catch(() => {});
      _wcProvider = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleDisconnect}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gold" />
            連接錢包
          </h3>
          <button onClick={handleDisconnect} className="text-foreground/40 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="text-center space-y-3 py-4">
            <p className="text-red-400 text-sm">{error}</p>
            <div className="flex gap-2 justify-center">
              {hasMetaMask && (
                <button onClick={connectMetaMaskDirectly} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-black hover:bg-blue-600">
                  重試 MetaMask
                </button>
              )}
              <button onClick={startWalletConnect} className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-black hover:bg-gold/80">
                重試 WalletConnect
              </button>
            </div>
          </div>
        ) : connecting && !uri ? (
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <p className="text-sm text-foreground/60">正在建立連線...</p>
          </div>
        ) : metaMaskConnecting ? (
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-sm text-foreground/60">正在連接 MetaMask...</p>
          </div>
        ) : uri ? (
          isMobile ? (
            /* Mobile: deep link button only — no QR code (can't scan on same phone) */
            <div className="space-y-3 text-center py-4">
              <p className="text-sm text-foreground/60">點擊下方按鈕在錢包 App 中授權</p>
              <a
                href={uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gold text-black py-3 rounded-xl text-sm font-black hover:bg-gold/80 transition-colors"
              >
                在錢包中開啟
              </a>
              <p className="text-xs text-foreground/40">
                支援 MetaMask、TrustWallet、OKX、Coinbase Wallet 等
              </p>
            </div>
          ) : (
            /* Desktop: QR code for scanning with mobile wallet */
            <div className="space-y-3 text-center">
              <p className="text-sm text-foreground/60">用手機錢包掃描 QR code 連線</p>
              <div className="bg-white rounded-xl p-3 inline-block">
                <canvas ref={canvasRef} />
              </div>
              <p className="text-xs text-foreground/40">
                或使用 <a href={uri} target="_blank" rel="noopener noreferrer" className="text-gold underline">WalletConnect 桌面客戶端</a>
              </p>
            </div>
          )
        ) : hasMetaMask && !isMobile ? (
          /* Desktop with MetaMask: show MetaMask button + WC alternative */
          <div className="text-center space-y-3 py-4">
            <button onClick={connectMetaMaskDirectly} className="block w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-black hover:bg-blue-600 transition-colors">
              連接 MetaMask
            </button>
            <p className="text-xs text-foreground/40">或使用其他錢包</p>
            <button onClick={startWalletConnect} className="block w-full border border-border bg-muted/50 py-2.5 rounded-xl text-sm font-black hover:bg-muted transition-colors">
              使用 WalletConnect
            </button>
          </div>
        ) : (
          /* No MetaMask (mobile or desktop): auto-start WalletConnect */
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <p className="text-sm text-foreground/60">正在準備 WalletConnect...</p>
          </div>
        )}
      </div>
    </div>
  );
}