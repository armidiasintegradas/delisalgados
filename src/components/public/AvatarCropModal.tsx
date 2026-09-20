"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

export function AvatarCropModal({
  file,
  onCancel,
  onConfirm,
  saving,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  saving: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  async function crop() {
    const img = new Image();
    img.src = previewUrl;
    await img.decode();

    const cropSize = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
    const maxX = Math.max(0, (img.naturalWidth - cropSize) / 2);
    const maxY = Math.max(0, (img.naturalHeight - cropSize) / 2);
    const sx = Math.max(0, Math.min(img.naturalWidth - cropSize, (img.naturalWidth - cropSize) / 2 + (x / 100) * maxX));
    const sy = Math.max(0, Math.min(img.naturalHeight - cropSize, (img.naturalHeight - cropSize) / 2 + (y / 100) * maxY));

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      sx,
      sy,
      cropSize,
      cropSize,
      0,
      0,
      512,
      512
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (blob) await onConfirm(blob);
  }

  return (
    <div className="fixed inset-0 z-[120] bg-[#2A160F]/65 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-[430px] rounded-3xl bg-[#FFFDF9] border border-[#EBDCCF] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-[#3C1F15]">Ajuste sua foto</h2>
            <p className="text-[11px] text-[#7A6357] mt-1">Centralize seu rosto e ajuste o zoom antes de salvar.</p>
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-full bg-[#FFF0E2] flex items-center justify-center text-[#3C1F15]" aria-label="Fechar">
            <X size={17} />
          </button>
        </div>

        <div className="mx-auto w-[260px] h-[260px] rounded-full overflow-hidden bg-[#EFE7E0] border-4 border-white shadow-inner relative">
          <img
            src={previewUrl}
            alt="Prévia da foto"
            className="absolute inset-0 w-full h-full object-cover select-none"
            style={{
              transform: `scale(${zoom}) translate(${x / 4}%, ${y / 4}%)`,
              transformOrigin: "center",
            }}
            draggable={false}
          />
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="flex justify-between text-[10px] font-black uppercase text-[#7A6357] mb-1">
              <span>Zoom</span><span>{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus size={14} />
              <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="w-full" />
              <Plus size={14} />
            </div>
          </label>

          <label className="block">
            <div className="text-[10px] font-black uppercase text-[#7A6357] mb-1">Horizontal</div>
            <input type="range" min="-100" max="100" value={x} onChange={(e)=>setX(Number(e.target.value))} className="w-full" />
          </label>

          <label className="block">
            <div className="text-[10px] font-black uppercase text-[#7A6357] mb-1">Vertical</div>
            <input type="range" min="-100" max="100" value={y} onChange={(e)=>setY(Number(e.target.value))} className="w-full" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="py-3 rounded-2xl border border-[#E8D9CB] text-[#3C1F15] text-xs font-black">
            CANCELAR
          </button>
          <button type="button" onClick={crop} disabled={saving} className="py-3 rounded-2xl bg-[#E05A36] text-white text-xs font-black disabled:opacity-60">
            {saving ? "SALVANDO..." : "SALVAR FOTO"}
          </button>
        </div>
      </div>
    </div>
  );
}
