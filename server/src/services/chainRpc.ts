/**
 * Chain RPC Service — Multi-chain on-chain operations via public RPCs
 * 
 * Capabilities:
 * - Transaction verification (check if a tx was confirmed on-chain)
 * - Wallet balance queries (native + ERC20)
 * - Contract event/log reading (for airdrop task verification)
 * - Multi-chain support: 10 chains, all free public RPCs
 * 
 * Uses free public RPCs — no API key required.
 * Falls back to QuickNode if QUICKNODE_RPC_URL env var is set and working.
 */
import 'dotenv/config';
import { ethers } from 'ethers';

// Standard ERC20 ABI for balanceOf
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

/** Public RPC URLs per chain (free, no API key needed) */
const PUBLIC_RPCS: Record<number, string> = {
  1:      'https://eth.llamarpc.com',
  10:     'https://mainnet.optimism.io',
  56:     'https://bsc-dataseed.binance.org',
  137:    'https://1rpc.io/matic',
  324:    'https://mainnet.era.zksync.io',
  8453:   'https://mainnet.base.org',
  42161:  'https://arb1.arbitrum.io/rpc',
  43114:  'https://api.avax.network/ext/bc/C/rpc',
  534352: 'https://rpc.scroll.io',
  59144:  'https://rpc.linea.build',
};

/** Chain name + native token symbol */
const CHAIN_INFO: Record<number, { name: string; symbol: string }> = {
  1:      { name: 'Ethereum',   symbol: 'ETH' },
  10:     { name: 'Optimism',   symbol: 'ETH' },
  56:     { name: 'BSC',        symbol: 'BNB' },
  137:    { name: 'Polygon',    symbol: 'POL' },
  324:    { name: 'zkSync Era', symbol: 'ETH' },
  8453:   { name: 'Base',       symbol: 'ETH' },
  42161:  { name: 'Arbitrum',   symbol: 'ETH' },
  43114:  { name: 'Avalanche',  symbol: 'AVAX' },
  534352: { name: 'Scroll',     symbol: 'ETH' },
  59144:  { name: 'Linea',      symbol: 'ETH' },
};

/** Chain IDs and their RPCs */
export const SUPPORTED_CHAINS: Record<number, { name: string; rpc: string }> = {};
for (const [chainId, rpc] of Object.entries(PUBLIC_RPCS)) {
  const id = Number(chainId);
  SUPPORTED_CHAINS[id] = { name: CHAIN_INFO[id]?.name || `Chain ${id}`, rpc };
}

/** Get a provider for a specific chain */
function getProvider(chainId: number = 137): ethers.JsonRpcProvider {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain?.rpc) throw new Error(`Unsupported chain: ${chainId}`);
  return new ethers.JsonRpcProvider(chain.rpc);
}

// =============================================================================
// Transaction Verification
// =============================================================================

interface TxVerification {
  txHash: string;
  confirmed: boolean;
  blockNumber?: number;
  from?: string;
  to?: string;
  value?: string;
  status?: number;
  chainId: number;
  error?: string;
}

export async function verifyTransaction(
  txHash: string,
  chainId: number = 137
): Promise<TxVerification> {
  const provider = getProvider(chainId);

  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return { txHash, confirmed: false, chainId, error: 'Transaction not found' };
    }
    const receipt = await tx.wait(1);
    return {
      txHash,
      confirmed: true,
      blockNumber: tx.blockNumber ?? undefined,
      from: tx.from,
      to: tx.to ?? undefined,
      value: tx.value.toString(),
      status: receipt?.status ?? undefined,
      chainId,
    };
  } catch (err: any) {
    return { txHash, confirmed: false, chainId, error: err.message };
  }
}

// =============================================================================
// Wallet Balance
// =============================================================================

interface BalanceResult {
  address: string;
  chainId: number;
  native: string;
  nativeFormatted: string;
  symbol: string;
}

export async function getNativeBalance(
  address: string,
  chainId: number = 137
): Promise<BalanceResult> {
  const provider = getProvider(chainId);
  const info = CHAIN_INFO[chainId] || { name: 'Unknown', symbol: 'ETH' };
  const balance = await provider.getBalance(address);
  return {
    address,
    chainId,
    native: balance.toString(),
    nativeFormatted: ethers.formatEther(balance),
    symbol: info.symbol,
  };
}

export async function getERC20Balance(
  tokenAddress: string,
  walletAddress: string,
  chainId: number = 137
): Promise<{ address: string; token: string; balance: string; formatted: string }> {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(walletAddress);
  return {
    address: walletAddress,
    token: tokenAddress,
    balance: balance.toString(),
    formatted: ethers.formatUnits(balance, 6),
  };
}

// =============================================================================
// Contract Event Scanning
// =============================================================================

interface ContractEvent {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

export async function getContractEvents(
  contractAddress: string,
  eventSignature: string = '*',
  fromBlock: string | number = 'latest',
  toBlock: string | number = 'latest',
  filterAddress?: string,
  chainId: number = 137
): Promise<ContractEvent[]> {
  const provider = getProvider(chainId);

  let resolvedFrom: number | string = fromBlock;
  if (typeof fromBlock === 'string' && fromBlock.startsWith('latest')) {
    const latest = await provider.getBlockNumber();
    const match = fromBlock.match(/latest\s*-\s*(\d+)/);
    resolvedFrom = match ? latest - Number(match[1]) : latest;
  }

  let resolvedTo: number | string = toBlock;
  if (toBlock === 'latest') {
    resolvedTo = await provider.getBlockNumber();
  }

  const filter: any = {
    address: contractAddress,
    fromBlock: resolvedFrom,
    toBlock: resolvedTo,
  };

  if (eventSignature && eventSignature !== '*') {
    filter.topics = [eventSignature];
  }

  const logs = await provider.getLogs(filter);

  const results = logs.map(log => ({
    address: log.address,
    topics: log.topics as string[],
    data: log.data,
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    logIndex: log.index,
  }));

  if (filterAddress) {
    const addressTopic = ethers.zeroPadValue(filterAddress.toLowerCase(), 32);
    return results.filter(e => e.topics[1]?.toLowerCase() === addressTopic);
  }

  return results;
}

// =============================================================================
// Airdrop Task Verification
// =============================================================================

interface TaskCheck {
  taskId: number;
  instruction: string;
  type: 'link' | 'tx' | 'social';
  completed: boolean;
  evidence?: string;
  detail?: string;
}

export async function verifyAirdropTasks(
  address: string,
  tasks: { id: number; instruction: string; type: string; url?: string }[],
  chainId: number = 137
): Promise<TaskCheck[]> {
  const results: TaskCheck[] = [];

  for (const task of tasks) {
    if (task.type === 'tx' && task.url) {
      try {
        const txHash = task.url.split('/').pop() || task.url;
        const result = await verifyTransaction(txHash, chainId);
        results.push({
          taskId: task.id,
          instruction: task.instruction,
          type: 'tx',
          completed: result.confirmed && result.status === 1,
          evidence: result.txHash,
          detail: result.confirmed
            ? `Confirmed in block ${result.blockNumber}`
            : result.error || 'Transaction not found',
        });
      } catch (err: any) {
        results.push({
          taskId: task.id,
          instruction: task.instruction,
          type: 'tx',
          completed: false,
          detail: err.message,
        });
      }
    } else {
      results.push({
        taskId: task.id,
        instruction: task.instruction,
        type: task.type as any,
        completed: false,
        detail: 'Requires off-chain verification',
      });
    }
  }

  return results;
}

// =============================================================================
// Health Check
// =============================================================================

export async function rpcHealthCheck(): Promise<{ ok: boolean; blockNumber?: number; chain?: string; error?: string }> {
  try {
    const provider = getProvider(137);
    const block = await provider.getBlockNumber();
    return { ok: true, blockNumber: block, chain: 'Polygon (137)' };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
