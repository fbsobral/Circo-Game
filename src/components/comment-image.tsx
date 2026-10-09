"use client"

import { useRef, useState } from "react"

export async function compressImage(file: File, maxWidth = 1200, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let w = img.width
        let h = img.height
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function CommentImageButton({ onPick }: { onPick: (dataUrl: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Adicionar foto"
        aria-label="Adicionar foto"
        className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onPick(await compressImage(file, 1000, 0.7))
        }}
      />
    </>
  )
}

export function CommentImagePreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative inline-block">
      <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover" style={{ border: "1px solid var(--border)" }} />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover foto"
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
      >×</button>
    </div>
  )
}

export function CommentPhoto({ src }: { src: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <img
        src={src}
        alt="Foto do comentário"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-xl cursor-zoom-in object-cover"
        style={{ maxHeight: 220, maxWidth: "100%", border: "1px solid var(--border)" }}
      />
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 cursor-zoom-out"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setOpen(false)}
        >
          <img src={src} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </>
  )
}
