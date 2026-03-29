import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  increment,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { PrayerCampaign, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Calendar, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Toast } from './UIComponents';

interface PrayerCampaignsProps {
  churchId: string;
  userProfile: UserProfile;
}

export default function PrayerCampaigns({ churchId, userProfile }: PrayerCampaignsProps) {
  const [campaigns, setCampaigns] = useState<PrayerCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PrayerCampaign | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Campaign State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active' as 'active' | 'completed' | 'draft'
  });

  const isIntercessorAdmin = userProfile.role === 'admin' || userProfile.role === 'pastor' || userProfile.role === 'leader' || userProfile.tags?.includes('intercessor');

  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'prayer_campaigns'),
      where('churchId', '==', churchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const campaignsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrayerCampaign[];

      setCampaigns(campaignsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'prayer_campaigns');
      } catch (e) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [churchId]);

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.startDate || !formData.endDate) {
      setToast({ message: 'Preencha todos os campos obrigatórios.', type: 'error' });
      return;
    }

    try {
      if (editingCampaign) {
        const path = `prayer_campaigns/${editingCampaign.id}`;
        try {
          await updateDoc(doc(db, 'prayer_campaigns', editingCampaign.id), {
            title: formData.title,
            description: formData.description,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
        setToast({ message: 'Campanha atualizada!', type: 'success' });
      } else {
        const campaignData = {
          churchId,
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          createdBy: auth.currentUser?.uid,
          createdByName: userProfile.displayName || 'Líder',
          createdAt: serverTimestamp(),
          participantsCount: 0
        };

        const path = 'prayer_campaigns';
        try {
          await addDoc(collection(db, 'prayer_campaigns'), campaignData);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
        setToast({ message: 'Campanha criada com sucesso!', type: 'success' });
      }

      setFormData({ title: '', description: '', startDate: '', endDate: '', status: 'active' });
      setShowCreateModal(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error("Error saving campaign:", error);
      setToast({ message: 'Erro ao salvar campanha.', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta campanha?')) return;
    
    try {
      const path = `prayer_campaigns/${id}`;
      try {
        await deleteDoc(doc(db, 'prayer_campaigns', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      setToast({ message: 'Campanha excluída.', type: 'success' });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      setToast({ message: 'Erro ao excluir.', type: 'error' });
    }
  };

  const handleParticipate = async (campaignId: string) => {
    try {
      const participationId = `${auth.currentUser?.uid}_${campaignId}`;
      const participationRef = doc(db, 'prayer_campaigns', campaignId, 'participants', participationId);
      
      const participationPath = `prayer_campaigns/${campaignId}/participants/${participationId}`;
      try {
        await setDoc(participationRef, {
          id: participationId,
          campaignId: campaignId,
          userId: auth.currentUser?.uid,
          userName: userProfile.displayName || 'Membro',
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, participationPath);
      }

      const campaignPath = `prayer_campaigns/${campaignId}`;
      try {
        await updateDoc(doc(db, 'prayer_campaigns', campaignId), {
          participantsCount: increment(1)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, campaignPath);
      }

      setToast({ message: 'Você entrou na campanha de oração!', type: 'success' });
    } catch (error) {
      console.error("Error participating:", error);
      setToast({ message: 'Erro ao entrar na campanha.', type: 'error' });
    }
  };

  const openEditModal = (campaign: PrayerCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <Target className="h-6 w-6 text-primary" />
            Campanhas e Propósitos
          </h2>
          <p className="text-sm text-slate-500">Junte-se aos propósitos de oração da igreja.</p>
        </div>
        
        {isIntercessorAdmin && (
          <button 
            onClick={() => {
              setEditingCampaign(null);
              setFormData({ title: '', description: '', startDate: '', endDate: '', status: 'active' });
              setShowCreateModal(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 sm:w-auto"
          >
            <Plus size={20} />
            Nova Campanha
          </button>
        )}
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="glass-card h-48 animate-pulse p-6" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card py-12 text-center">
          <Target className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 text-xl font-bold text-slate-900">Nenhuma campanha ativa</h3>
          <p className="text-slate-500">No momento não há campanhas de oração em andamento.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <AnimatePresence>
            {campaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card relative flex flex-col overflow-hidden p-4 sm:p-6"
              >
                {/* Status Badge */}
                <div className={`absolute right-0 top-0 rounded-bl-xl px-4 py-1 text-xs font-bold text-white ${
                  campaign.status === 'active' ? 'bg-emerald-500' : 
                  campaign.status === 'completed' ? 'bg-slate-500' : 'bg-amber-500'
                }`}>
                  {campaign.status === 'active' ? 'Em Andamento' : 
                   campaign.status === 'completed' ? 'Concluída' : 'Rascunho'}
                </div>

                <div className="mb-4 mt-2 flex items-start justify-between">
                  <h3 className="pr-24 text-lg font-bold text-slate-900 sm:text-xl">{campaign.title}</h3>
                </div>
                
                <p className="mb-6 flex-1 text-sm text-slate-600 sm:text-base">{campaign.description}</p>
                
                <div className="mb-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>{campaign.participantsCount} intercessores participando</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  {campaign.status === 'active' ? (
                    <button
                      onClick={() => handleParticipate(campaign.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <CheckCircle2 size={18} />
                      Participar
                    </button>
                  ) : (
                    <div className="flex-1 py-2 text-center font-medium text-slate-400">
                      Campanha Encerrada
                    </div>
                  )}

                  {isIntercessorAdmin && (
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(campaign)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <BaseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
        }}
        title={editingCampaign ? "Editar Campanha" : "Nova Campanha de Oração"}
      >
        <form onSubmit={handleSaveCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título da Campanha</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="Ex: 21 Dias de Jejum e Oração"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição e Propósito</label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
              placeholder="Descreva o motivo da campanha, os alvos de oração e instruções..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Término</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            >
              <option value="active">Ativa (Em andamento)</option>
              <option value="draft">Rascunho (Não visível para membros)</option>
              <option value="completed">Concluída</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCampaign(null);
              }}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
            >
              {editingCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </BaseModal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
