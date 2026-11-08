import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { Church, Sparkles } from 'lucide-react';
import CommunityFeed from '../../components/CommunityFeed';
import JoinChurchModal from '../../components/JoinChurchModal';
import { UserProfile } from '../../types';

export default function Feed() {
  const { userProfile } = useOutletContext<{ userProfile: UserProfile | null }>();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  if (!userProfile?.churchId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-primary-50 text-primary rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-primary-100">
          <Church className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Conecte-se a uma Igreja</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
          Para interagir no mural, compartilhar orações, testemunhos e novidades, você precisa estar vinculado a uma congregação no REINO.
        </p>

        <button
          onClick={() => setIsJoinModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles size={18} />
          Conectar-se ou Criar Igreja
        </button>

        <JoinChurchModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl mx-auto"
    >
      <CommunityFeed churchId={userProfile.churchId} userRole={userProfile.role} />
    </motion.div>
  );
}

