import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mountain, Target, Users, ArrowRight, ArrowLeft, 
  Church, BookOpen, HandHeart, User, ShieldCheck, Sparkles 
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (action: 'register' | 'login' | 'guest') => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'membro' | 'lider' | 'conhecendo' | null>(null);

  const steps = [
    {
      title: "Você não está aqui por acaso.",
      description: "Existe um propósito maior conectando pessoas, igrejas e ministérios em um só lugar.",
      icon: <Mountain size={48} className="text-white" />,
      color: "bg-primary",
      type: 'default'
    },
    {
      title: "A conexão está se perdendo...",
      description: "Igrejas desorganizadas, membros desconectados e ministérios sem comunicação clara.",
      icon: <Users size={48} className="text-slate-400" />,
      color: "bg-slate-100",
      type: 'default'
    },
    {
      title: "O Reino conecta tudo.",
      description: "Uma plataforma onde fé, comunhão e organização caminham juntas.",
      icon: <Target size={48} className="text-primary" />,
      color: "bg-primary-50",
      type: 'default'
    },
    {
      title: "Cresça, organize e conecte.",
      description: "Fortaleça sua vida espiritual enquanto participa de uma igreja mais estruturada e ativa.",
      icon: <BookOpen size={48} className="text-emerald-600" />,
      color: "bg-emerald-50",
      type: 'benefits'
    },
    {
      title: "Como você deseja fazer parte?",
      description: "Vamos personalizar sua experiência dentro do Reino.",
      type: 'role'
    },
    {
      title: "Você faz parte disso.",
      description: "Entre agora e viva uma nova forma de se conectar com o Reino.",
      type: 'conversion'
    }
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const slideVariants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3, ease: "easeIn" }
    })
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${step === 0 || step === 5 ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Skip Button */}
      {step < 5 && (
        <div className="absolute right-6 top-6 z-10">
          <button onClick={() => onComplete('guest')} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${step === 0 || step === 5 ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            Pular
          </button>
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute w-full max-w-md space-y-8 text-center">
            
            {steps[step].type === 'default' && (
              <>
                <div className={`mx-auto flex h-32 w-32 items-center justify-center rounded-[2rem] shadow-sm ${steps[step].color}`}>
                  {steps[step].icon}
                </div>
                <div className="space-y-3 px-4">
                  <h1 className={`text-3xl font-extrabold tracking-tight ${step === 0 ? 'text-white' : 'text-slate-900'}`}>{steps[step].title}</h1>
                  <p className={`text-lg leading-relaxed ${step === 0 ? 'text-slate-300' : 'text-slate-600'}`}>{steps[step].description}</p>
                </div>
              </>
            )}

            {steps[step].type === 'benefits' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{steps[step].title}</h1>
                <div className="grid gap-4">
                  {[
                    { icon: <BookOpen className="text-primary" />, text: "Crescimento espiritual" },
                    { icon: <Church className="text-primary" />, text: "Gestão eficiente" },
                    { icon: <HandHeart className="text-primary" />, text: "Comunhão real" }
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="rounded-xl bg-primary-50 p-3">{b.icon}</div>
                      <span className="font-bold text-slate-700">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {steps[step].type === 'role' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{steps[step].title}</h1>
                <div className="grid gap-3">
                  {[
                    { id: 'membro', label: 'Sou membro', icon: <User /> },
                    { id: 'lider', label: 'Sou líder', icon: <ShieldCheck /> },
                    { id: 'conhecendo', label: 'Estou conhecendo', icon: <Sparkles /> }
                  ].map((role) => (
                    <button 
                      key={role.id}
                      onClick={() => setSelectedRole(role.id as any)}
                      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left font-bold transition-all ${selectedRole === role.id ? 'border-primary bg-primary-50 text-primary' : 'border-slate-100 bg-white text-slate-600'}`}
                    >
                      <div className={`rounded-xl p-3 ${selectedRole === role.id ? 'bg-primary text-white' : 'bg-slate-100'}`}>{role.icon}</div>
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {steps[step].type === 'conversion' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{steps[step].title}</h1>
                <p className="text-lg leading-relaxed text-slate-300">{steps[step].description}</p>
                <div className="grid gap-3">
                  <button onClick={() => onComplete('register')} className="w-full rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-600">Criar conta</button>
                  <button onClick={() => onComplete('login')} className="w-full rounded-2xl bg-white py-4 font-bold text-slate-900 transition-all hover:bg-slate-100">Já tenho conta</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < 5 && (
        <div className="border-t border-slate-100 bg-white p-6 sm:p-8">
          <div className="mx-auto max-w-md space-y-6">
            <div className="flex justify-center gap-2">
              {steps.slice(0, 5).map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prev} className={`rounded-2xl border border-slate-200 p-4 text-slate-600 transition-all hover:bg-slate-50 ${step === 0 ? 'invisible' : 'visible'}`}><ArrowLeft size={24} /></button>
              <button onClick={next} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-600">
                {step === 4 ? "Continuar" : "Próximo"}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
