import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Heart, Share2, Send, User, Sparkles, Shield, Megaphone, PenTool, Trash2, Image as ImageIcon, Video, X, ChevronLeft, ChevronRight, Maximize2, BookOpen, Play, Pause, Volume2, VolumeX, Clock, Crop, Scissors, Check, CheckCircle2, Layout } from 'lucide-react';
import { db, auth, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Post, PostMedia, Comment } from '../types';
import { compressImage, formatFileSize } from '../utils/media';
import { MediaCarousel } from './MediaCarousel';

import { ConfirmModal, Toast } from './UIComponents';

interface Props {
  churchId: string;
  userRole?: string;
}

const PostComments = ({ postId, userRole, onDeleteComment }: { postId: string, userRole?: string, onDeleteComment: (postId: string, commentId: string) => Promise<void> }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments: Comment[] = [];
      snapshot.forEach((doc) => {
        fetchedComments.push(doc.data() as Comment);
      });
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `posts/${postId}/comments`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 group">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shrink-0">
            {comment.authorPhoto ? (
              <img 
                src={comment.authorPhoto} 
                alt={comment.authorName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                loading="lazy"
              />
            ) : (
              <User className="text-[var(--color-text-tertiary)]" size={16} />
            )}
          </div>
          <div className="flex-1">
            <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-2 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">{comment.authorName}</span>
                  {comment.authorRole && (comment.authorRole === 'pastor' || comment.authorRole === 'admin' || comment.authorRole === 'leader') && (
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border ${
                      comment.authorRole === 'pastor' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      comment.authorRole === 'admin' ? 'bg-primary-50 text-primary border-primary-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {comment.authorRole === 'pastor' ? 'Pastor' : 
                       comment.authorRole === 'admin' ? 'Admin' : 'Líder'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Agora'}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
          {(auth.currentUser?.uid === comment.authorId || userRole === 'admin' || userRole === 'pastor') && (
            <button 
              onClick={() => onDeleteComment(postId, comment.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-text-tertiary)] hover:text-rose-500 transition-all self-center"
              title="Excluir comentário"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      {comments.length === 0 && (
        <p className="text-center text-xs text-[var(--color-text-tertiary)] py-2">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      )}
    </div>
  );
};

const SkeletonPost = () => (
  <div className="glass-card p-5 md:p-6 rounded-3xl bg-white shadow-sm border border-[var(--color-border)] animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
        <div>
          <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
    </div>
    <div className="space-y-2 mb-6">
      <div className="h-4 w-full bg-slate-200 rounded"></div>
      <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
      <div className="h-4 w-4/6 bg-slate-200 rounded"></div>
    </div>
    <div className="flex items-center gap-6 pt-4 border-t border-[var(--color-border)]">
      <div className="h-4 w-16 bg-slate-200 rounded"></div>
      <div className="h-4 w-20 bg-slate-200 rounded"></div>
    </div>
  </div>
);


/*
const CustomAudioPlayer = ({ 
  id, 
  url, 
  title, 
  playingAudioId, 
  onPlay 
}: { 
  id: string, 
  url: string, 
  title: string,
  playingAudioId: string | null,
  onPlay: (id: string | null) => void
}) => {
  // ...
};
*/

/* const PostMusicPlayer = ({
  id,
  music,
  playingAudioId,
  onPlay
}: {
  id: string;
  music: Post['music'];
  playingAudioId: string | null;
  onPlay: (id: string | null) => void;
}) => {
  if (!music) return null;
  
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const isCurrentlyPlaying = playingAudioId === id;
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = music.endTime - music.startTime;

  useEffect(() => {
    if (audioRef.current) {
      if (isCurrentlyPlaying) {
        audioRef.current.currentTime = music.startTime;
        audioRef.current.play().catch(() => onPlay(null));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isCurrentlyPlaying, music.startTime]);

  const togglePlay = () => {
    if (isCurrentlyPlaying) {
      onPlay(null);
    } else {
      onPlay(id);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      let current = audioRef.current.currentTime;
      
      if (current >= music.endTime) {
        audioRef.current.pause();
        audioRef.current.currentTime = music.startTime;
        onPlay(null);
        setProgress(0);
        setCurrentTime(0);
        return;
      }
      
      const relativeTime = current - music.startTime;
      setCurrentTime(Math.max(0, relativeTime));
      setProgress(Math.max(0, Math.min(100, (relativeTime / duration) * 100)));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (music.displayStyle === 'sticker') {
    return (
      <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-sm inline-flex items-center gap-3 w-auto">
        <audio 
          ref={audioRef}
          src={music.audioUrl}
          onTimeUpdate={onTimeUpdate}
        />
        <button 
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors shrink-0"
        >
          {isCurrentlyPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
        </button>
        <div className="flex flex-col pr-2">
          <span className="text-xs font-bold text-slate-800 line-clamp-1">{music.title}</span>
          <span className="text-[10px] text-slate-500 line-clamp-1">{music.artist}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-sm group transition-all hover:shadow-md">
      <audio 
        ref={audioRef}
        src={music.audioUrl}
        onTimeUpdate={onTimeUpdate}
      />
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative group-hover:shadow-md transition-all">
          <img src={music.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          <button 
            onClick={togglePlay}
            className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-sm">
              {isCurrentlyPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
            </div>
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 truncate text-sm leading-tight">{music.title}</span>
              <span className="text-xs text-slate-500 truncate">{music.artist}</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; */

export default function CommunityFeed({ churchId, userRole }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'prayer' | 'testimony' | 'announcement'>('prayer');
  const [bibleVerse, setBibleVerse] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<PostMedia[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showRecoveryToast, setShowRecoveryToast] = useState(false);
  const [compressingCount, setCompressingCount] = useState(0);
  const isCompressing = compressingCount > 0;
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  useEffect(() => {
    if (sessionStorage.getItem('isTrimming') === 'true') {
      setShowRecoveryToast(true);
      sessionStorage.removeItem('isTrimming');
    }
  }, []);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<{ media: PostMedia[], index: number } | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ postId: string, commentId: string } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, index?: number) => {
    const fileId = `media_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log('Iniciando uploadFile:', { 
      fileId,
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      churchId,
      userId: auth.currentUser?.uid 
    });

    if (!churchId) {
      const errorMsg = "Erro: ID da igreja não encontrado.";
      console.error(errorMsg);
      setMediaError(errorMsg);
      return;
    }

    if (!auth.currentUser) {
      const errorMsg = "Erro: Usuário não autenticado.";
      console.error(errorMsg);
      setMediaError(errorMsg);
      return;
    }

    const type = file.type.startsWith('video') ? 'video' : 'image';
    let fileToUpload: File | Blob = file;
    let base64Fallback: string | null = null;

    try {
      // Processamento inicial (compressão para imagens)
      if (type === 'image') {
        setCompressingCount(prev => prev + 1);
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
          reader.readAsDataURL(file);
          const base64Str = await base64Promise;
          
          console.log('Comprimindo imagem...');
          const compressedBase64 = await compressImage(base64Str);
          base64Fallback = compressedBase64; 
          
          // Se a imagem for pequena o suficiente, usamos Base64 direto para evitar problemas de rede
          if (compressedBase64.length < 500 * 1024) {
             console.log('Imagem pequena, usando Base64 direto para maior velocidade');
             const mediaItem: PostMedia = {
               url: compressedBase64,
               type: 'image',
               objectFit: 'cover',
               id: fileId,
               name: file.name,
               size: file.size
             };
             setSelectedMedia(prev => [...prev, mediaItem]);
             setCompressingCount(prev => Math.max(0, prev - 1));
             return; // Finaliza aqui, não precisa de Storage
          }

          const byteString = atob(compressedBase64.split(',')[1]);
          const mimeString = compressedBase64.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          fileToUpload = new Blob([ab], { type: mimeString });
        } catch (err) {
          console.warn('Falha na compressão, usando arquivo original:', err);
        } finally {
          setCompressingCount(prev => Math.max(0, prev - 1));
        }
      }

      // Tentar upload para o Firebase Storage
      console.log('Tentando upload para Storage no bucket:', storage.app.options.storageBucket);
      const storagePath = `churches/${churchId}/posts/${fileId}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        // Timeout diferenciado: 30s para fotos (fallback), 5min para vídeos
        const timeoutDuration = type === 'image' ? 30000 : 300000;
        
        const timeoutId = setTimeout(() => {
          if (type === 'image' && base64Fallback) {
            console.log('Timeout no Storage, usando fallback Base64');
            uploadTask.cancel();
            resolve(base64Fallback);
          } else {
            uploadTask.cancel();
            reject(new Error('O upload está demorando mais que o esperado. Verifique sua conexão ou tente um arquivo menor.'));
          }
        }, timeoutDuration);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Progresso do upload (${fileId}): ${progress}%`);
            setUploadProgress(prev => ({ ...prev, [fileId]: Math.round(progress) }));
          }, 
          (error) => {
            clearTimeout(timeoutId);
            console.error('Erro detalhado no Storage:', error.code, error.message);
            if (type === 'image' && base64Fallback) {
              console.log('Erro no Storage, usando fallback Base64');
              resolve(base64Fallback);
            } else {
              let msg = 'Erro no upload: ';
              if (error.code === 'storage/unauthorized') msg += 'Sem permissão no Firebase Storage.';
              else if (error.code === 'storage/retry-limit-exceeded') msg += 'Falha na conexão com o servidor de arquivos.';
              else if (error.code === 'storage/unknown') msg += 'O serviço de arquivos (Storage) pode não estar ativado no Firebase.';
              else msg += error.message;
              reject(new Error(msg));
            }
          }, 
          async () => {
            clearTimeout(timeoutId);
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (err) {
              if (type === 'image' && base64Fallback) resolve(base64Fallback);
              else reject(err);
            }
          }
        );
      });

      const mediaItem: PostMedia = {
        url: downloadUrl,
        type,
        objectFit: 'cover',
        id: fileId,
        name: file.name,
        size: fileToUpload.size
      };

      setSelectedMedia(prev => {
        if (typeof index === 'number') {
          const next = [...prev];
          next[index] = mediaItem;
          return next;
        }
        return [...prev, mediaItem];
      });

      console.log('Upload concluído com sucesso:', downloadUrl);

    } catch (error: any) {
      console.error('Erro no uploadFile:', error);
      
      // Fallback para Base64 se for imagem e o erro for de permissão ou rede
      if (type === 'image' && base64Fallback && base64Fallback.length < 800 * 1024) {
        console.log('Usando fallback Base64 para imagem devido a erro no Storage');
        const mediaItem: PostMedia = {
          url: base64Fallback,
          type: 'image',
          objectFit: 'cover',
          id: fileId,
          name: file.name,
          size: file.size
        };

        setSelectedMedia(prev => {
          if (typeof index === 'number') {
            const next = [...prev];
            next[index] = mediaItem;
            return next;
          }
          return [...prev, mediaItem];
        });
        setMediaError(null); // Limpar erro pois o fallback funcionou
        return;
      }

      let message = 'Erro ao carregar arquivo.';
      if (error.code === 'storage/unauthorized') {
        message = 'Sem permissão para upload. Verifique as configurações do Firebase Storage.';
      } else if (error.code === 'storage/canceled') {
        message = 'Upload cancelado.';
      } else if (error.message?.includes('Tempo limite')) {
        message = error.message;
      }
      
      setMediaError(message);
      throw error;
    } finally {
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!churchId) {
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);
    const q = query(
      collection(db, 'posts'),
      where('churchId', '==', churchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: Post[] = [];
      snapshot.forEach((doc) => {
        fetchedPosts.push(doc.data() as Post);
      });
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  const handlePost = async () => {
    if (!newPost.trim() || !auth.currentUser) return;
    if (!churchId) {
      setMediaError("Erro: ID da igreja não encontrado. Tente recarregar a página.");
      return;
    }
    setLoading(true);

    try {
      if (editingPost) {
        await setDoc(doc(db, 'posts', editingPost.id), {
          content: newPost,
          type: postType,
          bibleVerse: bibleVerse || null,
          media: selectedMedia.length > 0 ? selectedMedia : null,
          aspectRatio: selectedMedia.length > 0 ? aspectRatio : null,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setEditingPost(null);
        showSuccess('Publicação atualizada com sucesso!');
      } else {
        const postId = `post_${Date.now()}`;
        const post = {
          id: postId,
          churchId,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Membro',
          authorPhoto: auth.currentUser.photoURL || '',
          content: newPost,
          type: postType,
          likesCount: 0,
          commentsCount: 0,
          createdAt: serverTimestamp(),
          bibleVerse: bibleVerse || null,
          media: selectedMedia.length > 0 ? selectedMedia : null,
          aspectRatio: selectedMedia.length > 0 ? aspectRatio : null
        };

        await setDoc(doc(db, 'posts', postId), post);
        showToast('Publicação compartilhada com sucesso!');
      }
      setNewPost('');
      setBibleVerse('');
      setSelectedMedia([]);
      setAspectRatio('16:9');
      setPostType('prayer');
    } catch (error) {
      handleFirestoreError(error, editingPost ? OperationType.UPDATE : OperationType.CREATE, editingPost ? `posts/${editingPost.id}` : 'posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      const post = posts.find(p => p.id === postToDelete);
      if (post?.media) {
        for (const media of post.media) {
          if (media.id) {
            const storagePath = `churches/${churchId}/posts/${media.id}`;
            const storageRef = ref(storage, storagePath);
            try {
              await deleteObject(storageRef);
            } catch (err) {
              console.error('Error deleting file from storage:', err);
            }
          }
        }
      }
      await deleteDoc(doc(db, 'posts', postToDelete));
      setPostToDelete(null);
      showToast('Publicação excluída com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postToDelete}`);
      showToast('Erro ao excluir publicação.', 'error');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('handleFileSelect disparado. Arquivos selecionados:', files?.length || 0);
    
    if (!auth.currentUser) {
      console.error('Usuário não autenticado no handleFileSelect');
      setMediaError("Você precisa estar logado para enviar arquivos. Tente recarregar a página.");
      return;
    }

    if (!files || files.length === 0) return;
    setMediaError(null);

    try {
      if (!churchId) {
        throw new Error('ID da igreja não encontrado. Por favor, recarregue a página.');
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 100 * 1024 * 1024) {
          setMediaError(`O arquivo "${file.name}" é muito grande. O limite é de 100MB.`);
          return;
        }
        await uploadFile(file);
      });

      await Promise.all(uploadPromises);
    } catch (err: any) {
      console.error('Erro global no handleFileSelect:', err);
      setMediaError(err.message || 'Erro ao processar mídia. Tente novamente.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (addMoreInputRef.current) addMoreInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const toggleObjectFit = (index: number) => {
    setSelectedMedia(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        objectFit: next[index].objectFit === 'contain' ? 'cover' : 'contain'
      };
      return next;
    });
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !auth.currentUser || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    const commentId = `comment_${Date.now()}`;
    const comment: Comment = {
      id: commentId,
      postId,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Membro',
      authorPhoto: auth.currentUser.photoURL || '',
      authorRole: userRole,
      content: newComment,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'posts', postId, 'comments', commentId), comment);
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(-1)
      });
      showToast('Comentário excluído.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
      showToast('Erro ao excluir comentário.', 'error');
    }
  };

  const handleLike = async (postId: string) => {
    if (likedPosts.has(postId)) return;

    setLikedPosts(prev => new Set(prev).add(postId));

    try {
      await updateDoc(doc(db, 'posts', postId), {
        likesCount: increment(1)
      });
    } catch (error) {
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const handleShare = async (post: Post) => {
    const shareData = {
      title: 'Diário Espiritual',
      text: `${post.authorName} compartilhou: ${post.content}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('Link copiado para a área de transferência!');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'prayer':
        return { icon: Shield, label: 'Pedido de Oração', color: 'text-primary', bg: 'bg-primary-50', border: 'border-primary-200' };
      case 'testimony':
        return { icon: Sparkles, label: 'Testemunho', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'announcement':
        return { icon: Megaphone, label: 'Aviso', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      default:
        return { icon: MessageCircle, label: 'Post', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[200]"
          >
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Sucesso!</p>
                <p className="text-xs opacity-90">{successToast}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery Toast */}
      <AnimatePresence>
        {showRecoveryToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[200]"
          >
            <div className="bg-amber-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Sessão Recuperada</p>
                  <p className="text-xs opacity-90">O app reiniciou para liberar memória. Tente selecionar o áudio novamente.</p>
                </div>
              </div>
              <button onClick={() => setShowRecoveryToast(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-5 md:p-6 rounded-3xl bg-white shadow-sm border transition-all ${editingPost ? 'border-primary ring-2 ring-primary-50' : 'border-[var(--color-border)]'}`}
      >
        {editingPost && (
          <div className="flex items-center gap-2 mb-4 text-primary font-semibold text-sm bg-primary-50 px-3 py-1.5 rounded-full w-fit">
            <PenTool size={14} /> Editando sua publicação
          </div>
        )}
        <div className="flex gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
            {auth.currentUser?.photoURL ? (
              <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="text-primary" size={24} />
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Compartilhe algo com sua comunidade..."
              className="w-full bg-transparent border-none outline-none text-[var(--color-text-primary)] resize-none min-h-[80px] text-lg placeholder:text-[var(--color-text-tertiary)] mt-2"
            />
            
            <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200">
              <BookOpen size={16} className="text-slate-400" />
              <input 
                type="text"
                placeholder="Vincular um versículo (ex: João 3:16)..."
                className="bg-transparent border-none outline-none text-sm w-full text-[var(--color-text-primary)]"
                value={bibleVerse}
                onChange={(e) => setBibleVerse(e.target.value)}
              />
            </div>

            {selectedMedia.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {selectedMedia.map((media, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={index} 
                    className="relative aspect-square rounded-2xl overflow-hidden shrink-0 group shadow-sm border border-slate-200"
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} alt="Preview" className={`w-full h-full ${media.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                    ) : (
                      <video src={media.url} className={`w-full h-full ${media.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                    )}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                    
                    {/* Control Bar - Always Visible for better discoverability */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-2 flex items-center justify-between border-t border-white/10">
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => toggleObjectFit(index)}
                          className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5 px-2"
                          title={media.objectFit === 'contain' ? "Preencher Quadro" : "Ajustar ao Quadro"}
                        >
                          <Crop size={14} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {media.objectFit === 'contain' ? "Ajustar" : "Preencher"}
                          </span>
                        </button>
                      </div>
                      
                      <div className="flex gap-1">
                        <label className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer" title="Substituir">
                          <PenTool size={14} />
                          <input 
                            ref={replaceInputRef}
                            type="file" 
                            accept="image/*,video/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file && auth.currentUser) {
                                setMediaError(null);
                                try {
                                  if (file.size > 100 * 1024 * 1024) {
                                    setMediaError(`O arquivo "${file.name}" é muito grande. O limite é de 100MB.`);
                                    return;
                                  }
                                  await uploadFile(file, index);
                                } catch (err: any) {
                                  console.error('Error replacing media:', err);
                                  setMediaError(err.message || 'Erro ao substituir mídia.');
                                } finally {
                                  if (replaceInputRef.current) replaceInputRef.current.value = '';
                                }
                              }
                            }} 
                          />
                        </label>
                        <button 
                          onClick={() => removeMedia(index)}
                          className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[8px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10 pointer-events-none">
                      {media.objectFit === 'contain' ? "Ajustado" : "Preenchido"}
                    </div>
                  </motion.div>
                ))}
                <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary-200 hover:text-primary hover:bg-primary-50 transition-all cursor-pointer">
                  <ImageIcon size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar</span>
                  <input 
                    ref={addMoreInputRef}
                    type="file" 
                    accept="image/*,video/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileSelect} 
                  />
                </label>
              </div>
            )}

            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(uploadProgress).map(([id, progress]) => (
                  <div key={id} className="bg-primary-50 p-3 rounded-2xl border border-primary-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Enviando mídia...</span>
                      <span className="text-[10px] font-bold text-primary animate-pulse">Aguarde</span>
                    </div>
                    <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="absolute top-0 bottom-0 left-0 bg-primary rounded-full h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isCompressing && Object.keys(uploadProgress).length === 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 text-primary rounded-2xl border border-primary-100 animate-pulse">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Otimizando mídia...</span>
              </div>
            )}

            {selectedMedia.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Formato do Quadro</div>
                {(['1:1', '4:5', '16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      aspectRatio === ratio 
                        ? 'primary-gradient text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ratio === '1:1' && '1:1 (Quadrado)'}
                    {ratio === '4:5' && '4:5 (Retrato)'}
                    {ratio === '16:9' && '16:9 (Vídeo)'}
                    {ratio === '9:16' && '9:16 (Stories)'}
                  </button>
                ))}
              </div>
            )}
            
            {mediaError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 flex items-center justify-between border border-red-100"
              >
                <span>{mediaError}</span>
                <button onClick={() => setMediaError(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-[var(--color-border)] gap-4 sm:gap-0">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-all">
              <ImageIcon size={16} />
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*,video/*" 
                multiple 
                className="hidden" 
                onChange={handleFileSelect} 
              />
              Mídia
            </label>
            {(['prayer', 'testimony', 'announcement'] as const).filter(type => type !== 'announcement' || userRole === 'admin' || userRole === 'leader').map(type => {
              const config = getTypeConfig(type);
              const Icon = config.icon;
              const isActive = postType === type;
              return (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive 
                      ? `${config.bg} ${config.color} border ${config.border} shadow-sm scale-105` 
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} className={isActive ? config.color : 'text-[var(--color-text-tertiary)]'} />
                  {config.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingPost && (
              <button
                onClick={() => {
                  setEditingPost(null);
                  setNewPost('');
                  setPostType('prayer');
                  setBibleVerse('');
                  setSelectedMedia([]);
                  setAspectRatio('16:9');
                }}
                className="btn-secondary px-6 py-2.5 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handlePost}
              disabled={!newPost.trim() || loading}
              className="btn-primary px-6 py-2.5 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-md"
            >
              <Send size={16} /> {editingPost ? 'Salvar' : 'Publicar'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Feed */}
      <div className="space-y-6">
        <AnimatePresence>
          {loadingPosts ? (
            <>
              <SkeletonPost />
              <SkeletonPost />
              <SkeletonPost />
            </>
          ) : (
            posts.map(post => {
              const config = getTypeConfig(post.type);
              const TypeIcon = config.icon;
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 md:p-6 rounded-3xl bg-white shadow-sm border border-[var(--color-border)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        {post.authorPhoto ? (
                          <img 
                            src={post.authorPhoto} 
                            alt={post.authorName} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            loading="lazy"
                          />
                        ) : (
                          <User className="text-[var(--color-text-tertiary)]" size={24} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)] text-base">{post.authorName}</h4>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.color} ${config.border}`}>
                        <TypeIcon size={14} />
                        {config.label}
                      </div>
                      {(post.authorId === auth.currentUser?.uid || userRole === 'admin') && (
                        <div className="flex items-center gap-1 ml-2">
                          {post.authorId === auth.currentUser?.uid && (
                            <button 
                              onClick={() => {
                                setEditingPost(post);
                                setNewPost(post.content);
                                setPostType(post.type as any);
                                setBibleVerse(post.bibleVerse || '');
                                setSelectedMedia(post.media || []);
                                setAspectRatio(post.aspectRatio || '16:9');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-1.5 text-[var(--color-text-tertiary)] hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                              title="Editar post"
                            >
                              <PenTool size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => setPostToDelete(post.id)}
                            className="p-1.5 text-[var(--color-text-tertiary)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir post"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4 whitespace-pre-wrap text-[15px]">
                    {post.content}
                  </p>

                  {post.bibleVerse && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-2xl border-l-4 border-primary italic text-sm text-[var(--color-text-secondary)] flex items-start gap-3">
                      <BookOpen size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>{post.bibleVerse}</div>
                    </div>
                  )}

                  {post.media && post.media.length > 0 && (
                    <MediaCarousel 
                      media={post.media} 
                      aspectRatio={post.aspectRatio}
                      onExpand={(index) => setExpandedMedia({ media: post.media!, index })} 
                    />
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-[var(--color-border)]">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 font-medium text-sm transition-colors ${
                        likedPosts.has(post.id) ? 'text-rose-500' : 'text-[var(--color-text-tertiary)] hover:text-rose-500'
                      }`}
                    >
                      <motion.div
                        animate={likedPosts.has(post.id) ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart size={18} className={likedPosts.has(post.id) ? "fill-rose-500" : ""} /> 
                      </motion.div>
                      <span>{post.likesCount || 0} Amém</span>
                    </motion.button>
                    
                    <button 
                      onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                      className={`flex items-center gap-2 transition-colors font-medium text-sm ${
                        commentingOn === post.id ? 'text-primary' : 'text-[var(--color-text-tertiary)] hover:text-primary'
                      }`}
                    >
                      <MessageCircle size={18} className={commentingOn === post.id ? "fill-primary-100" : ""} /> 
                      <span>{post.commentsCount || 0} Comentar</span>
                    </button>

                    <button 
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-2 transition-colors font-medium text-sm text-[var(--color-text-tertiary)] hover:text-green-500 ml-auto"
                    >
                      <Share2 size={18} /> 
                      <span>Compartilhar</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {commentingOn === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Comentários</h5>
                            <button 
                              onClick={() => setCommentingOn(null)}
                              className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <PostComments 
                            postId={post.id} 
                            userRole={userRole} 
                            onDeleteComment={(postId, commentId) => {
                              setCommentToDelete({ postId, commentId });
                              return Promise.resolve();
                            }} 
                          />
                          
                          <div className="flex gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shrink-0">
                              {auth.currentUser?.photoURL ? (
                                <img 
                                  src={auth.currentUser.photoURL} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer" 
                                  loading="lazy"
                                />
                              ) : (
                                <User className="text-[var(--color-text-tertiary)]" size={16} />
                              )}
                            </div>
                            <div className="flex-1 flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-4 py-1 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all shadow-inner">
                              <input
                                type="text"
                                placeholder="Escreva um comentário..."
                                className="w-full bg-transparent border-none outline-none text-sm py-2 text-[var(--color-text-primary)] disabled:opacity-50"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={isSubmittingComment}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newComment.trim() && !isSubmittingComment) {
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                              <button 
                                className="text-primary hover:text-primary/80 disabled:opacity-50 p-1 transition-colors"
                                disabled={!newComment.trim() || isSubmittingComment}
                                onClick={() => handleAddComment(post.id)}
                              >
                                {isSubmittingComment ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Send size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        
        {!loadingPosts && posts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-[var(--color-text-tertiary)] font-medium bg-white/50 rounded-3xl border border-dashed border-[var(--color-border)]"
          >
            <div className="w-16 h-16 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
              <MessageCircle size={24} className="text-primary-200" />
            </div>
            Nenhuma publicação ainda.<br/>Seja o primeiro a compartilhar!
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {expandedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
            onClick={() => setExpandedMedia(null)}
          >
            <button 
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[110]"
              onClick={() => setExpandedMedia(null)}
            >
              <X size={24} />
            </button>

            <div className="w-full h-full flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
              {/* Progress Bar for Full Screen */}
              <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 z-[120] px-4 pt-4">
                {expandedMedia.media.map((_, i) => (
                  <div key={i} className="flex-1 h-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={false}
                      animate={{ 
                        width: i === expandedMedia.index ? '100%' : i < expandedMedia.index ? '100%' : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={expandedMedia.index}
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {expandedMedia.media[expandedMedia.index].type === 'image' ? (
                    <img 
                      src={expandedMedia.media[expandedMedia.index].url} 
                      alt="Full screen" 
                      className="max-w-full max-h-full object-contain shadow-2xl select-none"
                    />
                  ) : (
                    <video 
                      src={expandedMedia.media[expandedMedia.index].url} 
                      className="max-w-full max-h-full object-contain"
                      controls
                      autoPlay
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {expandedMedia.media.length > 1 && (
                <>
                  <button 
                    onClick={() => setExpandedMedia(prev => prev ? { ...prev, index: (prev.index - 1 + prev.media.length) % prev.media.length } : null)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors z-[120] backdrop-blur-sm border border-white/10"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button 
                    onClick={() => setExpandedMedia(prev => prev ? { ...prev, index: (prev.index + 1) % prev.media.length } : null)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors z-[120] backdrop-blur-sm border border-white/10"
                  >
                    <ChevronRight size={32} />
                  </button>
                  
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-[120]">
                    {expandedMedia.media.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setExpandedMedia(prev => prev ? { ...prev, index: i } : null)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === expandedMedia.index ? 'bg-white w-8' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir publicação?"
        message="Esta ação não pode ser desfeita. O post será removido permanentemente."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete) {
            handleDeleteComment(commentToDelete.postId, commentToDelete.commentId);
          }
        }}
        title="Excluir comentário?"
        message="Tem certeza que deseja remover este comentário?"
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

