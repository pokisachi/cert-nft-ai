// lib/normalizer.ts
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { unescape as lodashUnescape } from "lodash";

// 🧩 Chuẩn hoá họ tên: lower + bỏ dấu + trim + collapse spaces
export function normalizeName(name: string): string {
  if (!name) return "";
  return removeDiacritics(name.trim().replace(/\s+/g, " ").toLowerCase());
}

// 🧩 Chuẩn hoá số điện thoại → E.164 (mặc định VN)
export function toE164(phone: string): string {
  if (!phone) return "";
  const parsed = parsePhoneNumberFromString(phone, "VN");
  return parsed ? parsed.number : phone.replace(/\D/g, "");
}

// 🧩 Chuẩn hoá CMND/CCCD
export function normalizeIdCard(id: string): string {
  if (!id) return "";
  return id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// 🧩 Làm sạch địa chỉ (bỏ HTML + space thừa)
export function sanitizeAddress(address: string): string {
  if (!address) return "";
  return lodashUnescape(address)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 🧩 Bỏ dấu tiếng Việt
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
