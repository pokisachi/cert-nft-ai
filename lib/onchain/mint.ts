import { getSigner } from "./viem";
import { Abi } from "viem";

export const CERT_ABI: Abi = [
  {
    type: "function",
    name: "mintCertificate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURI_", type: "string" }
    ],
    outputs: [{ type: "uint256" }]
  }
];

export async function mintCertificate({ contract, to, tokenUri }: {
  contract: `0x${string}`;
  to: `0x${string}`;
  tokenUri: string;
}) {
  const signer = getSigner();
  return signer.writeContract({
    address: contract,
    abi: CERT_ABI,
    functionName: "mintCertificate",
    args: [to, tokenUri],
  });
}
