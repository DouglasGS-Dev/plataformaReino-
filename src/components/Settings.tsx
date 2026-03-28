import React, { useState, useEffect } from 'react';
import { Save, Upload, Smartphone, Globe, Shield, CreditCard, Loader2, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Church, UserProfile } from '../types';
import { generateDemoData, clearDemoData } from '../services/demoDataService';

export default function Settings() {
  const { church, userProfile } = useOutletContext<{ church: any, userProfile: UserProfile }>();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'app' | 'integrations' | 'billing' | 'dev'>('general');
  const [demoLoading, setDemoLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
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
    if (!effectiveChurchId) return;

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Salvando configurações...' });
    try {
      await updateDoc(doc(db, 'churches', effectiveChurchId), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      setStatusMsg({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      console.error("Error updating church settings:", error);
      setStatusMsg({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  const effectiveChurchId = church?.id || userProfile?.churchId;

  const handleGenerateDemo = async () => {
    if (!effectiveChurchId) {
      setStatusMsg({ type: 'error', text: 'Erro: ID da igreja não encontrado. Por favor, recarregue a página.' });
      return;
    }

    setDemoLoading(true);
    setStatusMsg({ type: 'info', text: 'Iniciando geração de dados fictícios...' });
    setShowConfirmGenerate(false);
    
    try {
      console.log("Starting demo data generation for church:", effectiveChurchId);
      await generateDemoData(effectiveChurchId);
      console.log("Demo data generation successful");
      setStatusMsg({ type: 'success', text: 'Sucesso! Dados de demonstração gerados. Explore o menu lateral para ver os novos membros, células e finanças.' });
    } catch (error: any) {
      console.error("Detailed error generating demo data:", error);
      setStatusMsg({ type: 'error', text: `Falha na geração: ${error.message || 'Erro de permissão ou conexão'}` });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleClearDemo = async () => {
    if (!effectiveChurchId) {
      setStatusMsg({ type: 'error', text: 'ID da igreja não encontrado.' });
      return;
    }

    setDemoLoading(true);
    setStatusMsg({ type: 'info', text: 'Removendo dados de teste...' });
    setShowConfirmClear(false);

    try {
      console.log("Clearing demo data for church:", effectiveChurchId);
      await clearDemoData(effectiveChurchId);
      setStatusMsg({ type: 'success', text: 'Dados de demonstração removidos com sucesso!' });
    } catch (error: any) {
      console.error("Error clearing demo data:", error);
      setStatusMsg({ type: 'error', text: `Erro ao remover dados: ${error.message || 'Erro desconhecido'}` });
    } finally {
      setDemoLoading(false);
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
        <div className="border-b border-slate-200 overflow-x-auto custom-scrollbar">
          <nav className="flex -mb-px px-4 sm:px-6 min-w-max">
            <button 
              onClick={() => setActiveTab('general')}
              className={`py-4 px-4 font-medium text-sm border-b-2 transition-all ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setActiveTab('app')}
              className={`py-4 px-4 font-medium text-sm border-b-2 transition-all ${activeTab === 'app' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Aplicativo
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={`py-4 px-4 font-medium text-sm border-b-2 transition-all ${activeTab === 'integrations' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Integrações
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-4 font-medium text-sm border-b-2 transition-all ${activeTab === 'billing' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Assinatura
            </button>
            <button 
              onClick={() => setActiveTab('dev')}
              className={`py-4 px-4 font-medium text-sm border-b-2 transition-all ${activeTab === 'dev' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Desenvolvedor
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <form onSubmit={handleSubmit} className="space-y-8">
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Contato</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2.5 primary-gradient text-white font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {activeTab === 'dev' && (
            <div className="space-y-8">
              {statusMsg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {statusMsg.type === 'info' && <Loader2 className="animate-spin" size={20} />}
                  <p className="text-sm font-medium">{statusMsg.text}</p>
                  {statusMsg.type !== 'info' && (
                    <button onClick={() => setStatusMsg(null)} className="ml-auto text-xs underline">Fechar</button>
                  )}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-4">
                <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-amber-800">Ferramentas de Desenvolvimento</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Estas ferramentas são destinadas apenas para testes. Elas permitem gerar dados fictícios para validar a navegação e o layout do sistema.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                    <Database size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Gerar Dados de Demonstração</h4>
                  <p className="text-sm text-slate-500 mt-2 mb-6">
                    Cria membros, posts, células, EBD e finanças fictícias para testes.
                  </p>
                  
                  {!showConfirmGenerate ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmGenerate(true)}
                      disabled={demoLoading}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {demoLoading ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                      Gerar Dados Fictícios
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-center text-slate-600">Confirmar criação de dados de teste?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateDemo}
                          className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90"
                        >
                          Sim, Gerar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmGenerate(false)}
                          className="flex-1 py-2.5 bg-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                    <Trash2 size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Limpar Dados de Teste</h4>
                  <p className="text-sm text-slate-500 mt-2 mb-6">
                    Remove todos os dados que foram marcados como demonstração. Não afeta seus dados reais.
                  </p>
                  
                  {!showConfirmClear ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(true)}
                      disabled={demoLoading}
                      className="w-full py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {demoLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      Limpar Tudo
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold text-center text-red-600 mb-1">Tem certeza? Isso é irreversível!</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleClearDemo}
                          className="flex-1 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700"
                        >
                          Sim, Apagar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmClear(false)}
                          className="flex-1 py-2 bg-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'app' || activeTab === 'integrations' || activeTab === 'billing') && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Smartphone size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Em breve</h3>
              <p className="text-slate-500 mt-1">Esta seção de configurações está em desenvolvimento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
