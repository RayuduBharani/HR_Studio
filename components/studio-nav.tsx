"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileCheck2, FileSignature } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Offer Letter", icon: FileSignature },
  { href: "/relieving", label: "Relieving Letter", icon: FileCheck2 },
]

export function StudioNav() {
  const pathname = usePathname()

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b bg-background px-4 pt-3 print:hidden">
      <div className="flex items-center gap-2 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/letter/logo.png" alt="" className="size-8" />
        <div>
          <p className="text-base font-semibold leading-tight">HR Letter Studio</p>
          <p className="text-xs text-muted-foreground">Offer and relieving letters for your team</p>
        </div>
      </div>
      <nav className="flex gap-1 self-end" aria-label="Letter type">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" /> {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
