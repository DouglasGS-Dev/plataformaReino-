import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Camera, 
  Save, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserProfile as UserProfileType } from '../types';

interface UserProfileProps {
  profile: UserProfileType;
  onUpdate: (updatedProfile: UserProfileType) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ profile, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileType>>({
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    birthDate: profile.birthDate || '',
    ministry: profile.ministry || '',
    socialLinks: {
      instagram: profile.socialLinks?.instagram || '',
      facebook: profile.socialLinks?.facebook || '',
      whatsapp: profile.socialLinks?.whatsapp || '',
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const storageRef = ref(storage, `users/${profile.uid}/profile_pic_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      setMessage({ type: 'success', text: 'Foto carregada com sucesso!' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar foto. Tente novamente.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const userRef = doc(db, 'users', profile.uid);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);
      
      onUpdate({
        ...profile,
        ...formData,
        updatedAt: new Date()
      } as UserProfileType);

      setIsEditing(false);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header/Cover */}
        <div className="h-32 primary-gradient relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              {(isEditing ? formData.photoURL : profile.photoURL) ? (
                <img 
                  src={isEditing ? formData.photoURL : profile.photoURL} 
                  alt={profile.displayName} 
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg transition-all group-hover:brightness-90"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center group-hover:bg-slate-200 transition-all">
                  <User size={40} className="text-slate-400" />
                </div>
              )}
              
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                </button>
              )}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.displayName || 'Usuário'}
              </h1>
              <p className="text-slate-500 flex items-center gap-2">
                <Mail size={14} /> {profile.email}
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                {profile.role}
              </div>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                Editar Perfil
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nome de Exibição</label>
                    <input 
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Foto de Perfil</label>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 transition-all text-slate-600 hover:text-primary font-medium"
                    >
                      {isUploading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Upload size={18} />
                      )}
                      {formData.photoURL ? 'Alterar Foto' : 'Escolher da Galeria'}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Telefone</label>
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Data de Nascimento</label>
                    <input 
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Ministério / Célula</label>
                    <input 
                      type="text"
                      name="ministry"
                      value={formData.ministry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Ex: Louvor, Jovens..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Bio / Testemunho</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Redes Sociais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        name="social.instagram"
                        value={formData.socialLinks?.instagram}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="@usuario"
                      />
                    </div>
                    <div className="relative">
                      <Facebook size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        name="social.facebook"
                        value={formData.socialLinks?.facebook}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="facebook.com/..."
                      />
                    </div>
                    <div className="relative">
                      <MessageCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        name="social.whatsapp"
                        value={formData.socialLinks?.whatsapp}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="WhatsApp"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center gap-2 px-8"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Salvar Alterações
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {profile.bio && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sobre</h3>
                    <p className="text-slate-600 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Informações</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Phone size={16} />
                        </div>
                        <span>{profile.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Calendar size={16} />
                        </div>
                        <span>{profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Briefcase size={16} />
                        </div>
                        <span>{profile.ministry || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Redes Sociais</h3>
                    <div className="flex gap-3">
                      {profile.socialLinks?.instagram && (
                        <a href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center hover:scale-110 transition-transform">
                          <Instagram size={20} />
                        </a>
                      )}
                      {profile.socialLinks?.facebook && (
                        <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:scale-110 transition-transform">
                          <Facebook size={20} />
                        </a>
                      )}
                      {profile.socialLinks?.whatsapp && (
                        <a href={`https://wa.me/${profile.socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:scale-110 transition-transform">
                          <MessageCircle size={20} />
                        </a>
                      )}
                      {!profile.socialLinks?.instagram && !profile.socialLinks?.facebook && !profile.socialLinks?.whatsapp && (
                        <p className="text-slate-400 text-sm italic">Nenhuma rede social vinculada</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Messages */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
              message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
