import React, { useState, useEffect } from 'react';
import { Save, Upload, Smartphone, Globe, Shield, CreditCard, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Church } from '../../types';

export default function Settings() {
  const { church } = useOutletContext<{ church: Church }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (church) {
      setFormData({
        name: church.name || '',
        cnpj: church.cnpj || '',
        email: church.email || '',
        phone: church.phone || '',
        address: church.address || '',
      });
    }
  }, [church]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church?.id) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error("Error updating church settings:", error);
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500 mt-1">Gerencie as informações da igreja e personalize o aplicativo.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px px-6">
            <button className="border-b-2 border-indigo-600 text-indigo-600 py-4 px-4 font-medium text-sm">
              Geral
            </button>
            <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 py-4 px-4 font-medium text-sm">
              Aplicativo
            </button>
            <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 py-4 px-4 font-medium text-sm">
              Integrações
            </button>
            <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 py-4 px-4 font-medium text-sm">
              Assinatura
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Logo Section */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Logotipo da Igreja</h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Sem Logo</span>
              </div>
              <div>
                <button type="button" className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors mb-2">
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </button>
                <p className="text-xs text-slate-500">Recomendado: PNG ou JPG quadrado, máx 2MB.</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Igreja</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
