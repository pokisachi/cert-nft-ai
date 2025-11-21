// @ts-nocheck
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

async function main() {
  const filePath = path.join(process.cwd(), "scripts/data_test/test.pdf");

  console.log("📄 Using file:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error("❌ File không tồn tại:", filePath);
    return;
  }

  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    data,
    {
      maxBodyLength: Infinity,
      headers: {
        ...data.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
      },
    }
  );

  console.log("🎉 UPLOAD PINATA THÀNH CÔNG!");
  console.log("CID:", res.data.IpfsHash);
}

main().catch((err) => {
  console.error("❌ ERROR:", err.response?.data || err);
});
