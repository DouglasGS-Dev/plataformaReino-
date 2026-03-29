import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Users, Heart, BookOpen, Shield, Sparkles, Smartphone, Building2 } from 'lucide-react';

const slides = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao REINO',
    subtitle: 'O Ecossistema Digital da Sua Igreja',
    description: 'Uma plataforma completa que une gestão administrativa, aplicativo para membros, rede social e discipulado em um só lugar.',
    icon: Sparkles,
    color: 'from-primary to-primary-600',
    iconColor: 'text-primary',
    bgColor: 'bg-primary-50',
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'app',
    title: 'App do Membro',
    subtitle: 'Conexão Diária',
    description: 'Seus membros conectados 24/7 com devocionais, pedidos de oração, feed da comunidade, diário espiritual e muito mais.',
    icon: Smartphone,
    color: 'from-emerald-500 to-emerald-700',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'admin',
    title: 'Gestão Completa',
    subtitle: 'Painel Administrativo',
    description: 'Controle total sobre membros, células, escola bíblica, financeiro, eventos e ministérios. Tudo organizado e acessível.',
    icon: Building2,
    color: 'from-blue-500 to-blue-700',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'discipleship',
    title: 'Discipulado',
    subtitle: 'Crescimento Espiritual',
    description: 'Acompanhe o desenvolvimento de cada membro, gerencie trilhas de crescimento e fortaleça os relacionamentos.',
    icon: Heart,
    color: 'from-purple-500 to-purple-700',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=1000'
  }
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/church-login');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.4 }
      }
    })
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col">
      {/* Background Image with Overlay */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-80 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 sm:p-12 max-w-4xl mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className={`w-20 h-20 rounded-3xl ${slide.bgColor} flex items-center justify-center shadow-2xl backdrop-blur-sm`}>
              <Icon className={`w-10 h-10 ${slide.iconColor}`} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-primary-300 font-bold tracking-wider uppercase text-sm">
                {slide.subtitle}
              </h2>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                {slide.title}
              </h1>
            </div>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="relative z-20 bg-slate-900/50 backdrop-blur-md border-t border-white/10 p-6 sm:px-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Pagination Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Ir para o slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              className={`p-4 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all ${
                currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Anterior"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            {currentSlide === slides.length - 1 ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/register"
                  className="px-6 py-4 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/20"
                >
                  Criar Conta
                </Link>
                <Link 
                  to="/church-login"
                  className="px-8 py-4 rounded-full bg-primary text-white font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
                >
                  Fazer Login
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ) : (
              <button
                onClick={nextSlide}
                className="p-4 rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-lg flex items-center justify-center"
                aria-label="Próximo"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
