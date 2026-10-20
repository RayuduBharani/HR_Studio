/* eslint-disable @next/next/no-img-element -- letter images must print exactly as uploaded */
import { type RelievingLetterData, formatLongDate, relievingTitle } from "@/lib/relieving-letter"

function Field({ value, placeholder }: { value: string; placeholder: string }) {
  if (value.trim()) return <>{value}</>
  return <span data-placeholder className="rounded-sm bg-amber-100 px-0.5 text-amber-700">[{placeholder}]</span>
}

export function RelievingLetter({ data }: { data: RelievingLetterData }) {
  const isIntern = data.letterType === "internship"
  const period = (
    <b>
      {formatLongDate(data.startDate)} to {formatLongDate(data.endDate)}
    </b>
  )

  return (
    <div className="letter">
      <section className="letter-page relative mx-auto h-[297mm] w-[210mm] overflow-hidden bg-white font-[Calibri,Carlito,'Segoe_UI',Arial,sans-serif] text-[10.5pt] leading-[1.35] text-black shadow-md print:shadow-none">
        {/* Letterhead */}
        <header className="flex items-center gap-[6mm] px-[12mm] pt-[10mm] pb-[3mm]">
          <img src="/letter/logo.png" alt="" className="h-[33mm] w-auto" />
          <div className="text-center text-[#2f5496]">
            <p className="font-['Times_New_Roman',Times,serif] text-[21pt] leading-tight">{data.letterheadName}</p>
            <p className="mt-[3mm] text-[11.5pt]">{data.addressLine}</p>
            <p className="font-['Times_New_Roman',Times,serif] text-[11.5pt]">{data.contactLine}</p>
          </div>
        </header>
        <hr className="border-0 border-t border-[#8eaadb]" />

        <div className="px-[14mm]">
          <h1 className="mt-[18mm] text-center text-[15pt] font-bold text-[#595959]">
            {relievingTitle(data.letterType)}
          </h1>

          <p className="mt-[22mm] font-bold">Date: {formatLongDate(data.letterDate)}</p>

          <p className="mt-[4mm]">
            Dear <b><Field value={data.employeeName} placeholder="Name" /> ,</b>
          </p>

          <p className="mt-[4mm]">
            {isIntern ? (
              <>
                With reference to your <b>{data.workMode} Internship Completion</b> from {period} as{" "}
                <b><Field value={data.role} placeholder="Role" />.</b>
              </>
            ) : (
              <>
                With reference to your <b>resignation</b>, we confirm that you have been relieved from your duties
                with effect from <b>{formatLongDate(data.endDate)}</b>. You were associated with us from {period} as{" "}
                <b><Field value={data.role} placeholder="Role" />.</b>
              </>
            )}
          </p>

          <p className="mt-[4mm]">
            {isIntern
              ? "During your internship, you demonstrated dedication, enthusiasm, and a willingness to learn. We appreciate your contributions and sincerely thank you for your efforts during your tenure with us."
              : "During your tenure, you demonstrated dedication, professionalism, and commitment. We appreciate your contributions and sincerely thank you for your efforts during your time with us."}
          </p>

          <p className="mt-[4mm]">
            We wish you every success in your future {isIntern ? "academic and professional" : "professional"}{" "}
            endeavors and are confident that your skills and determination will lead you to greater achievements.
          </p>

          <p className="mt-[3mm]">
            We thank you for being a part of <b>{data.companyName}</b> and wish you all the very best.
          </p>

          <p className="mt-[8mm] font-bold">From {data.companyName}</p>

          {data.sealImage && <img src={data.sealImage} alt="Company seal" className="mt-[4mm] h-[19mm] w-auto" />}

          <p className="mt-[5mm] font-bold">
            {data.signatoryName} {data.signatoryTitle}
          </p>
          {data.signatureImage && (
            <img src={data.signatureImage} alt="Signature" className="mt-[1mm] h-[6mm] w-auto" />
          )}
        </div>
      </section>
    </div>
  )
}
