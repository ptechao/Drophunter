import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  address: null,
  user: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if MetaMask is installed
  const hasProvider = typeof window !== 'undefined' && !!(window as any).ethereum;

  // Reconnect on mount
  useEffect(() => {
    const stored = localStorage.getItem('dh_address');
    if (stored && hasProvider) {
      // Verify still connected
      const eth = (window as any).ethereum;
      eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0 && accounts[0].toLowerCase() === stored.toLowerCase()) {
          setAddress(accounts[0]);
          registerAndFetch(accounts[0]);
        } else {
          localStorage.removeItem('dh_address');
        }
      }).catch(() => {
        localStorage.removeItem('dh_address');
      });
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!hasProvider) return;
    const eth = (window as any).ethereum;
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
    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);
    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

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

  const connect = useCallback(async () => {
    if (!hasProvider) {
      alert('請安裝 MetaMask 錢包');
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        localStorage.setItem('dh_address', accounts[0]);
        await registerAndFetch(accounts[0]);
      }
    } catch (e: any) {
      if (e?.code !== 4001) console.error('Wallet connect failed:', e);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = () => {
    setAddress(null);
    setUser(null);
    localStorage.removeItem('dh_address');
  };

  const refreshUser = async () => {
    if (address) await registerAndFetch(address);
  };

  return (
    <AuthContext.Provider value={{ address, user, isConnecting, connect, disconnect, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
