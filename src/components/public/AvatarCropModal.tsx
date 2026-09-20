"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, X, Move } from "lucide-react";

const VIEWPORT = 280;

type Point = { x: number; y: number };

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
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const dragOrigin = useRef<Point | null>(null);
  const offsetOrigin = useRef<Point>({ x: 0, y: 0 });
  const pinchOrigin = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const baseScale = Math.max(
    VIEWPORT / naturalSize.width,
    VIEWPORT / naturalSize.height
  );

  const renderedWidth = naturalSize.width * baseScale * zoom;
  const renderedHeight = naturalSize.height * baseScale * zoom;

  const maxOffsetX = Math.max(0, (renderedWidth - VIEWPORT) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - VIEWPORT) / 2);

  const clampOffset = (next: Point, nextZoom = zoom) => {
    const rw = naturalSize.width * baseScale * nextZoom;
    const rh = naturalSize.height * baseScale * nextZoom;
    const maxX = Math.max(0, (rw - VIEWPORT) / 2);
    const maxY = Math.max(0, (rh - VIEWPORT) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  };

  const updateZoom = (nextZoom: number) => {
    const z = Math.max(1, Math.min(4, nextZoom));
    setZoom(z);
    setOffset((current) => clampOffset(current, z));
  };

  const pointerDistance = () => {
    const values = [...pointers.current.values()];
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragOrigin.current = { x: e.clientX, y: e.clientY };
      offsetOrigin.current = offset;
    } else if (pointers.current.size === 2) {
      pinchOrigin.current = {
        distance: pointerDistance(),
        zoom,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchOrigin.current) {
      const distance = pointerDistance();
      if (pinchOrigin.current.distance > 0) {
        updateZoom(
          pinchOrigin.current.zoom * (distance / pinchOrigin.current.distance)
        );
      }
      return;
    }

    if (pointers.current.size === 1 && dragOrigin.current) {
      const dx = e.clientX - dragOrigin.current.x;
      const dy = e.clientY - dragOrigin.current.y;
      setOffset(
        clampOffset({
          x: offsetOrigin.current.x + dx,
          y: offsetOrigin.current.y + dy,
        })
      );
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);

    if (pointers.current.size < 2) {
      pinchOrigin.current = null;
    }

    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      dragOrigin.current = remaining;
      offsetOrigin.current = offset;
    } else if (pointers.current.size === 0) {
      dragOrigin.current = null;
    }
  };

  async function crop() {
    const img = new Image();
    img.src = previewUrl;
    await img.decode();

    const effectiveScale = baseScale * zoom;
    const left = (VIEWPORT - img.naturalWidth * effectiveScale) / 2 + offset.x;
    const top = (VIEWPORT - img.naturalHeight * effectiveScale) / 2 + offset.y;

    const sourceX = Math.max(0, -left / effectiveScale);
    const sourceY = Math.max(0, -top / effectiveScale);
    const sourceSize = VIEWPORT / effectiveScale;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      512,
      512
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    );

    if (blob) await onConfirm(blob);
  }

  return (
    <div className="fixed inset-0 z-[120] bg-[#2A160F]/65 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center">
      <div className="w-full max-w-[430px] max-h-[96dvh] overflow-y-auto rounded-3xl bg-[#FFFDF9] border border-[#EBDCCF] shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-black text-[#3C1F15]">
              Ajuste sua foto
            </h2>
            <p className="text-[11px] text-[#7A6357] mt-1">
              Arraste com o dedo para posicionar. Use dois dedos para aproximar ou afastar.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-[#FFF0E2] flex items-center justify-center text-[#3C1F15] shrink-0"
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex justify-center">
          <div
            className="relative rounded-full overflow-hidden bg-[#EFE7E0] border-4 border-white shadow-inner touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ width: VIEWPORT, height: VIEWPORT, maxWidth: "82vw", maxHeight: "82vw" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={(e) => {
              if (pointers.current.has(e.pointerId) && e.buttons === 0) {
                onPointerUp(e);
              }
            }}
          >
            <img
              src={previewUrl}
              alt="Prévia da foto"
              onLoad={(e) =>
                setNaturalSize({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })
              }
              className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none"
              style={{
                width: renderedWidth,
                height: renderedHeight,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
              draggable={false}
            />
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/45 text-white text-[10px] font-bold flex items-center gap-1.5 pointer-events-none">
              <Move size={12} />
              Arraste para enquadrar
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase text-[#7A6357]">
            <span>Zoom</span>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.1)}
              className="w-8 h-8 rounded-full border border-[#E8D9CB] flex items-center justify-center"
              aria-label="Diminuir zoom"
            >
              <Minus size={14} />
            </button>
            <input
              aria-label="Zoom da foto"
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => updateZoom(Number(e.target.value))}
              className="w-full"
            />
            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.1)}
              className="w-8 h-8 rounded-full border border-[#E8D9CB] flex items-center justify-center"
              aria-label="Aumentar zoom"
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-[10px] text-[#9E8679] text-center">
            A foto não recebe filtros, deformações ou retoques. Apenas o enquadramento escolhido é salvo no avatar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="py-3 rounded-2xl border border-[#E8D9CB] text-[#3C1F15] text-xs font-black disabled:opacity-60"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={crop}
            disabled={saving}
            className="py-3 rounded-2xl bg-[#E05A36] text-white text-xs font-black disabled:opacity-60"
          >
            {saving ? "SALVANDO..." : "SALVAR FOTO"}
          </button>
        </div>
      </div>
    </div>
  );
}
