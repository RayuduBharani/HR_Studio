import { isValid, parse as parseDate } from "date-fns"
import { type OfferLetterData, firstName, missingFields, toISODate } from "./offer-letter"

/** Columns HR can use in the bulk upload sheet (header names are matched loosely). */
export const BULK_COLUMNS = [
  "Full name",
  "Salutation",
  "City",
  "Email",
  "Role",
  "Start date",
  "End date",
  "Position",
  "Stipend",
] as const

const HEADER_ALIASES: Record<string, keyof OfferLetterData> = {
  fullname: "candidateName",
  name: "candidateName",
  candidatename: "candidateName",
  salutation: "salutationName",
  city: "candidateCity",
  email: "candidateEmail",
  emailid: "candidateEmail",
  role: "role",
  designation: "role",
  roledesignation: "role",
  startdate: "startDate",
  enddate: "endDate",
  position: "workSchedule",
  stipend: "amount",
  salary: "amount",
  amount: "amount",
  offertype: "offerType",
  letterdate: "letterDate",
}

const DATE_FIELDS = new Set<keyof OfferLetterData>(["startDate", "endDate", "letterDate"])

export type BulkRow = { row: number; data: OfferLetterData; errors: string[] }

const normalizeHeader = (h: unknown) => String(h ?? "").toLowerCase().replace(/[^a-z]/g, "")

/** Accepts Excel dates, YYYY-MM-DD, DD/MM/YYYY (also - or .), and "17 Oct 2026"-style text. */
export function toISO(value: unknown): string | null {
  if (value instanceof Date) {
    // Spreadsheet dates are calendar dates stored at UTC midnight.
    return isValid(value)
      ? toISODate(new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
      : null
  }
  if (typeof value === "number") {
    // Excel serial day number (days since 1899-12-30).
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000)
    return toISO(d)
  }
  const s = String(value ?? "").trim().replace(/(\d)(st|nd|rd|th)\b/i, "$1")
  if (!s) return null
  for (const fmt of ["yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "dd.MM.yyyy", "d MMM yyyy", "d MMMM yyyy", "MMM d, yyyy", "MMMM d, yyyy"]) {
    const d = parseDate(s, fmt, new Date())
    if (isValid(d)) return toISODate(d)
  }
  return null
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return toISO(value) ?? ""
  return String(value).trim()
}

/**
 * Turns spreadsheet rows (first row = headers) into offer letters.
 * Anything not in the sheet (company, signatory, pay condition, default stipend…) comes from `base`.
 */
export function rowsToOffers(sheet: unknown[][], base: OfferLetterData): BulkRow[] {
  const [header = [], ...body] = sheet
  const columns = header.map((h) => HEADER_ALIASES[normalizeHeader(h)])
  if (!columns.includes("candidateName")) {
    throw new Error('Couldn\'t find a "Full name" column. Use the template so the headers match.')
  }

  return body
    .map((cells, i) => ({ cells, row: i + 2 })) // +2: 1-based and skipping the header row
    .filter(({ cells }) => cells.some((c) => cellText(c) !== ""))
    .map(({ cells, row }) => {
      // Per-person fields always come from the sheet, never from whoever is open in the form.
      const data: OfferLetterData = {
        ...base,
        id: crypto.randomUUID(),
        candidateName: "",
        salutationName: "",
        candidateEmail: "",
        candidateCity: "",
        role: "",
      }
      const errors: string[] = []

      columns.forEach((key, c) => {
        if (!key) return
        const raw = cells[c]
        if (DATE_FIELDS.has(key)) {
          if (cellText(raw) === "") return
          const iso = toISO(raw)
          if (iso) (data[key] as string) = iso
          else errors.push(`Invalid ${key === "startDate" ? "start" : key === "endDate" ? "end" : "letter"} date`)
          return
        }
        const text = cellText(raw)
        if (key === "workSchedule") {
          if (text) data.workSchedule = /full/i.test(text) ? "full time" : "part time"
        } else if (key === "offerType") {
          if (text) data.offerType = /full|employ|perm/i.test(text) ? "full-time" : "internship"
        } else if (key === "amount") {
          if (text) data.amount = text.replace(/[^\d.]/g, "")
        } else {
          ;(data[key] as string) = text
        }
      })

      if (!data.salutationName) data.salutationName = firstName(data.candidateName)
      if (data.offerType === "internship" && data.startDate && data.endDate && data.endDate < data.startDate) {
        errors.push("End date is before start date")
      }
      errors.push(...missingFields(data).map((f) => `${f} missing`))
      return { row, data, errors }
    })
}

export function bulkTemplateCsv() {
  const example = ["Harshitha Sangram", "Harshitha", "Hyderabad", "harshitha@example.com", "Digital Marketing Intern", "2026-10-01", "2026-12-30", "Part time", "3000"]
  return [BULK_COLUMNS.join(","), example.join(",")].join("\n")
}
