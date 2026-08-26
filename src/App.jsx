import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StudentProvider } from './context/StudentContext'
import { TeacherProtectedRoute } from './components/ProtectedRoute'
import Home from './pages/Home'
import TeacherLogin from './pages/teacher/TeacherLogin'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentsPage from './pages/teacher/StudentsPage'
import ExamBuilderPage from './pages/teacher/ExamBuilderPage'
import SessionsPage from './pages/teacher/SessionsPage'
import ResultsPage from './pages/teacher/ResultsPage'
import StudentLogin from './pages/student/StudentLogin'
import StudentPortal from './pages/student/StudentPortal'
import StudentExamPage from './pages/student/StudentExamPage'

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
            <Route
              path="/teacher/students"
              element={
                <TeacherProtectedRoute>
                  <StudentsPage />
                </TeacherProtectedRoute>
              }
            />
            <Route
              path="/teacher/exam"
              element={
                <TeacherProtectedRoute>
                  <ExamBuilderPage />
                </TeacherProtectedRoute>
              }
            />
            <Route
              path="/teacher/sessions"
              element={
                <TeacherProtectedRoute>
                  <SessionsPage />
                </TeacherProtectedRoute>
              }
            />
            <Route
              path="/teacher/results"
              element={
                <TeacherProtectedRoute>
                  <ResultsPage />
                </TeacherProtectedRoute>
              }
            />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/student/exam" element={<StudentExamPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
