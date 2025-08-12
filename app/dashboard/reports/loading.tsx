import { Loader2 } from "lucide-react"

export default function ReportsLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
