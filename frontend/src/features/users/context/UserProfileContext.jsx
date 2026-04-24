import { createContext, useCallback, useContext, useEffect, useState } from "react"
import profileService from "@/features/users/services/profileService"

const UserProfileContext = createContext(null)

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    const token = sessionStorage.getItem("token")
    if (!token) return
    setProfileLoading(true)
    try {
      const data = await profileService.getProfile()
      setProfile(data)
    } catch {
      // ignore — user may not be authenticated yet
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return (
    <UserProfileContext.Provider value={{ profile, profileLoading, setProfile, refreshProfile: fetchProfile }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  return useContext(UserProfileContext) ?? { profile: null, profileLoading: false, setProfile: () => {}, refreshProfile: () => {} }
}
