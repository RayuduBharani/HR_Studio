"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { flushSync } from "react-dom"
import { FileDown, FileSpreadsheet, Loader2, PackageOpen, Upload } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { letterPdfBlob, safeFileName } from "@/components/letters/shared"
import { type BulkRow, bulkTemplateCsv, rowsToOffers } from "@/lib/bulk-offers"
import { type OfferLetterData, formatLetterDate, toISODate } from "@/lib/offer-letter"
import { cn } from "@/lib/utils"
import { OfferLetter } from "./offer-letter"

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

async function readSpreadsheet(file: File): Promise<unknown[][]> {
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    const Papa = (await import("papaparse")).default
    const result = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true })
    return result.data
  }
  const { readSheet } = await import("read-excel-file/universal")
  return (await readSheet(file)) as unknown[][]
}

export function BulkOffers({
  open,
  onOpenChange,
  base,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current form values — supplies company, signatory and default pay details. */
  base: OfferLetterData
}) {
  const [rows, setRows] = useState<BulkRow[]>([])
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [current, setCurrent] = useState<OfferLetterData | null>(null)
  const renderRef = useRef<HTMLDivElement>(null)

  const valid = rows.filter((r) => r.errors.length === 0)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-uploading the same file after fixing it
    if (!file) return
    setFileName(file.name)
    setError(null)
    setRows([])
    try {
      const parsed = rowsToOffers(await readSpreadsheet(file), base)
      if (parsed.length === 0) setError("No rows found under the header row.")
      setRows(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.")
    }
  }

  async function downloadAll() {
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    const used = new Map<string, number>()
    setProgress({ done: 0, total: valid.length })
    try {
      for (const [i, { data }] of valid.entries()) {
        // Render this person's letter off-screen, then capture it.
        flushSync(() => setCurrent(data))
        const blob = await letterPdfBlob(renderRef.current!)
        let name = safeFileName(`${data.candidateName} Offer Letter`)
        const n = (used.get(name) ?? 0) + 1
        used.set(name, n)
        if (n > 1) name += ` (${n})`
        zip.file(`${name}.pdf`, blob)
        setProgress({ done: i + 1, total: valid.length })
      }
      saveBlob(await zip.generateAsync({ type: "blob" }), `Offer Letters ${toISODate(new Date())}.zip`)
    } catch {
      setError("Something went wrong while creating the PDFs. Please try again.")
    } finally {
      setCurrent(null)
      setProgress(null)
    }
  }

  const busy = progress !== null

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
        <DialogContent className="max-h-[90vh] grid-rows-[auto_auto_1fr_auto] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk offer letters</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel sheet with one person per row, then download every offer letter as a ZIP of
              PDFs. Company, signatory and pay condition come from the main form.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <label className={cn(buttonVariants({ variant: "default" }), busy && "pointer-events-none opacity-50")}>
              <Upload /> Upload sheet
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={onFile}
                disabled={busy}
              />
            </label>
            <Button
              variant="outline"
              onClick={() =>
                saveBlob(new Blob([bulkTemplateCsv()], { type: "text/csv" }), "offer-letters-template.csv")
              }
            >
              <FileDown /> Download template
            </Button>
            {fileName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileSpreadsheet className="size-3.5" /> {fileName}
              </span>
            )}
          </div>

          <div className="min-h-0 overflow-auto rounded-lg border">
            {error && <p className="p-3 text-sm text-destructive">{error}</p>}
            {rows.length === 0 && !error ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <PackageOpen className="size-6" />
                <p>
                  Columns: Full name, Salutation, City, Email, Role, Start date, End date, Position, Stipend.
                  <br />
                  Dates can be YYYY-MM-DD or DD/MM/YYYY. Salutation and Stipend are optional.
                </p>
              </div>
            ) : (
              rows.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ row, data, errors }) => (
                      <TableRow key={data.id} className={cn(errors.length > 0 && "bg-destructive/5")}>
                        <TableCell className="text-muted-foreground">{row}</TableCell>
                        <TableCell className="font-medium">{data.candidateName || "—"}</TableCell>
                        <TableCell>{data.role || "—"}</TableCell>
                        <TableCell>{data.candidateCity || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatLetterDate(data.startDate)}
                          {data.offerType === "internship" && <> – {formatLetterDate(data.endDate)}</>}
                        </TableCell>
                        <TableCell className="capitalize">{data.workSchedule}</TableCell>
                        <TableCell className={cn(errors.length ? "text-destructive" : "text-emerald-700")}>
                          {errors.length ? errors.join(", ") : "Ready"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </div>

          <DialogFooter className="items-center">
            {rows.length > 0 && (
              <p className="mr-auto text-sm text-muted-foreground">
                {valid.length} of {rows.length} ready
                {rows.length > valid.length && " · rows with problems will be skipped"}
              </p>
            )}
            <Button onClick={downloadAll} disabled={valid.length === 0 || busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" /> Creating {progress.done}/{progress.total}…
                </>
              ) : (
                <>
                  <FileDown /> Download {valid.length || ""} letters (ZIP)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Off-screen render target used while generating PDFs. */}
      <div ref={renderRef} aria-hidden className="pointer-events-none fixed top-0 left-[-10000px]">
        {current && <OfferLetter data={current} />}
      </div>
    </>
  )
}
