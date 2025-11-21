// lib/onchain/viem.ts
import {
  createWalletClient,
  createPublicClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const victionTestnet = defineChain({
  id: 89,
  name: "Viction Testnet",
  network: "viction-testnet",

  nativeCurrency: { name: "VIC", symbol: "VIC", decimals: 18 },

  rpcUrls: {
    default: { http: [process.env.RPC_URL || "https://rpc-testnet.viction.xyz"] },
    public: { http: [process.env.RPC_URL || "https://rpc-testnet.viction.xyz"] },
  },

  blockExplorers: {
    default: {
      name: "VicScan",
      url: "https://testnet.vicscan.xyz",
    },
  },
});

export function getWalletClient() {
  const pk = process.env.MINT_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) throw new Error("MINT_SIGNER_PRIVATE_KEY missing");

  const account = privateKeyToAccount(pk);

  return createWalletClient({
    chain: victionTestnet,
    transport: http(process.env.RPC_URL || "https://rpc-testnet.viction.xyz"),
    account,
  });
}

export function getPublicClient() {
  return createPublicClient({
    chain: victionTestnet,
    transport: http(process.env.RPC_URL || "https://rpc-testnet.viction.xyz"),
  });
}
