import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import type { Role } from '../../types/auth'

interface Props {
  roles?: Role[]
}

export function ProtectedRoute({ roles }: Props) {
  const location = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.token)

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}

