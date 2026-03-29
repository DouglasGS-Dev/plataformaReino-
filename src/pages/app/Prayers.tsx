import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import PrayerWall from '../../components/PrayerWall';
import PrayerCampaigns from '../../components/PrayerCampaigns';
import { UserProfile } from '../../types';
import { MessageCircle, Target } from 'lucide-react';

export default function Prayers() {
  const { userProfile } = useOutletContext<{ userProfile: UserProfile | null }>();
  const [activeTab, setActiveTab] = useState<'wall' | 'campaigns'>('wall');

  if (!userProfile?.churchId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary-50 text-primary rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Conecte-se a uma Igreja</h2>
        <p className="text-slate-500 max-w-sm mb-8">
          Para acessar o mural de oração, você precisa estar vinculado a uma igreja.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Tabs */}
      <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setActiveTab('wall')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'wall'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <MessageCircle size={18} />
          Mural
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'campaigns'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Target size={18} />
          Campanhas
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'wall' ? (
          <PrayerWall churchId={userProfile.churchId} userProfile={userProfile} />
        ) : (
          <PrayerCampaigns churchId={userProfile.churchId} userProfile={userProfile} />
        )}
      </div>
    </motion.div>
  );
}
