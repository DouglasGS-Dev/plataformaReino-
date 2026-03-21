import React from 'react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-sm">
        Esta funcionalidade está em desenvolvimento. Em breve você poderá acessar {title.toLowerCase()} aqui.
      </p>
    </div>
  );
}
