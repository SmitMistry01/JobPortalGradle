import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../components/routing/ProtectedRoute'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { VerifyForgotOtpPage } from '../pages/auth/VerifyForgotOtpPage'
import { VerifyRegistrationOtpPage } from '../pages/auth/VerifyRegistrationOtpPage'
import { ForbiddenPage } from '../pages/common/ForbiddenPage'
import { HomePage } from '../pages/common/HomePage'
import { ProfilePage } from '../pages/common/ProfilePage'
import { ApplicationsPage } from '../pages/jobseeker/ApplicationsPage'
import { JobsPage } from '../pages/jobseeker/JobsPage'
import { RecruiterDashboardPage } from '../pages/recruiter/RecruiterDashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-otp', element: <VerifyRegistrationOtpPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'verify-forgot-otp', element: <VerifyForgotOtpPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },

      {
        element: <ProtectedRoute roles={['JOB_SEEKER']} />,
        children: [{ path: 'jobs', element: <JobsPage /> }],
      },
      {
        element: <ProtectedRoute roles={['JOB_SEEKER', 'RECRUITER', 'ADMIN']} />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['JOB_SEEKER']} />,
        children: [{ path: 'applications', element: <ApplicationsPage />}],
      },
      {
        element: <ProtectedRoute roles={['RECRUITER']} />,
        children: [
          { path: 'recruiter', element: <RecruiterDashboardPage /> },
          { path: 'post-job', element: <RecruiterDashboardPage /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['ADMIN']} />,
        children: [{ path: 'admin', element: <AdminDashboardPage /> }],
      },
    ],
  },
])
