import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react"
import { useAuth } from "./auth-context"

export function AuthDialog() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register, loginWithGoogle } = useAuth()

  const [activeTab, setActiveTab] = useState<string>(authModalTab)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPass, setLoginPass] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPass, setRegisterPass] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Keep active tab in sync when opening modal
  React.useEffect(() => {
    setActiveTab(authModalTab)
    setErrorMsg(null)
  }, [authModalTab, isAuthModalOpen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      const ok = await login(loginEmail, loginPass)
      if (!ok) {
        setErrorMsg("ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (registerPass.length < 6) {
      setErrorMsg("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।")
      return
    }
    setIsSubmitting(true)
    try {
      const ok = await register(registerName, registerEmail, registerPass)
      if (!ok) {
        setErrorMsg("রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। এই ইমেইল ইতোমধ্যে ব্যবহৃত হতে পারে।")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      await loginWithGoogle()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              ⚡
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              বিলবাড়ি একাউন্ট
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            মিটার ট্র্যাকিং, দৈনিক খরচের স্ন্যাপশট ও ট্রেন্ড হিস্ট্রি সেভ করতে লগইন করুন।
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 pt-1">
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2.5 h-10 font-medium"
            onClick={handleGoogle}
            disabled={isSubmitting}
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.2 0 10.05 0 12s.46 3.8 1.27 5.41l4.01-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
              />
            </svg>
            <span>Google একাউন্ট দিয়ে এগিয়ে যান</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <span className="w-full border-t border-border" />
            <span className="bg-background px-2.5 text-xs text-muted-foreground uppercase tracking-wider">
              অথবা ইমেইল
            </span>
            <span className="w-full border-t border-border" />
          </div>

          <Tabs value={activeTab} onValueChange={(val) => { if (typeof val === "string") setActiveTab(val) }}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login" className="gap-1.5">
                <LogIn className="size-3.5" />
                <span>লগইন</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5">
                <UserPlus className="size-3.5" />
                <span>নিবন্ধন</span>
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-3 pt-3">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="size-3 text-muted-foreground" />
                    <span>ইমেইল ঠিকানা</span>
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    placeholder="example@mail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-pass" className="text-xs font-medium flex items-center gap-1.5">
                    <Lock className="size-3 text-muted-foreground" />
                    <span>পাসওয়ার্ড</span>
                  </Label>
                  <Input
                    id="login-pass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button type="submit" className="w-full h-9 font-medium mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "লগইন হচ্ছে..." : "লগইন করুন"}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-3 pt-3">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-xs font-medium flex items-center gap-1.5">
                    <UserIcon className="size-3 text-muted-foreground" />
                    <span>আপনার পূর্ণ নাম</span>
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="যেমন: মো: কামরুল হাসান"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="size-3 text-muted-foreground" />
                    <span>ইমেইল ঠিকানা</span>
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-pass" className="text-xs font-medium flex items-center gap-1.5">
                    <Lock className="size-3 text-muted-foreground" />
                    <span>পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</span>
                  </Label>
                  <Input
                    id="reg-pass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={registerPass}
                    onChange={(e) => setRegisterPass(e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button type="submit" className="w-full h-9 font-medium mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "একাউন্ট তৈরি হচ্ছে..." : "নিবন্ধন সম্পন্ন করুন"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-[11px] text-muted-foreground text-center pt-2 flex items-center justify-center gap-1">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>এনক্রিপ্ট করা নিরাপদ সেশন ও লোকাল ডেটা সুরক্ষা</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
