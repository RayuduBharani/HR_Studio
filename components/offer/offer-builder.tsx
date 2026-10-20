"use client"

import { useState, type ChangeEvent } from "react"
import { Download, FilePlus2, Loader2, Sheet, Mail, Save, Upload } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  COMPANY_DEFAULTS,
  type OfferLetterData,
  firstName,
  formatLetterDate,
  loadSavedLetters,
  missingFields,
  newOfferLetter,
  saveLetters,
} from "@/lib/offer-letter"
import { BuilderLayout, Labeled, SavedList, Section, downloadLetterPdf, selectClass, useNotice } from "@/components/letters/shared"
import { BulkOffers } from "./bulk-offers"
import { OfferLetter } from "./offer-letter"

export function OfferBuilder() {
  const [data, setData] = useState<OfferLetterData>(newOfferLetter)
  const [saved, setSaved] = useState<OfferLetterData[]>(loadSavedLetters)
  const [toast, setNotice] = useNotice()
  const [downloading, setDownloading] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  function set<K extends keyof OfferLetterData>(key: K, value: OfferLetterData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function bind(key: keyof OfferLetterData) {
    return {
      value: data[key] as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        set(key, e.target.value as never),
    }
  }

  function onNameChange(e: ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setData((d) => ({
      ...d,
      candidateName: name,
      // Keep "Dear <first name>" in sync unless HR has customised it.
      salutationName:
        !d.salutationName || d.salutationName === firstName(d.candidateName) ? firstName(name) : d.salutationName,
    }))
  }

  function onSignatureUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set("signatureImage", reader.result as string)
    reader.readAsDataURL(file)
  }

  const missing = missingFields(data)

  function save() {
    const next = [data, ...saved.filter((l) => l.id !== data.id)]
    setSaved(next)
    saveLetters(next)
    setNotice(`Saved offer letter for ${data.candidateName || "unnamed candidate"}.`)
  }

  function remove(id: string) {
    const next = saved.filter((l) => l.id !== id)
    setSaved(next)
    saveLetters(next)
    if (id === data.id) setData(newOfferLetter())
  }

  function startNew() {
    // Keep the company/signatory settings HR already set up.
    setData((d) => ({
      ...newOfferLetter(),
      companyName: d.companyName,
      companyShortName: d.companyShortName,
      signatoryName: d.signatoryName,
      signatoryTitle: d.signatoryTitle,
      signatureImage: d.signatureImage,
    }))
  }

  async function downloadPdf() {
    if (missing.length) {
      setNotice(`Fill in: ${missing.join(", ")}`)
      return
    }
    setDownloading(true)
    try {
      await downloadLetterPdf(`${data.candidateName} Offer Letter`)
    } catch {
      setNotice("Couldn't create the PDF. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  function emailCandidate() {
    if (!data.candidateEmail) {
      setNotice("Add the candidate's email first.")
      return
    }
    const subject = `${data.offerType === "internship" ? "Internship " : ""}Offer Letter – ${data.companyShortName}`
    const body = [
      `Dear ${data.salutationName || data.candidateName},`,
      "",
      `Congratulations! We are pleased to offer you the ${data.offerType === "internship" ? "internship" : "position"} of ${data.role} with ${data.companyName}, starting ${formatLetterDate(data.startDate)}.`,
      "",
      "Please find your offer letter attached. Kindly review it, sign the acceptance page and send it back to us.",
      "",
      "Regards,",
      data.signatoryName,
      data.signatoryTitle,
      data.companyShortName,
    ].join("\n")
    window.location.href = `mailto:${encodeURIComponent(data.candidateEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <>
      {toast}
      <BulkOffers open={bulkOpen} onOpenChange={setBulkOpen} base={data} />
      <BuilderLayout
        missing={missing}
        actions={
          <>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Sheet /> Bulk upload
            </Button>
            <Button variant="outline" onClick={startNew}>
              <FilePlus2 /> New
            </Button>
            <Button variant="outline" onClick={save}>
              <Save /> Save
            </Button>
            <Button variant="outline" onClick={emailCandidate}>
              <Mail /> Email
            </Button>
            <Button onClick={downloadPdf} disabled={downloading}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              {downloading ? "Preparing…" : "Download PDF"}
            </Button>
          </>
        }
        form={
          <>
            <Section title="Offer">
              <Labeled label="Offer type">
                <select className={selectClass} {...bind("offerType")}>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-time employment</option>
                </select>
              </Labeled>
              <Labeled label="Letter date">
                <Input type="date" {...bind("letterDate")} />
              </Labeled>
            </Section>

            <Section title="Candidate">
              <Labeled label="Full name" wide>
                <Input placeholder="e.g. Harshitha Sangram" value={data.candidateName} onChange={onNameChange} />
              </Labeled>
              <Labeled label="Salutation" hint='Used in "Dear …"'>
                <Input placeholder="First name" {...bind("salutationName")} />
              </Labeled>
              <Labeled label="City">
                <Input placeholder="e.g. Hyderabad" {...bind("candidateCity")} />
              </Labeled>
              <Labeled label="Email" wide>
                <Input type="email" placeholder="candidate@example.com" {...bind("candidateEmail")} />
              </Labeled>
            </Section>

            <Section title="Role & schedule">
              <Labeled label="Role / designation" wide>
                <Input placeholder="e.g. Digital Marketing Intern" {...bind("role")} />
              </Labeled>
              <Labeled label="Start date">
                <Input type="date" {...bind("startDate")} />
              </Labeled>
              {data.offerType === "internship" && (
                <Labeled label="End date">
                  <Input type="date" min={data.startDate} {...bind("endDate")} />
                </Labeled>
              )}
              <Labeled label="Position">
                <select className={selectClass} {...bind("workSchedule")}>
                  <option value="part time">Part time</option>
                  <option value="full time">Full time</option>
                </select>
              </Labeled>
            </Section>

            <Section title="Compensation">
              <Labeled label={data.offerType === "internship" ? "Monthly stipend (₹)" : "Monthly salary (₹)"}>
                <Input inputMode="numeric" placeholder="3000" {...bind("amount")} />
              </Labeled>
              <Labeled label="Pay condition" hint="Optional — shown in brackets after the amount" wide>
                <Textarea rows={2} {...bind("payCondition")} />
              </Labeled>
            </Section>

            <Section title="Company & signatory">
              <Labeled label="Company legal name" wide>
                <Input {...bind("companyName")} />
              </Labeled>
              <Labeled label="Company short name" wide>
                <Input {...bind("companyShortName")} />
              </Labeled>
              <Labeled label="Signatory name">
                <Input {...bind("signatoryName")} />
              </Labeled>
              <Labeled label="Signatory title">
                <Input {...bind("signatoryTitle")} />
              </Labeled>
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Upload /> Upload signature
                  <input type="file" accept="image/*" className="sr-only" onChange={onSignatureUpload} />
                </label>
                {data.signatureImage !== COMPANY_DEFAULTS.signatureImage && (
                  <Button variant="ghost" size="sm" onClick={() => set("signatureImage", COMPANY_DEFAULTS.signatureImage)}>
                    Reset
                  </Button>
                )}
              </div>
            </Section>

            <SavedList
              items={saved}
              activeId={data.id}
              title={(l) => l.candidateName || "Unnamed candidate"}
              subtitle={(l) => `${l.role || "No role"} · starts ${formatLetterDate(l.startDate)}`}
              onOpen={setData}
              onDelete={remove}
            />
          </>
        }
        preview={<OfferLetter data={data} />}
      />
    </>
  )
}
