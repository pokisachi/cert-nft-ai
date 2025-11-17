import { ethers } from "hardhat";

async function main() {
  console.log(">>> deploy script started");
  
  const Cert = await ethers.getContractFactory("CertificateNFT");
  console.log(">>> factory loaded");

  const cert = await Cert.deploy({ gasLimit: 5_000_000 });
  console.log(">>> deploy transaction sent");

  await cert.waitForDeployment();
  console.log(">>> contract deployed");

  console.log("Contract address:", await cert.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
