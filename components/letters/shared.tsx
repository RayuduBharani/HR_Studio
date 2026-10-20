"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const A4_WIDTH_PX = 794 // 210mm at 96dpi

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border bg-card p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function Labeled({
  label,
  hint,
  wide,
  children,
}: {
  label: string
  hint?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", wide && "sm:col-span-2")}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

/** Short-lived status toast. */
export function useNotice() {
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(t)
  }, [notice])

  const toast = notice && (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg print:hidden"
    >
      {notice}
    </div>
  )
  return [toast, setNotice] as const
}

/** Page layout: action toolbar on top, form column on the left, scaled A4 preview on the right. */
export function BuilderLayout({
  actions,
  form,
  missing,
  preview,
}: {
  actions: ReactNode
  form: ReactNode
  missing: string[]
  preview: ReactNode
}) {
  const [zoom, setZoom] = useState(0.75)
  const previewRef = useRef<HTMLDivElement>(null)

  // Scale the A4 preview to fit its column.
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setZoom(Math.min(1, (entry.contentRect.width - 16) / A4_WIDTH_PX))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap justify-end gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur print:hidden">
        {actions}
      </div>
      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(360px,460px)_1fr] print:block print:p-0">
        <div className="flex flex-col gap-4 print:hidden">{form}</div>
        <div ref={previewRef} className="min-w-0 print:block">
          {missing.length > 0 && (
            <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 print:hidden">
              Still needed: {missing.join(", ")}
            </p>
          )}
          <div
            className="[zoom:var(--preview-zoom)] print:[zoom:1]"
            style={{ "--preview-zoom": zoom } as CSSProperties}
          >
            {preview}
          </div>
        </div>
      </main>
    </>
  )
}

export function SavedList<T extends { id: string }>({
  items,
  activeId,
  title,
  subtitle,
  onOpen,
  onDelete,
}: {
  items: T[]
  activeId: string
  title: (item: T) => string
  subtitle: (item: T) => string
  onOpen: (item: T) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Saved letters ({items.length})</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Letters you save appear here.</p>
      ) : (
        <ul className="mt-2 divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => onOpen(item)}
                className={cn(
                  "min-w-0 flex-1 text-left text-sm hover:underline",
                  item.id === activeId && "font-semibold"
                )}
              >
                <span className="block truncate">{title(item)}</span>
                <span className="block truncate text-xs text-muted-foreground">{subtitle(item)}</span>
              </button>
              <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => onDelete(item.id)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Renders each visible A4 `.letter-page` to an image and saves them as `<fileName>.pdf`.
 * Hidden pages (e.g. the other tab kept alive by the router) are skipped.
 */
export async function downloadLetterPdf(fileName: string) {
  const pages = [...document.querySelectorAll<HTMLElement>(".letter-page")].filter((p) => p.offsetParent !== null)
  const pdf = await letterPdf(pages)
  pdf.save(`${safeFileName(fileName)}.pdf`)
}

export function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "").trim()
}

/** Builds an A4 PDF Blob from the `.letter-page` elements inside `root` (used for freshly mounted letters). */
export async function letterPdfBlob(root: HTMLElement) {
  const pages = [...root.querySelectorAll<HTMLElement>(".letter-page")]
  await Promise.all([...root.querySelectorAll("img")].map(loaded))
  return (await letterPdf(pages, { warmUp: true })).output("blob")
}

function loaded(img: HTMLImageElement) {
  if (img.complete) return Promise.resolve()
  return new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true })
    img.addEventListener("error", () => resolve(), { once: true })
  })
}

async function letterPdf(pages: HTMLElement[], { warmUp = false } = {}) {
  const [{ jsPDF }, { toJpeg }] = await Promise.all([import("jspdf"), import("html-to-image")])
  const options = {
    pixelRatio: 2,
    quality: 0.95,
    backgroundColor: "#ffffff",
    // Drop the on-screen drop shadow from the capture.
    style: { boxShadow: "none", margin: "0" },
    // Unfilled optional fields show a highlighted "[City]"-style hint on screen only.
    filter: (node: HTMLElement) => !(node instanceof HTMLElement && node.dataset.placeholder !== undefined),
  }
  // Chrome can leave embedded images out of the very first capture of a newly mounted node; a throwaway pass fixes it.
  if (warmUp && pages[0]) await toJpeg(pages[0], { ...options, pixelRatio: 0.25 })

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  for (const [i, page] of pages.entries()) {
    const img = await toJpeg(page, options)
    if (i > 0) pdf.addPage()
    pdf.addImage(img, "JPEG", 0, 0, 210, 297)
  }
  return pdf
}
