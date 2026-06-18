import SceneIntakeMode from './components/SceneIntakeMode'
import OnboardingTutorial from './components/OnboardingTutorial'

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <OnboardingTutorial />
      <SceneIntakeMode />
    </div>
  )
}
