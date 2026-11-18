"use client";

import clsx from "clsx";
import { ImageUp, Trash2 } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "./Button";

const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_BYTES = 1024 * 1024;
const MAX_DIMENSION = 256;

/** Read an image file and downscale raster images so the data URL stays small for localStorage. */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml") return original;

  const img = new Image();
  img.src = original;
  await img.decode();
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 120_000) return original;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

interface LogoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) return setError("Use a PNG, JPG, SVG or WebP image.");
    if (file.size > MAX_BYTES) return setError("Logo must be 1 MB or smaller.");
    try {
      onChange(await fileToLogoDataUrl(file));
    } catch {
      setError("We couldn't read that image. Try a different file.");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium text-slate-700">
        Company logo <span className="font-normal text-slate-400">(optional)</span>
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "flex items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-slate-50/60",
        )}
      >
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL preview
            <img src={value} alt="Company logo preview" className="size-full object-contain p-1" />
          ) : (
            <ImageUp className="size-6 text-slate-400" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-700">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              {value ? "Replace logo" : "Upload a file"}
            </button>{" "}
            <span className="hidden sm:inline">or drag and drop</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">PNG, JPG, SVG or WebP up to 1 MB</p>
        </div>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} aria-label="Remove logo">
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          aria-labelledby={`${id}-label`}
          data-testid="logo-input"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
