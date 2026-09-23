"use client"

import Image from "next/image"
import { Headphones } from "lucide-react"
import { useState } from "react"

const r2Host = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").host
  } catch {
    return ""
  }
})()

function isOptimizable(src: string) {
  try {
    const url = new URL(src)
    return url.protocol === "https:" && Boolean(r2Host) && url.host === r2Host
  } catch {
    return false
  }
}

export function ImageWithFallback({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 360px",
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-violet-950 text-violet-400 ${className ?? ""}`}
      >
        <Headphones className="h-1/3 w-1/3" strokeWidth={1.5} />
      </div>
    )
  }

  if (isOptimizable(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={720}
        height={720}
        sizes={sizes}
        priority={priority}
        className={className}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setHasError(true)}
    />
  )
}
