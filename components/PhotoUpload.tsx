"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;

async function resizeToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function PhotoUpload({ onSelect }: { onSelect: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeToDataUrl(file);
      setPreview(dataUrl);
      onSelect(dataUrl);
    } catch {
      setError("Could not read that image. Try a different photo.");
    }
  }

  return (
    <div className="space-y-2">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Meal preview" className="w-full max-h-72 object-cover rounded-lg border border-gray-200" />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          <span className="text-3xl mb-1">📷</span>
          <span className="text-sm font-medium">Take or upload a food photo</span>
        </button>
      )}
      {preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-indigo-600 hover:underline"
        >
          Choose a different photo
        </button>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
