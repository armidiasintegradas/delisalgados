import { ImageResponse } from "next/og";
import { ADMIN_ICON_DATA_URI } from "@/lib/adminIcon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#a6a6a6",
        }}
      >
        <img
          src={ADMIN_ICON_DATA_URI}
          width="512"
          height="512"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    ),
    size
  );
}
