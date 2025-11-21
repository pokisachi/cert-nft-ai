// app/lib/ipfs/pinata.ts

import axios from "axios";
import FormData from "form-data";   // dùng FormData của Node.js

export async function uploadToPinata(file: Buffer, filename: string) {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error("Missing PINATA_API_KEY or PINATA_SECRET_KEY");
  }

  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const data = new FormData();
  data.append("file", file, filename);   // KHÔNG dùng Blob nữa

  const res = await axios.post(url, data, {
    maxBodyLength: Infinity,
    headers: {
      ...data.getHeaders(),
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretKey,
    },
  });

  return res.data.IpfsHash; // CID
}
