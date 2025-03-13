'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { syncUserWithDatabase, getCurrentUserData } from '../utils/user-utils'

interface UserData {
  id: string
  email: string
  first_name?: string
  last_name?: string
  token_balance: number
  tokens_spent: number
  is_subscribed: boolean
  kinde_user_id?: string
  avatar_url?: string
}

interface AuthContextType {
  user: UserData | null
  loading: boolean
  updateUser: () => Promise<UserData | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUser: async () => null
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: kindeUser, isLoading, isAuthenticated } = useKindeBrowserClient()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!isLoading) {
          if (isAuthenticated && kindeUser) {
            // First ensure the user exists in the database
            await syncUserWithDatabase(kindeUser)
            // Then get the full user data
            const userData = await getCurrentUserData(kindeUser)
            setUser(userData)
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isLoading, isAuthenticated, kindeUser])

  const updateUser = async () => {
    if (kindeUser) {
      const updatedUser = await getCurrentUserData(kindeUser)
      setUser(updatedUser)
      return updatedUser
    }
    return null
  }

  return (
    <AuthContext.Provider value={{ user, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}