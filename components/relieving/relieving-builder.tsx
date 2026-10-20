"use client"

import { useState, type ChangeEvent } from "react"
import { Download, FilePlus2, Loader2, Mail, Save, Upload } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BuilderLayout, Labeled, SavedList, Section, downloadLetterPdf, selectClass, useNotice } from "@/components/letters/shared"
import {
  RELIEVING_COMPANY_DEFAULTS,
  type RelievingLetterData,
  formatLongDate,
  loadSavedRelieving,
  missingRelievingFields,
  newRelievingLetter,
  relievingTitle,
  saveRelieving,
} from "@/lib/relieving-letter"
import { RelievingLetter } from "./relieving-letter"

type ImageKey = "signatureImage" | "sealImage"

export function RelievingBuilder() {
  const [data, setData] = useState<RelievingLetterData>(newRelievingLetter)
  const [saved, setSaved] = useState<RelievingLetterData[]>(loadSavedRelieving)
  const [toast, setNotice] = useNotice()
  const [downloading, setDownloading] = useState(false)

  function set<K extends keyof RelievingLetterData>(key: K, value: RelievingLetterData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function bind(key: keyof RelievingLetterData) {
    return {
      value: data[key] as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(key, e.target.value as never),
    }
  }

  function upload(key: ImageKey) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => set(key, reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const missing = missingRelievingFields(data)
  const title = relievingTitle(data.letterType)

  function save() {
    const next = [data, ...saved.filter((l) => l.id !== data.id)]
    setSaved(next)
    saveRelieving(next)
    setNotice(`Saved ${title.toLowerCase()} for ${data.employeeName || "unnamed person"}.`)
  }

  function remove(id: string) {
    const next = saved.filter((l) => l.id !== id)
    setSaved(next)
    saveRelieving(next)
    if (id === data.id) setData(newRelievingLetter())
  }

  function startNew() {
    // Keep the letterhead/signatory settings HR already set up.
    setData((d) => {
      const fresh = newRelievingLetter()
      const keep = Object.keys(RELIEVING_COMPANY_DEFAULTS) as (keyof typeof RELIEVING_COMPANY_DEFAULTS)[]
      return { ...fresh, ...Object.fromEntries(keep.map((k) => [k, d[k]])) }
    })
  }

  async function downloadPdf() {
    if (missing.length) {
      setNotice(`Fill in: ${missing.join(", ")}`)
      return
    }
    setDownloading(true)
    try {
      await downloadLetterPdf(`${data.employeeName} ${title}`)
    } catch {
      setNotice("Couldn't create the PDF. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  function emailPerson() {
    if (!data.employeeEmail) {
      setNotice("Add the email address first.")
      return
    }
    const subject = `${title} – ${data.letterheadName}`
    const body = [
      `Dear ${data.employeeName},`,
      "",
      `Please find attached your ${title.toLowerCase()} for your tenure as ${data.role} (${formatLongDate(data.startDate)} to ${formatLongDate(data.endDate)}).`,
      "",
      "We wish you all the very best.",
      "",
      "Regards,",
      data.signatoryName,
      data.signatoryTitle,
      data.companyName,
    ].join("\n")
    window.location.href = `mailto:${encodeURIComponent(data.employeeEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function imageField(label: string, field: ImageKey) {
    return (
      <div className="flex items-center gap-2">
        <label className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Upload /> {label}
          <input type="file" accept="image/*" className="sr-only" onChange={upload(field)} />
        </label>
        {data[field] !== RELIEVING_COMPANY_DEFAULTS[field] && (
          <Button variant="ghost" size="sm" onClick={() => set(field, RELIEVING_COMPANY_DEFAULTS[field])}>
            Reset
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      {toast}
      <BuilderLayout
        missing={missing}
        actions={
          <>
            <Button variant="outline" onClick={startNew}>
              <FilePlus2 /> New
            </Button>
            <Button variant="outline" onClick={save}>
              <Save /> Save
            </Button>
            <Button variant="outline" onClick={emailPerson}>
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
            <Section title="Letter">
              <Labeled label="Letter type">
                <select className={selectClass} {...bind("letterType")}>
                  <option value="internship">Internship completion</option>
                  <option value="employment">Employee relieving</option>
                </select>
              </Labeled>
              <Labeled label="Letter date">
                <Input type="date" {...bind("letterDate")} />
              </Labeled>
            </Section>

            <Section title={data.letterType === "internship" ? "Intern" : "Employee"}>
              <Labeled label="Full name" wide>
                <Input placeholder="e.g. Chakka Venkata Sai Susritha Hasini" {...bind("employeeName")} />
              </Labeled>
              <Labeled label="Email" wide>
                <Input type="email" placeholder="name@example.com" {...bind("employeeEmail")} />
              </Labeled>
              <Labeled label="Role / designation" wide>
                <Input placeholder="e.g. Intern - AI Engineer" {...bind("role")} />
              </Labeled>
              <Labeled label="From">
                <Input type="date" {...bind("startDate")} />
              </Labeled>
              <Labeled label={data.letterType === "internship" ? "To" : "Last working day"}>
                <Input type="date" min={data.startDate} {...bind("endDate")} />
              </Labeled>
              {data.letterType === "internship" && (
                <Labeled label="Internship mode">
                  <select className={selectClass} {...bind("workMode")}>
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </Labeled>
              )}
            </Section>

            <Section title="Letterhead & signatory">
              <Labeled label="Letterhead name" wide>
                <Input {...bind("letterheadName")} />
              </Labeled>
              <Labeled label="Address line" wide>
                <Input {...bind("addressLine")} />
              </Labeled>
              <Labeled label="Contact line" wide>
                <Input {...bind("contactLine")} />
              </Labeled>
              <Labeled label="Company name (in body)" wide>
                <Input {...bind("companyName")} />
              </Labeled>
              <Labeled label="Signatory name">
                <Input {...bind("signatoryName")} />
              </Labeled>
              <Labeled label="Signatory title">
                <Input {...bind("signatoryTitle")} />
              </Labeled>
              {imageField("Upload seal", "sealImage")}
              {imageField("Upload signature", "signatureImage")}
            </Section>

            <SavedList
              items={saved}
              activeId={data.id}
              title={(l) => l.employeeName || "Unnamed"}
              subtitle={(l) => `${relievingTitle(l.letterType)} · ${l.role || "No role"}`}
              onOpen={setData}
              onDelete={remove}
            />
          </>
        }
        preview={<RelievingLetter data={data} />}
      />
    </>
  )
}
