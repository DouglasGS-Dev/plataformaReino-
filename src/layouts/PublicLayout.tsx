import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Logo className="w-10 h-10" showText={false} />
            <span className="font-bold text-xl tracking-tight">REINO</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">Recursos</Link>
            <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">Preços</Link>
            <Link to="/church-login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Entrar</Link>
            <Link to="/register" className="btn-primary text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Criar Igreja
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Logo className="w-8 h-8" showText={false} />
            <span className="font-bold text-lg text-white">REINO</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} REINO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
