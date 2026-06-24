import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';

export interface UserInfo {
  id: number;
  address: string;
  email: string | null;
  tier: 'free' | 'vip';
  referralCode: string;
  referrerId: number | null;
  createdAt: string;
}

interface AuthState {
  address: string | null;
  user: UserInfo | null;
  isConnecting: boolean;
  hasProvider: boolean;
  isMobile: boolean;
  connect: () => Promise<void>;
  openMetaMaskApp: () => void;
  disconnect: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  address: null,
  user: null,
  isConnecting: false,
  hasProvider: false,
  isMobile: false,
  connect: async () => {},
  openMetaMaskApp: () => {},
  disconnect: () => {},
  refreshUser: async () => {},
});

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
}

function detectProvider(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(w.ethereum || w.coinbaseWalletExtension || w.okxwallet || w.phantom?.ethereum);
}

function getProvider() {
  const w = window as any;
  return w.ethereum || w.coinbaseWalletExtension || w.okxwallet || w.phantom?.ethereum || null;
}

function cleanAutoConnectParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('dh_connect')) return;
  url.searchParams.delete('dh_connect');
  const qs = url.searchParams.toString();
  window.history.replaceState({}, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
}

function buildMetaMaskDappLink() {
  const url = new URL(window.location.href);
  url.searchParams.set('dh_connect', '1');

  // MetaMask dapp links open the URL inside MetaMask's in-app browser.
  // Format must be host + path (no https:// and no URL-encoding).
  const dappTarget = `${url.host}${url.pathname}${url.search}${url.hash}`;
  return `https://metamask.app.link/dapp/${dappTarget}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [isMobile] = useState(() => isMobileDevice());
  const autoConnectAttempted = useRef(false);

  // Detect injected wallet provider. MetaMask mobile injects only inside its in-app browser.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = isMobile ? 12 : 20;

    const check = () => {
      if (cancelled) return;
      if (detectProvider()) {
        setHasProvider(true);
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) setTimeout(check, 300);
    };

    check();
    return () => { cancelled = true; };
  }, [isMobile]);

  const registerAndFetch = async (addr: string) => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      const res = await fetch('/api/trpc/users.register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: addr, referralCode: ref || undefined }),
      });
      const json = await res.json();
      const u = json?.result?.data;
      if (u) setUser(u);
    } catch (e) {
      console.error('Register failed:', e);
    }
  };

  const openMetaMaskApp = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.location.href = buildMetaMaskDappLink();
  }, []);

  const connect = useCallback(async () => {
    if (!hasProvider) {
      alert(isMobile ? '手機瀏覽器無法直接授權。請按「用 MetaMask App 登入」，會開啟 MetaMask 內建瀏覽器完成授權。' : '未檢測到錢包。桌面端請安裝 MetaMask 擴展。');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = getProvider();
      if (!provider) {
        alert('錢包未就緒');
        return;
      }

      const bp = new BrowserProvider(provider);
      const accounts = await bp.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        localStorage.setItem('dh_address', accounts[0]);
        await registerAndFetch(accounts[0]);
        cleanAutoConnectParam();
      }
    } catch (e: any) {
      if (e?.code !== 4001) console.error('Wallet connect failed:', e);
    } finally {
      setIsConnecting(false);
    }
  }, [hasProvider, isMobile]);

  // Reconnect on desktop / injected wallet browsers.
  useEffect(() => {
    if (!hasProvider || isMobile) return;
    const stored = localStorage.getItem('dh_address');
    if (!stored) return;
    const provider = getProvider();
    if (!provider) return;

    provider.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0 && accounts[0].toLowerCase() === stored.toLowerCase()) {
        setAddress(accounts[0]);
        registerAndFetch(accounts[0]);
      } else {
        localStorage.removeItem('dh_address');
      }
    }).catch(() => {
      localStorage.removeItem('dh_address');
    });
  }, [hasProvider, isMobile]);

  // Keep mobile users logged in locally after they return from MetaMask.
  useEffect(() => {
    if (!isMobile) return;
    const stored = localStorage.getItem('dh_address');
    if (stored) {
      setAddress(stored);
      registerAndFetch(stored);
    }
  }, [isMobile]);

  // Account / chain changes for injected wallets.
  useEffect(() => {
    if (!hasProvider || isMobile) return;
    const provider = getProvider();
    if (!provider?.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setUser(null);
        localStorage.removeItem('dh_address');
      } else {
        setAddress(accounts[0]);
        localStorage.setItem('dh_address', accounts[0]);
        registerAndFetch(accounts[0]);
      }
    };
    const handleChainChanged = () => window.location.reload();

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [hasProvider, isMobile]);

  // Mobile Chrome/Safari flow:
  // 1) User taps "用 MetaMask App 登入" -> opens metamask.app.link/dapp/<current-url>?dh_connect=1
  // 2) MetaMask opens the same page inside its in-app browser and injects window.ethereum
  // 3) This effect auto-starts eth_requestAccounts so the authorization sheet appears immediately.
  useEffect(() => {
    if (autoConnectAttempted.current || !hasProvider) return;
    const shouldAutoConnect = new URLSearchParams(window.location.search).get('dh_connect') === '1';
    if (!shouldAutoConnect) return;

    autoConnectAttempted.current = true;
    connect().finally(cleanAutoConnectParam);
  }, [hasProvider, connect]);

  const disconnect = () => {
    setAddress(null);
    setUser(null);
    localStorage.removeItem('dh_address');
    setHasProvider(detectProvider());
  };

  const refreshUser = async () => {
    if (address) await registerAndFetch(address);
  };

  return (
    <AuthContext.Provider value={{ address, user, isConnecting, hasProvider, isMobile, connect, openMetaMaskApp, disconnect, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
