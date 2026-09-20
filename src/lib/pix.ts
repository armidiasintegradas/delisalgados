function field(id: string, value: string) {
  const length = new TextEncoder().encode(value).length;
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

function normalizeText(value: string, max: number) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 .-]/g, "")
    .trim()
    .slice(0, max);
}

function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (const char of base) total += Number(char) * factor--;
    const mod = total % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 9) + d1, 11);
  return digits === digits.slice(0, 9) + String(d1) + String(d2);
}

export function normalizePixKey(raw: string) {
  const value = (raw || "").trim();

  if (!value) return "";

  // E-mail and random EVP keys must be preserved as registered.
  if (value.includes("@") || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)) {
    return value;
  }

  const digits = value.replace(/\D/g, "");

  // CPF or CNPJ: only digits.
  if (digits.length === 11 && isValidCpf(digits)) return digits;
  if (digits.length === 14) return digits;

  // Brazilian phone Pix key must use international format with +55.
  // 11 digits: DDD + 9-digit mobile.
  if (digits.length === 11) return `+55${digits}`;
  // 13 digits already including country code 55.
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;

  // If the user explicitly typed +, preserve the international phone representation.
  if (value.startsWith("+") && digits.length >= 10) return `+${digits}`;

  return value;
}

function crc16(payload: string) {
  const bytes = new TextEncoder().encode(payload);
  let crc = 0xffff;

  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload(input: {
  key: string;
  receiverName: string;
  receiverCity: string;
  amount: number;
  txid?: string;
  description?: string;
}) {
  const key = normalizePixKey(input.key);
  if (!key) throw new Error("Chave Pix não configurada.");

  const name = normalizeText(input.receiverName || "DELI SALGADOS", 25);
  const city = normalizeText(input.receiverCity || "RECIFE", 15);

  // BCB: txid is alphanumeric only, max 25 chars. Use *** when not reconciling.
  const requestedTxid = (input.txid || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  const txid = requestedTxid || "***";

  const description = normalizeText(input.description || "", 40);

  let merchantAccount = field("00", "br.gov.bcb.pix") + field("01", key);
  if (description) merchantAccount += field("02", description);

  const amount = Number(input.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor Pix inválido.");
  }

  const additionalData = field("05", txid);

  const withoutCrc =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount.toFixed(2)) +
    field("58", "BR") +
    field("59", name) +
    field("60", city) +
    field("62", additionalData) +
    "6304";

  return withoutCrc + crc16(withoutCrc);
}

export function validatePixPayload(payload: string) {
  if (!payload || payload.length < 20 || !payload.includes("0014br.gov.bcb.pix")) return false;
  const match = payload.match(/6304([0-9A-Fa-f]{4})$/);
  if (!match) return false;
  const withoutCrcValue = payload.slice(0, -4);
  return crc16(withoutCrcValue) === match[1].toUpperCase();
}
