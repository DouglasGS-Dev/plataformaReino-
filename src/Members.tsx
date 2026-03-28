import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, User as UserIcon, Mail, Phone as PhoneIcon, ShieldCheck, Users, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './types';
import { useOutletContext } from 'react-router-dom';
import { MemberModal } from './components/AdminModals';
import { motion, AnimatePresence } from 'motion/react';

export default function Members() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!churchId) return;

    const q = query(collection(db, 'users'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfile));
      setMembers(membersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      setActiveMenuId(null);
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMembers = members.filter(member => 
    member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'pastor':
      case 'admin':
        return 'bg-primary-50 text-primary border-primary/20';
      case 'leader':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pastor': return 'Pastor';
      case 'admin': return 'Admin';
      case 'leader': return 'Líder';
      case 'user': return 'Membro';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Membros</h2>
          <p className="text-slate-500 mt-1">Gerencie os membros, líderes e visitantes da igreja.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 primary-gradient text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Convidar Membro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou telefone..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{filteredMembers.length}</span> membros encontrados
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-slate-500 text-sm">Carregando membros...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-medium">Membro</th>
                  <th className="px-6 py-4 font-medium">Contato</th>
                  <th className="px-6 py-4 font-medium">Cargo/Papel</th>
                  <th className="px-6 py-4 font-medium">Data de Cadastro</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.uid} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                            <UserIcon size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{member.displayName || 'Sem nome'}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={12} />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 flex items-center gap-1">
                        <PhoneIcon size={14} className="text-slate-400" />
                        {member.phone || 'Não informado'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                        {(member.role === 'pastor' || member.role === 'admin' || member.role === 'leader') && <ShieldCheck size={12} />}
                        <span>{getRoleLabel(member.role)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {member.createdAt?.toDate ? member.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === member.uid ? null : member.uid)}
                        className="text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-white"
                      >
                        {updatingId === member.uid ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <MoreVertical className="w-5 h-5" />
                        )}
                      </button>

                      <AnimatePresence>
                        {activeMenuId === member.uid && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenuId(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden"
                            >
                              <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 bg-slate-50/50">
                                Alterar Papel
                              </div>
                              <div className="p-1">
                                {[
                                  { id: 'user', label: 'Membro' },
                                  { id: 'leader', label: 'Líder' },
                                  { id: 'pastor', label: 'Pastor' },
                                  { id: 'admin', label: 'Admin' }
                                ].map((role) => (
                                  <button
                                    key={role.id}
                                    onClick={() => handleUpdateRole(member.uid, role.id as UserProfile['role'])}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                      member.role === role.id 
                                        ? 'bg-primary-50 text-primary font-medium' 
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {role.label}
                                    {member.role === role.id && <ShieldCheck size={14} />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Nenhum membro encontrado</h3>
              <p className="text-slate-500 mt-1">Tente ajustar sua busca ou convide novos membros.</p>
            </div>
          )}
        </div>
      </div>

      <MemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        churchId={churchId} 
        onSuccess={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
