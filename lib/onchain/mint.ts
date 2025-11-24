// lib/onchain/mint.ts
import { decodeEventLog, Hex } from "viem";
import { getWalletClient, getPublicClient } from "./viem";

export const CERT_ABI = [
  {
    type: "function",
    name: "mintCertificate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURI_", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "event",
    name: "CertificateMinted",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "tokenURI", type: "string" },
    ],
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "revoke",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
] as const;

export async function mintCertificate({
  contract,
  to,
  tokenUri,
}: {
  contract: `0x${string}`;
  to: `0x${string}`;
  tokenUri: string;
}) {
  const wallet = getWalletClient();
  const publicClient = getPublicClient();

  // 1. Gửi transaction
  const txHash = await wallet.writeContract({
    address: contract,
    abi: CERT_ABI,
    functionName: "mintCertificate",
    args: [to, tokenUri],
  });

  // 2. Đợi nhận receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // 3. Decode logs
  let tokenId: string | null = null;

  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({
        abi: CERT_ABI,
        data: log.data as Hex,
        // 🔥 FIX QUAN TRỌNG NHẤT: ÉP tuple để TS không complain
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });

      if (parsed.eventName === "CertificateMinted") {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch (err) {
      // bỏ qua logs không match
    }
  }

  return { txHash, tokenId };
}

export async function revokeOrBurnCertificate({
  contract,
  tokenId,
}: {
  contract: `0x${string}`;
  tokenId: bigint;
}) {
  const wallet = getWalletClient();
  const publicClient = getPublicClient();

  let txHash: `0x${string}` | null = null;
  try {
    txHash = await wallet.writeContract({
      address: contract,
      abi: CERT_ABI,
      functionName: "revoke",
      args: [tokenId],
    });
  } catch {
    txHash = await wallet.writeContract({
      address: contract,
      abi: CERT_ABI,
      functionName: "burn",
      args: [tokenId],
    });
  }

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return { txHash };
}
