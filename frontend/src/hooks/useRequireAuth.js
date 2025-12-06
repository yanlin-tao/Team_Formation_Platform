import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchCurrentUser,
  getStoredUser,
  clearSession,
  persistSession,
} from '../services/api'

export function useRequireAuth() {
  const navigate = useNavigate()
  const storedUser = useMemo(() => getStoredUser(), [])
  const [user, setUser] = useState(storedUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('teamup_token')
    if (!token || !storedUser) {
      clearSession()
      navigate('/auth', { replace: true })
      return
    }

    const ensureSession = async () => {
      try {
        setLoading(true)
        const fresh = await fetchCurrentUser(storedUser.user_id, storedUser.email || storedUser.netid)
        setUser(fresh)
        persistSession(token, fresh)
      } catch (error) {
        console.warn('[useRequireAuth] session invalid:', error)
        clearSession()
        navigate('/auth', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    ensureSession()
  }, [navigate, storedUser])

  return { user, loading }
}
