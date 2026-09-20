function field(id: string, value: string) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
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

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
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
  txid: string;
  description?: string;
}) {
  const key = input.key.trim();
  const name = normalizeText(input.receiverName || "DELI SALGADOS", 25);
  const city = normalizeText(input.receiverCity || "RECIFE", 15);
  const txid = normalizeText(input.txid || "***", 25) || "***";
  const description = normalizeText(input.description || "", 50);

  let merchantAccount = field("00", "BR.GOV.BCB.PIX") + field("01", key);
  if (description) merchantAccount += field("02", description);

  const additionalData = field("05", txid);
  const amount = Number(input.amount || 0).toFixed(2);

  const withoutCrc =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount) +
    field("58", "BR") +
    field("59", name) +
    field("60", city) +
    field("62", additionalData) +
    "6304";

  return withoutCrc + crc16(withoutCrc);
}
