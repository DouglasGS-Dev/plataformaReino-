import React from 'react';
import { motion } from 'motion/react';
import { Mountain, Target, Users, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (guest: boolean) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = React.useState(0);

  const steps = [
    {
      title: "Bem-vindo ao seu Diário Espiritual",
      description: "Um espaço sagrado para registrar sua caminhada com Deus, suas orações e aprendizados.",
      icon: <Mountain size={48} className="text-primary" />,
      color: "bg-primary/10"
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
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <motion.div 
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className={`w-24 h-24 ${steps[step].color} rounded-3xl flex items-center justify-center mx-auto`}>
          {steps[step].icon}
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">{steps[step].title}</h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            {steps[step].description}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={next}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            {step === steps.length - 1 ? "Começar Agora" : "Próximo"}
            <ArrowRight size={20} />
          </button>
          
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-slate-900' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
