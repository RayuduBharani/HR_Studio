import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  type OfferLetterData,
  formatDuration,
  formatLetterDate,
  formatRupees,
} from "@/lib/offer-letter"

/** Shows the value, or a highlighted placeholder (screen only) when HR hasn't filled it yet. */
function Field({ value, placeholder }: { value: string; placeholder: string }) {
  if (value.trim()) return <>{value}</>
  return <span data-placeholder className="rounded-sm bg-amber-100 px-0.5 text-amber-700">[{placeholder}]</span>
}

function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "letter-page relative mx-auto h-[297mm] w-[210mm] overflow-hidden bg-white px-[25mm] text-[10.5pt] leading-[1.3] text-black shadow-md print:shadow-none",
        className
      )}
    >
      {children}
    </section>
  )
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function OfferLetter({ data }: { data: OfferLetterData }) {
  const isIntern = data.offerType === "internship"
  const term = isIntern ? "internship" : "employment"
  const company = data.companyShortName || "the Company"
  const companyFriendly = titleCase(company)
  const salutation = data.salutationName || data.candidateName.split(" ")[0] || ""
  const pay = formatRupees(data.amount)
  const leaves = Number(data.leavesPerMonth) || 0
  const leaveText =
    leaves === 0
      ? "Leaves will be as per company policy."
      : `You are eligible to take ${leaves === 1 ? "one leave" : `${data.leavesPerMonth} leaves`} per month.`

  return (
    <div className="letter font-[Cambria,Georgia,'Times_New_Roman',serif] flex flex-col gap-6 print:gap-0">
      {/* Page 1 — offer */}
      <Page className="pt-[12mm]">
        <div className="flex justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/letter/logo.png" alt={company} className="h-[26mm] w-auto" />
        </div>

        <p className="mt-[3mm] text-[11.5pt]">
          Date: <b>{formatLetterDate(data.letterDate)}</b>
        </p>

        <div className="mt-[5mm]">
          <p className="font-bold">Name:</p>
          <p className="font-sans text-[10pt] font-bold">
            <Field value={data.candidateName} placeholder="Candidate Name" />,
          </p>
          <p className="font-bold">
            <Field value={data.candidateCity} placeholder="City" />
          </p>
        </div>

        <h1 className="mt-[16mm] text-center text-[11.5pt] font-bold">
          {isIntern ? "Internship Offer Letter" : "Offer Letter"}
        </h1>

        <p className="mt-[4mm]">
          Dear{" "}
          <span className="font-sans text-[10pt] font-bold">
            <Field value={salutation} placeholder="First Name" />,
          </span>
        </p>

        <p className="mt-[9mm] text-justify">
          In reference to your application, we would like to congratulate you on being selected{" "}
          {isIntern ? (
            <>
              for an internship as <b><Field value={data.role} placeholder="Role" /></b> with{" "}
              {data.companyName}. Your internship is scheduled to start from{" "}
              <b>
                {formatLetterDate(data.startDate)} to {formatLetterDate(data.endDate)}
              </b>{" "}
              for a period of <b>{formatDuration(data.startDate, data.endDate)}</b>. You will be paid{" "}
              <b>
                {pay} per month
                {data.payCondition.trim() && <> ({data.payCondition.trim()})</>}
              </b>{" "}
              as a stipend for your internship.
            </>
          ) : (
            <>
              for the position of <b><Field value={data.role} placeholder="Role" /></b> with{" "}
              {data.companyName}. Your employment is scheduled to start from{" "}
              <b>{formatLetterDate(data.startDate)}</b>. You will be paid{" "}
              <b>
                {pay} per month
                {data.payCondition.trim() && <> ({data.payCondition.trim()})</>}
              </b>{" "}
              as your salary.
            </>
          )}{" "}
          All of us at {companyFriendly} are excited that you will be joining our team!
        </p>

        <p className="mt-[5mm] text-justify">
          {isIntern
            ? "As such, your internship will include training/orientation and focus primarily on learning and developing new skills and gaining a deeper understanding of concepts through hands-on application of the knowledge you learned in class."
            : "As such, your initial period will include training/orientation and focus primarily on understanding our processes, products and the responsibilities of your role through hands-on application."}
        </p>

        <p className="mt-[9mm]">Sincerely,</p>
        {data.signatureImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.signatureImage} alt="Signature" className="mt-[3mm] h-[14mm] w-auto" />
        )}
        <p className="mt-[5mm] font-sans text-[10pt] font-bold">{data.signatoryName}</p>
        <p className="mt-[3mm] font-sans text-[10pt]">{data.signatoryTitle}</p>
      </Page>

      {/* Page 2 — enclosures + Annexure I (terms) */}
      <Page className="pt-[30mm] text-[9pt]">
        <p className="font-semibold underline">Enclosures</p>
        <ul className="mt-[3mm] list-disc pl-[10mm] text-[8.5pt]">
          <li>Appointment Terms (Annexure I)</li>
          <li>List of Documents to be furnished on joining (Annexure II)</li>
        </ul>

        <p className="mt-[12mm] font-bold">Annexure I</p>

        <ol className="mt-[4mm] list-decimal pl-[11mm]">
          <li className="font-bold">
            Terms &amp; Conditions:
            <ol className="mt-[3mm] list-[lower-roman] pl-[12mm] text-justify font-normal">
              <li>
                <b>Confidentiality of information:</b> You are required not to indulge, communicate or pass
                on any information related to a task assigned to you or information on any aspect of the
                Company to any one internal or external in any form.
              </li>
              <li>
                <b>Authorization:</b> You are not authorized to sign any letter, document, and paper as the
                case may be on behalf of {company} within or beyond the purview of your role until and unless
                you have a Power of Attorney or authorization from the Chief Executive Officer of {company}.
              </li>
              <li>
                <b>Passwords:</b> Access to our network, development environment and e-mail is through
                individual&apos;s password. For security reason it is essential to maintain confidentiality of
                the same and should not be shared with anyone. If the password is forgotten, the
                Infrastructure Support Services (ISS) is to reset and allow you to use a new password.
              </li>
              <li>
                <b>Security:</b> Security is an important aspect of {company}&apos;s communication and office
                infrastructure. If there is a need for you to take some of the equipment&apos;s/ products/
                infrastructure out of the office premises for any reason you are required to attain
                authorization from your immediate manager. You will not enter/indulge in any activity, which
                is detrimental to the company&apos;s integrity, security, infrastructure, network, records,
                property tools etc.
              </li>
              <li>
                <b>Indemnification:</b> You agree to indemnify the Company for any losses or damages
                sustained by the Company caused by or related to your breach of any of the provisions
                contained in this Terms of {isIntern ? "Internship" : "Employment"}.
              </li>
            </ol>
          </li>
        </ol>
      </Page>

      {/* Page 3 — remaining terms */}
      <Page className="pt-[30mm] text-[9pt]">
        <ol start={2} className="list-decimal pl-[11mm]">
          <li className="font-bold">
            Confidentiality:
            <p className="mt-[3mm] text-justify font-normal">
              You agree at all times as part of your employment with the Company, you will be imparted
              certain information which is confidential in nature to the employment and thereafter (without
              limit of time); you shall (a) hold the Confidential Information in strictest confidence, and not
              to use or attempt to use the same, except for the benefit of the Company, and (b) not disclose or
              divulge the Confidential Information to any person or entity without written authorization of
              the Company.
            </p>
          </li>
          <li className="mt-[4mm] font-bold">
            Intellectual Property:
            <p className="mt-[3mm] text-justify font-normal">
              You agree that any proprietary rights whatsoever, including but not limited to, patents,
              copyright and design rights as a result of the development of and/or the application of all
              work produced by you during or as a consequence of your employment, whether alone or in
              conjunction with others and whether during normal working hours or not, including but not
              limited to any invention, design, discovery or improvement, computer program, documentation,
              confidential information, copyright work or other material which you conceive, discover or
              create during or in consequence of this {term} with the Company shall belong to the Company
              absolutely.
            </p>
          </li>
        </ol>

        <div className="mt-[8mm] pl-[4mm]">
          <p className="font-bold">4. Hours of Work:</p>
          <p className="mt-[3mm] pl-[1mm]">
            {company} believes in flexi timing. You are joining in a {data.workSchedule} position and your
            working schedule will be decided by your immediate superior manager.
          </p>

          <p className="mt-[4mm] font-bold">5. Leave:</p>
          <p className="mt-[3mm] pl-[1mm]">{leaveText}</p>

          <p className="mt-[5mm] pl-[1mm] text-justify font-bold">
            The above terms and conditions of {term} are based on Company policies, procedures and other
            rules currently applicable and subject to amendments from time to time.
          </p>

          <p className="mt-[5mm] pl-[1mm] text-justify font-bold">
            You are requested to report at {data.reportingTime || "10 AM"} on your date of joining at the
            address confirmed by our Recruiter, and kindly submit all documents and items as listed in
            Annexure – II in original to our HR Department for the verification process. All such documents
            will be returned after verification keeping the photocopies of the same.
          </p>
        </div>
      </Page>

      {/* Page 4 — candidate acceptance */}
      <Page className="pt-[45mm] text-[9.5pt]">
        <p className="font-bold">Date: {formatLetterDate(data.letterDate)}</p>
        <p className="mt-[6mm] text-justify">
          I,{" "}
          <span className="font-sans font-bold">
            <Field value={data.candidateName} placeholder="Candidate Name" />,
          </span>{" "}
          have read, understand, and agree to the above terms and conditions set forth in this offer letter.
          I will join {company} on or before <b>{formatLetterDate(data.startDate)}</b>.
        </p>
        <p className="mt-[8mm]">Thanking you,</p>

        <div className="mt-[22mm] w-[60mm] border-t border-black pt-[1.5mm]">
          <p>Signature</p>
        </div>
      </Page>
    </div>
  )
}
