import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS!;
  const to = process.env.MINT_TO!;
  const tokenUri = process.env.TOKEN_URI!;

  console.log("Minting to:", to);

  const contract = await ethers.getContractAt("CertificateNFT", contractAddress);

  const tx = await contract.mintCertificate(to, tokenUri);
  const receipt = await tx.wait();

  console.log("Mint tx:", receipt?.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
