import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function TeacherProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-center">
        <p className="muted">جاري التحميل…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/teacher/login" replace state={{ from: location }} />
  }

  return children
}
