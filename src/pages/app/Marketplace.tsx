import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Tag, 
  Trash2, 
  CheckCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarketplaceItem {
  id: string;
  churchId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  price?: number;
  category: string;
  imageUrl?: string;
  contactPhone?: string;
  status: 'active' | 'sold' | 'inactive';
  createdAt: any;
}

export default function AppMarketplace() {
  const { userProfile } = useOutletContext<{ userProfile: any }>();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Produtos',
    contactPhone: '',
    imageUrl: ''
  });

  const categories = ['Todos', 'Produtos', 'Serviços', 'Alimentos', 'Outros'];

  useEffect(() => {
    if (!userProfile?.churchId) return;

    const q = query(
      collection(db, 'marketplace_items'),
      where('churchId', '==', userProfile.churchId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceItem[];
      setItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.churchId]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !userProfile?.churchId) return;

    try {
      await addDoc(collection(db, 'marketplace_items'), {
        churchId: userProfile.churchId,
        authorId: auth.currentUser.uid,
        authorName: userProfile.displayName || 'Membro',
        title: newItem.title,
        description: newItem.description,
        price: newItem.price ? parseFloat(newItem.price) : null,
        category: newItem.category,
        contactPhone: newItem.contactPhone,
        imageUrl: newItem.imageUrl || `https://picsum.photos/seed/${newItem.title}/400/300`,
        status: 'active',
        createdAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setNewItem({
        title: '',
        description: '',
        price: '',
        category: 'Produtos',
        contactPhone: '',
        imageUrl: ''
      });
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleMarkAsSold = async (itemId: string) => {
    try {
      await updateDoc(doc(db, 'marketplace_items', itemId), {
        status: 'sold'
      });
    } catch (error) {
      console.error('Error marking as sold:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) return;
    try {
      await deleteDoc(doc(db, 'marketplace_items', itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
          <p className="text-slate-500 text-sm">Produtos e serviços da nossa comunidade</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Anúncio</span>
        </button>
      </header>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="O que você procura?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-video relative bg-slate-100">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 shadow-sm">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                  {item.price && (
                    <span className="text-emerald-600 font-bold">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                      {item.authorName.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-500">{item.authorName}</span>
                  </div>

                  {item.authorId === auth.currentUser?.uid ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkAsSold(item.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Marcar como vendido"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    item.contactPhone && (
                      <a
                        href={`https://wa.me/${item.contactPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Contato
                      </a>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-900 font-medium">Nenhum item encontrado</h3>
          <p className="text-slate-500 text-sm">Seja o primeiro a anunciar algo!</p>
        </div>
      )}

      {/* Create Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Anunciar Item</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                  <input
                    required
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="Ex: Violão Tagima semi-novo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      {categories.filter(c => c !== 'Todos').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <textarea
                    required
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-24 resize-none"
                    placeholder="Descreva o item ou serviço..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp (com DDD)</label>
                  <input
                    type="tel"
                    value={newItem.contactPhone}
                    onChange={(e) => setNewItem({ ...newItem, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="Ex: 11999999999"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Publicar Anúncio
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
