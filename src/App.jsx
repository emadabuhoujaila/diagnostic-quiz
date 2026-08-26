import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StudentProvider } from './context/StudentContext'
import { TeacherProtectedRoute } from './components/ProtectedRoute'
import Home from './pages/Home'
import TeacherLogin from './pages/teacher/TeacherLogin'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentLogin from './pages/student/StudentLogin'
import StudentPortal from './pages/student/StudentPortal'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudentProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teacher/login" element={<TeacherLogin />} />
            <Route
              path="/teacher"
              element={
                <TeacherProtectedRoute>
                  <TeacherDashboard />
                </TeacherProtectedRoute>
              }
            />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
