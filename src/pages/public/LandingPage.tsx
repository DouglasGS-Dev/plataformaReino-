import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Heart, BookOpen, Shield, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 pt-24 pb-32">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/church/1920/1080?blur=10')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8"
          >
            O Ecossistema Digital da <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Sua Igreja
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto mb-10"
          >
            Gestão administrativa, aplicativo próprio, rede social e discipulado. 
            Tudo em uma única plataforma feita para expandir o Reino.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/app" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
              Ver App do Membro
            </Link>
            <Link to="/church-login" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 shadow-sm transition-all">
              Login Administrativo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Tudo que sua igreja precisa</h2>
            <p className="mt-4 text-lg text-slate-600">Uma plataforma completa para pastores, líderes e membros.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Users, title: 'Gestão de Membros', desc: 'Cadastro completo, histórico espiritual e acompanhamento pastoral.' },
              { icon: Heart, title: 'Discipulado 1-a-1', desc: 'Trilhas de crescimento, mentoria e acompanhamento de novos convertidos.' },
              { icon: BookOpen, title: 'Escola Bíblica', desc: 'Gestão de turmas, materiais de estudo e controle de presença.' },
              { icon: Shield, title: 'Painel Administrativo', desc: 'Controle financeiro, gestão de células e relatórios gerenciais.' },
              { icon: Sparkles, title: 'App Personalizado', desc: 'Aplicativo com a cara da sua igreja para engajar os membros.' },
              { icon: ArrowRight, title: 'Rede Social Interna', desc: 'Feed de notícias, pedidos de oração e comunhão digital.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
