import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminPage } from './pages/AdminPage'
import { AssessmentsPage } from './pages/AssessmentsPage'
import { AuthPage } from './pages/AuthPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { TestPage } from './pages/TestPage'
import { MessagesPage } from './pages/MessagesPage'
import { PublicProfilePage } from './pages/PublicProfilePage'

export function App(){return <Routes>
  <Route path="/" element={<LandingPage/>}/>
  <Route path="/auth" element={<AuthPage/>}/>
  <Route element={<ProtectedRoute/>}>
    <Route path="/onboarding" element={<OnboardingPage/>}/>
    <Route element={<AppShell/>}>
      <Route path="/app" element={<Navigate to="/app/discover" replace/>}/>
      <Route path="/app/discover" element={<DiscoverPage/>}/>
      <Route path="/app/assessments" element={<AssessmentsPage/>}/>
      <Route path="/app/assessments/:slug" element={<TestPage/>}/>
      <Route path="/app/integrations" element={<IntegrationsPage/>}/>
      <Route path="/app/profile" element={<ProfilePage/>}/>
      <Route path="/app/users/:id" element={<PublicProfilePage/>}/>
      <Route path="/app/messages" element={<MessagesPage/>}/>
      <Route path="/app/messages/:conversationId" element={<MessagesPage/>}/>
      <Route element={<ProtectedRoute admin/>}><Route path="/admin" element={<AdminPage/>}/></Route>
    </Route>
  </Route>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>}
