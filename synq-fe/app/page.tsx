"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Dashboard } from "@/components/dashboard"
import { ChatModal } from "@/components/chat-modal"
import { AuthModal } from "@/components/auth-modal"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <AuthModal onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} onOpenChat={() => setIsChatOpen(true)} />
      <Dashboard />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
