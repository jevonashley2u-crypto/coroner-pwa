import { Routes, Route } from 'react-router-dom'
import SplashPage from '../features/splash/SplashPage'
import SceneIntakePage from '../features/cases/SceneIntakePage'
import CasesListPage from '../features/cases/CasesListPage'

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/intake" element={<SceneIntakePage />} />
      <Route path="/intake/:id" element={<SceneIntakePage />} />
      <Route path="/cases" element={<CasesListPage />} />
    </Routes>
  )
}
