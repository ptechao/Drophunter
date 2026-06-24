import { useState, useEffect, useRef } from 'react';
import { Loader2, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { ethers } from 'ethers'; // Import ethers for direct MetaMask connection

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
    projectId: '9b0a7f0e9e3dc5e3a5f3c5e8b6f1a2d3', // public demo projectId — replace with your own at https://cloud.reown.com
    chains: [1, 137, 8453], // Ethereum, Polygon, Base
    showQrModal: false, // we render our own QR
    metadata: {
      name: 'DropHunter',
      description: 'AI 空投獵人',
      url: 'https://drophunter.gocc.store',
      icons: [],
    },
  });
  return _wcProvider;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false); // For WalletConnect
  const [metamaskConnecting, setMetamaskConnecting] = useState(false); // For direct MetaMask
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check for window.ethereum availability and if it's MetaMask
  const hasMetaMask = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined' && (window as any).ethereum.isMetaMask;

  useEffect(() => {
    if (!isOpen) return;
    setUri(null);
    setError(null);
    // If MetaMask is available, try direct connection first
    if (hasMetaMask) {
      connectMetamaskDirectly();
    } else {
      startConnection(); // Otherwise, proceed with WalletConnect QR/deep link
    }
  }, [isOpen, hasMetaMask]); // Add hasMetaMask to dependency array

  useEffect(() => {
    if (uri && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, uri, { width: 240, margin: 2, color: { dark: '#F0B90B', light: '#0A0A0F' } });
    }
  }, [uri]);

  const connectMetamaskDirectly = async () => {
    setMetamaskConnecting(true);
    setError(null);
    try {
      if (!hasMetaMask) {
        setError('MetaMask 未安裝或未檢測到');
        return;
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      onConnect(address);
      onClose(); // Close modal on successful connection
    } catch (e: any) {
      if (e?.code === 4001 || e?.message?.includes('User rejected')) {
        setError('MetaMask 連線已取消');
      } else {
        setError('MetaMask 連線失敗：' + (e?.message || '未知錯誤'));
      }
    } finally {
      setMetamaskConnecting(false);
    }
  };

  const startConnection = async () => {
    setConnecting(true);
    setError(null);
    try {
      const provider = await getWcProvider();

      // Listen for display_uri (for QR code and deep link)
      provider.on('display_uri', (newUri: string) => {
        setUri(newUri);
      });
      // Handle session_event (account change, network change)
      provider.on('session_event', (event: any) => {
        console.log('WalletConnect Session event', event);
        // Implement logic for account/network changes if needed
      });
      // Handle disconnect
      provider.on('disconnect', () => {
        console.log('WalletConnect Disconnected');
        // Handle UI changes on disconnect
        setUri(null);
        setConnecting(false);
        setError('WalletConnect 已斷開');
      });

      // Connect
      await provider.connect();
      const accounts: string[] = provider.accounts; // Accounts are available after connect()

      if (accounts.length > 0) {
        // Store provider for ethers
        (window as any).__wcProvider = provider;
        onConnect(accounts[0]);
        onClose(); // Close modal on successful connection
      }
    } catch (e: any) {
      if (e?.message?.includes('rejected') || e?.message?.includes('User rejected')) {
        setError('WalletConnect 連線已取消');
      } else {
        // More specific error handling for WalletConnect init/connect failures
        setError('WalletConnect 連線失敗：' + (e?.message || '未知錯誤') + '. 請檢查網路或專案 ID。');
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
            <QrCode className="w-5 h-5 text-gold" />
            連接錢包
          </h3>
          <button onClick={handleDisconnect} className="text-foreground/40 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="text-center space-y-3 py-4">
            <p className="text-red-400 text-sm">{error}</p>
            {hasMetaMask && !metamaskConnecting && ( // Show only if MetaMask is available and not currently connecting
                <button onClick={connectMetamaskDirectly} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-black mr-2 hover:bg-blue-600">
                  重試 MetaMask
                </button>
            )}
            <button onClick={startConnection} className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-black hover:bg-gold/80">
              重試 WalletConnect
            </button>
          </div>
        ) : (hasMetaMask && !connecting && !metamaskConnecting && !uri) ? ( // MetaMask detected, not connected yet
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-foreground/60">檢測到 MetaMask，將直接連接。</p>
            <button onClick={connectMetamaskDirectly} className="block w-full bg-blue-500 text-white py-2.5 rounded-lg text-sm font-black text-center hover:bg-blue-600">
              {metamaskConnecting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '連接 MetaMask'}
            </button>
            <p className="text-xs text-foreground/40">或選擇其他錢包</p>
            <button onClick={startConnection} className="block w-full bg-gray-700 text-white py-2.5 rounded-lg text-sm font-black text-center hover:bg-gray-600">
              使用 WalletConnect
            </button>
          </div>
        ) : (metamaskConnecting) ? ( // MetaMask direct connecting state
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="ml-2 text-sm text-foreground/60">正在連接 MetaMask...</p>
            </div>
        ) : (connecting && !uri) ? ( // WalletConnect connecting, no URI yet
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <p className="ml-2 text-sm text-foreground/60">等待 WalletConnect URI...</p>
          </div>
        ) : uri ? ( // WalletConnect URI available (show QR and deep link)
          <div className="space-y-3 text-center">
            <p className="text-sm text-foreground/60">請用 MetaMask 或其他錢包掃描 QR code</p>
            <div className="bg-white rounded-xl p-3 inline-block">
              <canvas ref={canvasRef} />
            </div>
            <p className="text-xs text-foreground/40">或點擊下方按鈕在錢包 app 中開啟</p>
            <a
              href={uri} // Kept original href={uri} for WalletConnect deep linking
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gold text-black py-2.5 rounded-lg text-sm font-black text-center hover:bg-gold/80"
            >
              在錢包中開啟 (Deep Link)
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
