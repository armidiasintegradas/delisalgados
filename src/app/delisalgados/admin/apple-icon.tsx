import { ImageResponse } from "next/og";
import { ADMIN_ICON_DATA_URI } from "@/lib/adminIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <img
      src={ADMIN_ICON_DATA_URI}
      width="180"
      height="180"
      style={{ width: "180px", height: "180px", objectFit: "cover" }}
    />,
    size
  );
}
