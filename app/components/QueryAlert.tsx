"use client"

import { useEffect, useState } from "react"

export function QueryAlert() {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get("error")
    const i = params.get("info")
    setError(e)
    setInfo(i)
  }, [])

  if (!error && !info) return null

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {info}
        </div>
      )}
    </div>
  )
}
