'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRTicketProps {
  value: string
  size?: number
}

export function QRTicket({ value, size = 160 }: QRTicketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .catch(() => setError(true))
  }, [value, size])

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50"
        style={{ width: size, height: size }}
      >
        <div className="text-center px-2">
          <p className="text-[10px] font-mono font-bold break-all leading-tight text-muted-foreground">
            {value}
          </p>
        </div>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  )
}
