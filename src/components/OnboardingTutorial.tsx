import { useEffect, useState } from 'react'

const STEPS = [
  {
    title: 'Rapid Unidentified Intake',
    description: 'Welcome to the field intake tool. This app is designed to capture physical evidence on-scene when fingerprints return no background results.',
  },
  {
    title: 'Step 1: Lock GPS Coordinates',
    description: 'Always tap "Capture GPS" first. The app fetches high-accuracy satellite coordinates to automatically check for missing persons reported in a localized radius.',
  },
  {
    title: 'Step 2: High-Res Feature Snap',
    description: 'Use the camera tool for macro-level photos of worn finger ridges, distinct surgical scars, or tattoos. Toggle the built-in flash overlay if lighting is poor.',
  },
  {
    title: 'Step 3: Local-First Auto-Sync',
    description: 'If you are in a basement or rural dead-zone with zero cell coverage, don\'t worry. The app stores all data safely on your device and uploads it to Supabase automatically the second you regain signal.',
  },
]

export default function OnboardingTutorial() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('forensic_tutorial_completed')) {
      setShow(true)
    }
  }, [])

  const done = () => {
    localStorage.setItem('forensic_tutorial_completed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex min-h-[300px] w-full max-w-sm flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-indigo-400">
              Field Guide {step + 1} / {STEPS.length}
            </span>
            <button onClick={done} className="font-mono text-xs uppercase tracking-wider text-slate-500 hover:text-slate-300">
              Skip
            </button>
          </div>
          <h2 className="mb-2 text-xl font-black uppercase tracking-tight text-slate-200">
            {STEPS[step].title}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            {STEPS[step].description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-700'}`}
              />
            ))}
          </div>

          <button
            onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : done()}
            className="h-11 rounded-lg bg-indigo-600 px-5 text-xs font-bold uppercase tracking-wider text-white transition-transform active:scale-95"
          >
            {step === STEPS.length - 1 ? 'Finish & Start' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  )
}
