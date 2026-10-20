import type { Metadata } from "next"
import { RelievingStudio } from "@/components/relieving/relieving-studio"

export const metadata: Metadata = {
  title: "Relieving Letter · HR Letter Studio",
}

export default function RelievingPage() {
  return <RelievingStudio />
}
