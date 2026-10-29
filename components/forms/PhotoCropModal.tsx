"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Portrait 3:4 — matches listing cards and detail galleries cleanly. */
export const PROFILE_PHOTO_ASPECT = 3 / 4;
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 1200;
const OUTPUT_MIME = "image/jpeg";
const OUTPUT_QUALITY = 0.92;

type Point = { x: number; y: number };

interface PhotoCropModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
  queueIndex?: number;
  queueTotal?: number;
}

/**
 * Fixed-ratio rectangle cropper. The frame size is locked; the user only
 * drags it over the photo to choose the final area that gets uploaded.
 */
export function PhotoCropModal({
  file,
  onCancel,
  onConfirm,
  queueIndex = 1,
  queueTotal = 1,
}: PhotoCropModalProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ pointer: Point; origin: Point } | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [display, setDisplay] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const layout = useCallback(() => {
    const viewport = viewportRef.current;
    const img = imgRef.current;
    if (!viewport || !img || !img.naturalWidth) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.min(vw / nw, vh / nh);
    const dw = nw * scale;
    const dh = nh * scale;
    const left = (vw - dw) / 2;
    const top = (vh - dh) / 2;

    let cropW: number;
    let cropH: number;
    if (dw / dh > PROFILE_PHOTO_ASPECT) {
      cropH = dh;
      cropW = cropH * PROFILE_PHOTO_ASPECT;
    } else {
      cropW = dw;
      cropH = cropW / PROFILE_PHOTO_ASPECT;
    }

    setNatural({ w: nw, h: nh });
    setDisplay({ width: dw, height: dh, left, top });
    setCrop((prev) => {
      const nextX =
        prev.w > 0
          ? Math.min(Math.max(prev.x, 0), Math.max(0, dw - cropW))
          : (dw - cropW) / 2;
      const nextY =
        prev.h > 0
          ? Math.min(Math.max(prev.y, 0), Math.max(0, dh - cropH))
          : (dh - cropH) / 2;
      return { x: nextX, y: nextY, w: cropW, h: cropH };
    });
  }, []);

  useEffect(() => {
    layout();
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layout, src]);

  const clampCrop = (x: number, y: number, w: number, h: number) => ({
    x: Math.min(Math.max(0, x), Math.max(0, display.width - w)),
    y: Math.min(Math.max(0, y), Math.max(0, display.height - h)),
    w,
    h,
  });

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = {
      pointer: { x: e.clientX, y: e.clientY },
      origin: { x: crop.x, y: crop.y },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.pointer.x;
    const dy = e.clientY - dragStart.current.pointer.y;
    setCrop(
      clampCrop(
        dragStart.current.origin.x + dx,
        dragStart.current.origin.y + dy,
        crop.w,
        crop.h,
      ),
    );
  };

  const onPointerUp = () => {
    dragStart.current = null;
  };

  const handleConfirm = async () => {
    if (!src || !natural.w || !crop.w) return;
    setBusy(true);
    try {
      const scaleX = natural.w / display.width;
      const scaleY = natural.h / display.height;
      const sx = crop.x * scaleX;
      const sy = crop.y * scaleY;
      const sw = crop.w * scaleX;
      const sh = crop.h * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      const image = await loadImage(src);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
          OUTPUT_MIME,
          OUTPUT_QUALITY,
        );
      });

      const base = file.name.replace(/\.[^.]+$/, "") || "photo";
      const cropped = new File([blob], `${base}-cropped.jpg`, {
        type: OUTPUT_MIME,
        lastModified: Date.now(),
      });
      onConfirm(cropped);
    } catch {
      setBusy(false);
    }
  };

  useEffect(() => {
    setBusy(false);
  }, [file]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-(--color-background) shadow-xl border border-(--color-border)">
        <div className="border-b border-(--color-border) px-5 py-4">
          <h2 className="text-lg font-semibold">Crop photo</h2>
          <p className="mt-1 text-sm text-(--color-muted-foreground)">
            Drag the rectangle to frame the area you want. Size is fixed for
            uniform listing photos
            {queueTotal > 1 ? ` · ${queueIndex} of ${queueTotal}` : ""}.
          </p>
        </div>

        <div
          ref={viewportRef}
          className="relative mx-auto h-[min(60vh,420px)] w-full max-w-md bg-[#1a1520]"
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt="Photo to crop"
              draggable={false}
              onLoad={layout}
              className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full select-none object-contain"
              style={
                display.width
                  ? {
                      inset: "auto",
                      left: display.left,
                      top: display.top,
                      width: display.width,
                      height: display.height,
                    }
                  : undefined
              }
            />
          )}

          {crop.w > 0 && (
            <>
              <div
                className="pointer-events-none absolute bg-black/55"
                style={{
                  left: display.left,
                  top: display.top,
                  width: display.width,
                  height: Math.max(0, crop.y),
                }}
              />
              <div
                className="pointer-events-none absolute bg-black/55"
                style={{
                  left: display.left,
                  top: display.top + crop.y + crop.h,
                  width: display.width,
                  height: Math.max(0, display.height - crop.y - crop.h),
                }}
              />
              <div
                className="pointer-events-none absolute bg-black/55"
                style={{
                  left: display.left,
                  top: display.top + crop.y,
                  width: Math.max(0, crop.x),
                  height: crop.h,
                }}
              />
              <div
                className="pointer-events-none absolute bg-black/55"
                style={{
                  left: display.left + crop.x + crop.w,
                  top: display.top + crop.y,
                  width: Math.max(0, display.width - crop.x - crop.w),
                  height: crop.h,
                }}
              />

              <div
                role="presentation"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="absolute cursor-move touch-none border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{
                  left: display.left + crop.x,
                  top: display.top + crop.y,
                  width: crop.w,
                  height: crop.h,
                }}
              >
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/25" />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-(--color-border) px-5 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !crop.w}
          >
            {busy ? "Cropping…" : "Use photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
