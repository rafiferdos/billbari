import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { User } from "./types"
import { getCurrentUserFn, loginFn, registerFn, logoutFn, getGoogleAuthUrlFn } from "./auth-server"

interface AuthContextType {
  user: User | null
  isPremium: boolean
  isLoading: boolean
  isAuthModalOpen: boolean
  authModalTab: "login" | "register"
  openAuthModal: (tab?: "login" | "register") => void
  closeAuthModal: () => void
  isPricingModalOpen: boolean
  openPricingModal: () => void
  closePricingModal: () => void
  login: (email: string, pass: string) => Promise<boolean>
  register: (name: string, email: string, pass: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login")
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUserFn()
      setUser(u)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("auth_success") === "google") {
        toast.success("Google দিয়ে সফলভাবে লগইন সম্পন্ন হয়েছে!")
        params.delete("auth_success")
        const newSearch = params.toString() ? `?${params.toString()}` : ""
        window.history.replaceState({}, "", `${window.location.pathname}${newSearch}`)
        refreshUser()
      } else if (params.get("auth_error")) {
        toast.error("Google দিয়ে লগইন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।")
        params.delete("auth_error")
        const newSearch = params.toString() ? `?${params.toString()}` : ""
        window.history.replaceState({}, "", `${window.location.pathname}${newSearch}`)
      }
    }
  }, [refreshUser])

  const openAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const openPricingModal = () => {
    setIsPricingModalOpen(true)
  }

  const closePricingModal = () => {
    setIsPricingModalOpen(false)
  }

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await loginFn({ data: { email, password: pass } })
      if (res.success && res.user) {
        setUser(res.user)
        setIsAuthModalOpen(false)
        toast.success(`স্বাগতম, ${res.user.name}!`)
        return true
      }
      toast.error(res.error || "লগইন ব্যর্থ হয়েছে।")
      return false
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "লগইন করতে সমস্যা হয়েছে।")
      return false
    }
  }

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    try {
      const res = await registerFn({ data: { name, email, password: pass } })
      if (res.success && res.user) {
        setUser(res.user)
        setIsAuthModalOpen(false)
        toast.success(`অভিনন্দন, ${res.user.name}! আপনার অ্যাকাউন্ট তৈরি হয়েছে।`)
        return true
      }
      toast.error(res.error || "রেজিস্ট্রেশন সম্পন্ন করা যায়নি।")
      return false
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "রেজিস্ট্রেশন করতে সমস্যা হয়েছে।")
      return false
    }
  }

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined
      const res = await getGoogleAuthUrlFn({ data: { origin } })
      if (res?.url) {
        setIsAuthModalOpen(false)
        toast.info("Google সাইন-ইন পেজে নিয়ে যাওয়া হচ্ছে...")
        window.location.href = res.url
        return true
      }
      toast.error("Google লগইন লিংক তৈরি করা সম্ভব হয়নি।")
      return false
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google লগইনে সমস্যা হয়েছে।")
      return false
    }
  }

  const logout = async () => {
    try {
      await logoutFn()
      setUser(null)
      toast.info("আপনি সফলভাবে লগআউট করেছেন।")
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isPremium: Boolean(user?.isPremium),
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isPricingModalOpen,
        openPricingModal,
        closePricingModal,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
