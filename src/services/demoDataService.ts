import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const generateDemoData = async (churchId: string) => {
  const batch = writeBatch(db);

  try {
    // 1. Generate Demo Members (Users)
    const demoUsers = [
      { name: 'Ricardo Oliveira', role: 'pastor', email: 'ricardo@demo.com', status: 'active', tags: ['Liderança', 'Pregador'] },
      { name: 'Ana Paula Santos', role: 'leader', email: 'ana@demo.com', status: 'active', tags: ['Louvor', 'Mulheres'] },
      { name: 'Marcos Vinícius', role: 'user', email: 'marcos@demo.com', status: 'active', tags: ['Jovens', 'Mídia'] },
      { name: 'Juliana Costa', role: 'user', email: 'juliana@demo.com', status: 'active', tags: ['Infantil', 'Educação'] },
      { name: 'Felipe Rocha', role: 'user', email: 'felipe@demo.com', status: 'active', tags: ['Célula', 'Visitante'] },
      { name: 'Beatriz Lima', role: 'user', email: 'beatriz@demo.com', status: 'active', tags: ['Acolhimento'] },
      { name: 'Gabriel Souza', role: 'user', email: 'gabriel@demo.com', status: 'active', tags: ['Som', 'Música'] },
      { name: 'Carla Mendes', role: 'user', email: 'carla@demo.com', status: 'active', tags: ['Intercessão'] },
    ];

    const userIds: string[] = [];
    for (const user of demoUsers) {
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        ...user,
        uid: userRef.id,
        displayName: user.name,
        churchId,
        isDemo: true,
        createdAt: serverTimestamp(),
      });
      userIds.push(userRef.id);
    }

    // 2. Generate Demo Posts
    const demoPosts = [
      { content: 'Que culto maravilhoso tivemos hoje! Deus falou profundamente aos nossos corações sobre esperança.', authorName: 'Ricardo Oliveira', type: 'announcement' },
      { content: 'Gostaria de agradecer a todos que oraram pela minha saúde. Recebi alta hoje! Glória a Deus!', authorName: 'Marcos Vinícius', type: 'testimony' },
      { content: 'Lembrando que nossa vigília será na próxima sexta-feira às 22h. Não perca!', authorName: 'Ana Paula Santos', type: 'announcement' },
      { content: 'Pedido de oração pela família da irmã Maria, que passa por um momento difícil.', authorName: 'Carla Mendes', type: 'prayer' },
    ];

    for (const post of demoPosts) {
      const postRef = doc(collection(db, 'posts'));
      await setDoc(postRef, {
        ...post,
        id: postRef.id,
        churchId,
        authorId: userIds[Math.floor(Math.random() * userIds.length)],
        likesCount: Math.floor(Math.random() * 20),
        isDemo: true,
        createdAt: serverTimestamp(),
      });
    }

    // 3. Generate Demo Cells
    const demoCells = [
      { name: 'Célula Videira', leaderName: 'Ana Paula Santos', meetingDay: 'Terça-feira', meetingTime: '20:00', address: 'Rua das Flores, 123' },
      { name: 'Célula Ágape', leaderName: 'Felipe Rocha', meetingDay: 'Quinta-feira', meetingTime: '19:30', address: 'Av. Central, 456' },
      { name: 'Célula Shalom', leaderName: 'Beatriz Lima', meetingDay: 'Sábado', meetingTime: '18:00', address: 'Rua da Paz, 789' },
    ];

    for (const cell of demoCells) {
      const cellRef = doc(collection(db, 'cells'));
      await setDoc(cellRef, {
        ...cell,
        id: cellRef.id,
        churchId,
        leaderId: userIds[Math.floor(Math.random() * userIds.length)],
        memberCount: Math.floor(Math.random() * 15) + 5,
        isDemo: true,
        createdAt: serverTimestamp(),
      });
    }

    // 4. Generate Demo EBD Tracks/Courses/Classes
    const trackRef = doc(collection(db, 'ebd_tracks'));
    await setDoc(trackRef, {
      id: trackRef.id,
      name: 'Trilha do Discipulado',
      description: 'Caminho de crescimento para novos convertidos e membros.',
      churchId,
      order: 1,
      isDemo: true,
      createdAt: serverTimestamp(),
    });

    const courseRef = doc(collection(db, 'ebd_courses'));
    await setDoc(courseRef, {
      id: courseRef.id,
      trackId: trackRef.id,
      name: 'Fundamentos da Fé',
      description: 'As bases da vida cristã.',
      churchId,
      order: 1,
      isDemo: true,
      createdAt: serverTimestamp(),
    });

    const classRef = doc(collection(db, 'ebd_classes'));
    await setDoc(classRef, {
      id: classRef.id,
      courseId: courseRef.id,
      name: 'Classe de Batismo',
      teacherName: 'Ricardo Oliveira',
      teacherId: userIds[0],
      category: 'Doutrina',
      description: 'Preparação para o batismo nas águas.',
      churchId,
      order: 1,
      isDemo: true,
      createdAt: serverTimestamp(),
    });

    // 5. Generate Demo Finances
    const demoFinances = [
      { description: 'Oferta de Domingo', amount: 1500.50, type: 'income', category: 'Oferta' },
      { description: 'Dízimos Mensais', amount: 4200.00, type: 'income', category: 'Dízimo' },
      { description: 'Aluguel do Templo', amount: 2500.00, type: 'expense', category: 'Aluguel' },
      { description: 'Conta de Energia', amount: 350.20, type: 'expense', category: 'Energia/Água' },
      { description: 'Doação para Missões', amount: 500.00, type: 'income', category: 'Doação' },
    ];

    for (const finance of demoFinances) {
      const financeRef = doc(collection(db, 'finances'));
      await setDoc(financeRef, {
        ...finance,
        id: financeRef.id,
        churchId,
        date: serverTimestamp(), // Rule requires timestamp
        isDemo: true,
        createdAt: serverTimestamp(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error generating demo data:", error);
    throw error;
  }
};

export const clearDemoData = async (churchId: string) => {
  const collections = ['users', 'posts', 'cells', 'ebd_tracks', 'ebd_courses', 'ebd_classes', 'finances'];
  
  for (const collName of collections) {
    const q = query(collection(db, collName), where('churchId', '==', churchId), where('isDemo', '==', true));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
  
  return true;
};
