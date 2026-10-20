"use client"

import dynamic from "next/dynamic"

// Client-only: drafts live in localStorage and defaults depend on today's date.
export const OfferStudio = dynamic(() => import("./offer-builder").then((m) => m.OfferBuilder), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Loading…</div>,
})
