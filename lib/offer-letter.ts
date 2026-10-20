import { loadList, saveList } from "./storage"
import { addMonths, differenceInCalendarDays, format, isValid, parseISO, subDays } from "date-fns"

export type OfferType = "internship" | "full-time"
export type WorkSchedule = "part time" | "full time"

export type OfferLetterData = {
  id: string
  offerType: OfferType
  letterDate: string // yyyy-MM-dd

  candidateName: string
  salutationName: string
  candidateEmail: string
  candidateCity: string

  role: string
  workSchedule: WorkSchedule
  startDate: string
  endDate: string

  amount: string // monthly stipend or salary, digits only
  payCondition: string // e.g. "Based on 80% tasks completed and 30 downloads per month"

  reportingTime: string
  leavesPerMonth: string

  companyName: string
  companyShortName: string
  signatoryName: string
  signatoryTitle: string
  signatureImage: string // url or data url
}

export const COMPANY_DEFAULTS = {
  companyName: "DRIDHA TECHNOLOGIES Pvt Ltd",
  companyShortName: "DRIDHA TECHNOLOGIES",
  signatoryName: "Saideep Reddy Borra",
  signatoryTitle: "COO",
  signatureImage: "/letter/signature.png",
} as const

export function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd")
}

export function newOfferLetter(): OfferLetterData {
  const today = new Date()
  return {
    id: crypto.randomUUID(),
    offerType: "internship",
    letterDate: toISODate(today),
    candidateName: "",
    salutationName: "",
    candidateEmail: "",
    candidateCity: "",
    role: "",
    workSchedule: "part time",
    startDate: toISODate(today),
    endDate: toISODate(subDays(addMonths(today, 3), 1)),
    amount: "3000",
    payCondition: "Based on 80% tasks completed and 30 downloads per month",
    reportingTime: "10 AM",
    leavesPerMonth: "1",
    ...COMPANY_DEFAULTS,
  }
}

function parse(value: string) {
  const d = parseISO(value)
  return isValid(d) ? d : null
}

/** "1st Oct 2026" — matches the date style used in the letter template. */
export function formatLetterDate(value: string) {
  const d = parse(value)
  return d ? format(d, "do MMM yyyy") : "—"
}

/** "Rs. 3,000/-" */
export function formatRupees(value: string) {
  const n = Number(value.replace(/[^\d.]/g, ""))
  if (!value || Number.isNaN(n)) return "Rs. —/-"
  return `Rs. ${new Intl.NumberFormat("en-IN").format(n)}/-`
}

/** Whole months between start and end (inclusive), e.g. 1 Oct – 30 Dec → "3 months". */
export function formatDuration(start: string, end: string) {
  const s = parse(start)
  const e = parse(end)
  if (!s || !e || e < s) return "—"
  const days = differenceInCalendarDays(e, s) + 1
  const months = Math.round(days / 30.44)
  if (months >= 1) return `${months} month${months === 1 ? "" : "s"}`
  const weeks = Math.max(1, Math.round(days / 7))
  return `${weeks} week${weeks === 1 ? "" : "s"}`
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? ""
}

export function missingFields(data: OfferLetterData) {
  const missing: string[] = []
  if (!data.candidateName.trim()) missing.push("Candidate name")
  if (!data.role.trim()) missing.push("Role")
  if (!data.startDate) missing.push("Start date")
  if (data.offerType === "internship" && !data.endDate) missing.push("End date")
  if (!data.amount.trim()) missing.push(data.offerType === "internship" ? "Stipend" : "Salary")
  return missing
}

const STORAGE_KEY = "offer-letters:v1"

export const loadSavedLetters = () => loadList<OfferLetterData>(STORAGE_KEY)
export const saveLetters = (letters: OfferLetterData[]) => saveList(STORAGE_KEY, letters)
