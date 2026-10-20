import { format, isValid, parseISO, subMonths } from "date-fns"
import { toISODate } from "./offer-letter"
import { loadList, saveList } from "./storage"

/** "internship" → Internship Completion Letter; "employment" → Relieving Letter. */
export type RelievingType = "internship" | "employment"
export type WorkMode = "Offline" | "Online" | "Hybrid"

export type RelievingLetterData = {
  id: string
  letterType: RelievingType
  letterDate: string // yyyy-MM-dd

  employeeName: string
  employeeEmail: string
  role: string
  workMode: WorkMode
  startDate: string
  endDate: string

  companyName: string // as used in the body, e.g. "Dridha Technologies Pvt. Ltd."
  letterheadName: string
  addressLine: string
  contactLine: string
  signatoryName: string
  signatoryTitle: string
  signatureImage: string
  sealImage: string
}

export const RELIEVING_COMPANY_DEFAULTS = {
  companyName: "Dridha Technologies Pvt. Ltd.",
  letterheadName: "DRIDHA TECHNOLOGIES",
  addressLine: "Plot.no: 443/A/54, Road no 86, Jubilee Hills, Hyderabad.",
  contactLine: "E-mail:info@dridha.com ,Phone:+91-40-2360-8808.",
  signatoryName: "Saideep Reddy Borra",
  signatoryTitle: "COO",
  signatureImage: "/letter/signature-script.png",
  sealImage: "/letter/seal.png",
} as const

export function newRelievingLetter(): RelievingLetterData {
  const today = new Date()
  return {
    id: crypto.randomUUID(),
    letterType: "internship",
    letterDate: toISODate(today),
    employeeName: "",
    employeeEmail: "",
    role: "",
    workMode: "Offline",
    startDate: toISODate(subMonths(today, 2)),
    endDate: toISODate(today),
    ...RELIEVING_COMPANY_DEFAULTS,
  }
}

/** "July 10, 2026" — the date style used in the relieving template. */
export function formatLongDate(value: string) {
  const d = parseISO(value)
  return isValid(d) ? format(d, "MMMM d, yyyy") : "—"
}

export function relievingTitle(type: RelievingType) {
  return type === "internship" ? "Internship Completion Letter" : "Relieving Letter"
}

export function missingRelievingFields(data: RelievingLetterData) {
  const missing: string[] = []
  if (!data.employeeName.trim()) missing.push("Name")
  if (!data.role.trim()) missing.push("Role")
  if (!data.startDate) missing.push("Start date")
  if (!data.endDate) missing.push("End date")
  return missing
}

const STORAGE_KEY = "relieving-letters:v1"

export const loadSavedRelieving = () => loadList<RelievingLetterData>(STORAGE_KEY)
export const saveRelieving = (letters: RelievingLetterData[]) => saveList(STORAGE_KEY, letters)
