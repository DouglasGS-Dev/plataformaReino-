import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mountain, Target, Users, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: (guest: boolean) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const steps = [
    {
      title: "Bem-vindo ao seu Diário Espiritual",
      description: "Um espaço sagrado para registrar sua caminhada com Deus, suas orações e aprendizados.",
      icon: <Mountain size={48} className="text-primary" />,
      color: "bg-primary-50"
    },
    {
      title: "Crescimento Constante",
      description: "Acompanhe seu progresso espiritual através de métricas e insights personalizados.",
      icon: <Target size={48} className="text-emerald-600" />,
      color: "bg-emerald-50"
    },
    {
      title: "Comunidade e Discipulado",
      description: "Conecte-se com sua igreja local, compartilhe testemunhos e cresça em unidade.",
      icon: <Users size={48} className="text-purple-600" />,
      color: "bg-purple-50"
    }
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      onComplete(false);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 }
      }
    })
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div 
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="max-w-md w-full text-center space-y-8 absolute"
          >
            <div className={`w-32 h-32 ${steps[step].color} rounded-[2rem] flex items-center justify-center mx-auto shadow-sm`}>
              {steps[step].icon}
            </div>
            
            <div className="space-y-4 px-4">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{steps[step].title}</h1>
              <p className="text-slate-600 text-lg leading-relaxed">
                {steps[step].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-8 bg-white border-t border-slate-100">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <button 
                key={i}
                onClick={() => {
                  setDirection(i > step ? 1 : -1);
                  setStep(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Ir para o passo ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className={`p-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all ${
                step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Anterior"
            >
              <ArrowLeft size={24} />
            </button>
            
            <button
              onClick={next}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-600 transition-all shadow-lg shadow-primary/25"
            >
              {step === steps.length - 1 ? "Começar Agora" : "Próximo"}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
