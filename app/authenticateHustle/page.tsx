
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function AuthenticateHustlePage() {
  const [countdown, setCountdown] = useState(25)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleGoToHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Red X Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl font-semibold text-gray-300">
          Authenticating User
        </h1>

        {/* Error Message */}
        <div className="space-y-2">
          <p className="text-red-400 text-lg">
            Authentication failed: No authentication token
          </p>
          <p className="text-red-400 text-lg">
            found in URL. Redirecting to home in {countdown}s...
          </p>
        </div>

        {/* Countdown Text */}
        <p className="text-gray-500 text-sm">
          Redirecting automatically in {countdown} seconds
        </p>

        {/* Go to Home Button */}
        <Button 
          onClick={handleGoToHome}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
        >
          Go to Home
        </Button>
      </div>
    </div>
  )
}
