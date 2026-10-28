export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  googleId?: string | null
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface SavedMeter {
  id: string
  userId: string
  meterNumber: string
  customerNumber?: string
  customerName?: string
  address?: string
  tariff?: string
  sanctionedLoad?: string
  alias?: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}
