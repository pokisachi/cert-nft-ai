import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const victionTestnet = defineChain({
  id: 89,
  name: "Viction Testnet",
  nativeCurrency: { name: "VIC", symbol: "VIC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.viction.xyz"] },
    public: { http: ["https://rpc-testnet.viction.xyz"] },
  },
  blockExplorers: {
    default: { name: "Vicscan", url: "https://testnet.vicscan.xyz" }
  }
});

export function getSigner() {
  const privateKey = process.env.MINT_SIGNER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: victionTestnet,
    transport: http(process.env.RPC_URL),
  });
}

export function getPublic() {
  return createPublicClient({
    chain: victionTestnet,
    transport: http(process.env.RPC_URL),
  });
}
