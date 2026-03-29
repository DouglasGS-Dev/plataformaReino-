import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { 
  Church as ChurchIcon, 
  User, 
  Palette, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  Smartphone,
  AlertCircle
} from 'lucide-react';

const COLORS = [
  { name: 'Roxo', value: '#8b5cf6', class: 'bg-primary' },
  { name: 'Azul', value: '#0284C7', class: 'bg-sky-600' },
  { name: 'Verde', value: '#16A34A', class: 'bg-green-600' },
  { name: 'Vermelho', value: '#DC2626', class: 'bg-red-600' },
  { name: 'Roxo', value: '#9333EA', class: 'bg-purple-600' },
  { name: 'Laranja', value: '#EA580C', class: 'bg-orange-600' },
  { name: 'Preto', value: '#0F172A', class: 'bg-slate-900' },
];

export default function RegisterChurch() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    churchName: '',
    membersCount: '',
    phone: '',
    adminName: '',
    email: '',
    password: '',
    appName: '',
    primaryColor: '#4F46E5'
  });

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Auth profile
      await updateProfile(user, {
        displayName: formData.adminName
      });

      // 3. Create Church document
      const churchId = `church_${Date.now()}`;
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await setDoc(doc(db, 'churches', churchId), {
        id: churchId,
        name: formData.churchName,
        inviteCode: inviteCode,
        ownerId: user.uid,
        primaryColor: formData.primaryColor,
        appName: formData.appName || formData.churchName,
        createdAt: serverTimestamp()
      });

      // 4. Create User profile document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.adminName,
        photoURL: '',
        role: 'admin',
        churchId: churchId,
        createdAt: serverTimestamp()
      });

      setIsSubmitting(false);
      setStep(4); // Success step
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Igreja', icon: ChurchIcon },
    { id: 2, title: 'Administrador', icon: User },
    { id: 3, title: 'Personalização', icon: Palette },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">
            {step === 4 ? 'Tudo Pronto!' : 'Crie o ecossistema da sua igreja'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {step === 4 
              ? 'Seu ambiente foi provisionado com sucesso.' 
              : 'Leva menos de 3 minutos para configurar sua plataforma.'}
          </p>
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
              <div 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 primary-gradient rounded-full z-0 transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {steps.map((s) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    step >= s.id ? 'primary-gradient border-transparent text-white' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap ${
                    step >= s.id ? 'text-primary' : 'text-slate-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100/50 sm:rounded-2xl sm:px-10 border border-slate-100 mt-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            {/* STEP 1: CHURCH INFO */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nome da Igreja</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={formData.churchName}
                      onChange={(e) => updateForm('churchName', e.target.value)}
                      placeholder="Ex: Igreja Batista Central"
                      className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Tamanho da Congregação</label>
                  <div className="mt-1">
                    <select
                      value={formData.membersCount}
                      onChange={(e) => updateForm('membersCount', e.target.value)}
                      className="appearance-none block w-full px-3 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white"
                    >
                      <option value="">Selecione uma opção</option>
                      <option value="1-50">1 a 50 membros</option>
                      <option value="51-200">51 a 200 membros</option>
                      <option value="201-500">201 a 500 membros</option>
                      <option value="501-1000">501 a 1000 membros</option>
                      <option value="1000+">Mais de 1000 membros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ADMIN INFO */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700">Seu Nome (Administrador)</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={formData.adminName}
                      onChange={(e) => updateForm('adminName', e.target.value)}
                      placeholder="Ex: Pr. João Silva"
                      className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">E-mail</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      placeholder="seu@email.com"
                      className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Senha</label>
                  <div className="mt-1">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                      placeholder="••••••••"
                      className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CUSTOMIZATION */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-primary-50 p-4 rounded-xl flex gap-4 items-start mb-6">
                  <Smartphone className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-primary">Seu próprio aplicativo</h4>
                    <p className="text-sm text-primary/80 mt-1">
                      Personalize como o aplicativo aparecerá para os membros da sua igreja.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Nome do Aplicativo</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={formData.appName}
                      onChange={(e) => updateForm('appName', e.target.value)}
                      placeholder={formData.churchName || "Ex: App IBC"}
                      className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Este é o nome que aparecerá abaixo do ícone no celular.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Cor Principal</label>
                  <div className="grid grid-cols-7 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => updateForm('primaryColor', color.value)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${color.class} ${
                          formData.primaryColor === color.value ? 'ring-4 ring-offset-2 ring-primary-200 scale-110' : 'hover:scale-110'
                        }`}
                        title={color.name}
                      >
                        {formData.primaryColor === color.value && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ambiente Criado!</h3>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                  O painel administrativo e o aplicativo da <strong>{formData.churchName || 'sua igreja'}</strong> já estão prontos para uso.
                </p>
                
                <button
                  onClick={() => navigate('/church-admin')}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white primary-gradient hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Acessar Painel Administrativo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || isSubmitting}
                className={`flex items-center text-sm font-medium ${
                  step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white primary-gradient hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white primary-gradient hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando ambiente...
                    </>
                  ) : (
                    <>
                      Finalizar Cadastro
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {step < 4 && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Já possui uma conta?{' '}
            <Link to="/church-login" className="font-medium text-primary hover:text-primary/80">
              Faça login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
