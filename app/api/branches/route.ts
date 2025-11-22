export const runtime = "nodejs";

import { NextResponse } from "next/server";

type Branch = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const branches: Branch[] = [
  {
    id: "HN-01",
    name: "Chi nhánh Hà Nội – Cầu Giấy",
    address: "Số 1 Trần Thái Tông, Cầu Giấy, Hà Nội",
    latitude: 21.028511,
    longitude: 105.804817,
  },
  {
    id: "HCM-01",
    name: "Chi nhánh TP.HCM – Quận 1",
    address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
    latitude: 10.773374,
    longitude: 106.704886,
  },
  {
    id: "DN-01",
    name: "Chi nhánh Đà Nẵng – Hải Châu",
    address: "24 Bạch Đằng, Hải Châu, Đà Nẵng",
    latitude: 16.06778,
    longitude: 108.22083,
  },
  {
    id: "CT-01",
    name: "Chi nhánh Cần Thơ – Ninh Kiều",
    address: "3 Hòa Bình, Ninh Kiều, Cần Thơ",
    latitude: 10.034267,
    longitude: 105.788139,
  },
];

export async function GET() {
  return NextResponse.json(branches);
}

