import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { User } from "./types"
import { getCurrentUserFn, loginFn, registerFn, logoutFn, googleOAuthMockFn } from "./auth-server"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthModalOpen: boolean
  authModalTab: "login" | "register"
  openAuthModal: (tab?: "login" | "register") => void
  closeAuthModal: () => void
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
  }, [refreshUser])

  const openAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await loginFn({ data: { email, password: pass } })
      if (res.success && res.user) {
        setUser(res.user)
        setIsAuthModalOpen(false)
        toast.success(`স্বাগতম, ${res.user.name}! লগইন সফল হয়েছে।`)
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
      const res = await googleOAuthMockFn({
        data: {
          email: "nesco.consumer@gmail.com",
          name: "মো: রফিকুল ইসলাম",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        },
      })
      if (res.success && res.user) {
        setUser(res.user)
        setIsAuthModalOpen(false)
        toast.success(`Google দিয়ে লগইন সফল হয়েছে: ${res.user.name}`)
        return true
      }
      toast.error(res.error || "Google লগইন ব্যর্থ হয়েছে।")
      return false
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google লগইনে ত্রুটি।")
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
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
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
