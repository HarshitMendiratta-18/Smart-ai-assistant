import { db, isMockMode } from '@/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types/user';

// MOCK DATA SEED TEMPLATES
const MOCK_USERS: Record<string, UserProfile> = {
  'admin-uid': {
    uid: 'admin-uid',
    email: 'admin@communisync.com',
    name: 'Aravind Swamy',
    phone: '+91 9876543210',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'resident-uid': {
    uid: 'resident-uid',
    email: 'resident@communisync.com',
    name: 'Vikram Seth',
    phone: '+91 9988776655',
    role: 'resident',
    status: 'active',
    unitNumber: 'Tower A - 501',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'tech-plumbing-uid': {
    uid: 'tech-plumbing-uid',
    email: 'plumber@communisync.com',
    name: 'Ramesh Kumar',
    phone: '+91 9123456780',
    role: 'technician',
    status: 'active',
    specialty: 'plumbing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'tech-electrical-uid': {
    uid: 'tech-electrical-uid',
    email: 'electrician@communisync.com',
    name: 'Suresh Sen',
    phone: '+91 9123456781',
    role: 'technician',
    status: 'active',
    specialty: 'electrical',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'security-uid': {
    uid: 'security-uid',
    email: 'guard@communisync.com',
    name: 'Bahadur Singh',
    phone: '+91 9234567890',
    role: 'security',
    status: 'active',
    gateNumber: 'Gate 1',
    shift: 'day',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

const MOCK_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Swimming Pool Maintenance Closure',
    content: 'The swimming pool will remain closed for weekly deep cleaning on Monday, July 6th from 8:00 AM to 4:00 PM. We apologize for the inconvenience.',
    category: 'maintenance',
    authorName: 'Aravind Swamy (Admin)',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id: 'ann-2',
    title: 'Emergency: Water Shutdown Notification',
    content: 'There will be an emergency water shut down for Tower A on Sunday from 2:00 PM to 4:00 PM to resolve a high-pressure pipe issue. Please store water in advance.',
    category: 'emergency',
    authorName: 'Aravind Swamy (Admin)',
    createdAt: new Date().toISOString(),
    pinUntil: new Date(Date.now() + 3600000 * 48).toISOString()
  },
  {
    id: 'ann-3',
    title: 'Monsoon Preparedness Guidelines',
    content: 'Residents are requested to secure balcony pots, ensure drains are clear, and report any terrace leakages immediately to prevent water logging.',
    category: 'general',
    authorName: 'Aravind Swamy (Admin)',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

const MOCK_COMPLAINTS = [
  {
    id: 'comp-1',
    residentId: 'resident-uid',
    residentName: 'Vikram Seth',
    unitNumber: 'Tower A - 501',
    description: 'Main kitchen sink faucet is dripping continuously, causing water wastage and noise.',
    category: 'plumbing',
    priority: 'medium',
    department: 'plumbing',
    severity: 'moderate',
    eta: '2 Hours',
    status: 'assigned',
    technicianId: 'tech-plumbing-uid',
    technicianName: 'Ramesh Kumar',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'comp-2',
    residentId: 'resident-uid',
    residentName: 'Vikram Seth',
    unitNumber: 'Tower A - 501',
    description: 'The elevator in Tower A is making loud grinding sounds while stopping at Floor 5.',
    category: 'lift_issue',
    priority: 'high',
    department: 'elevators',
    severity: 'severe',
    eta: '1 Hour',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Helper to initialize local storage mock DB
const initMockDB = () => {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('cs_users')) {
    localStorage.setItem('cs_users', JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem('cs_announcements')) {
    localStorage.setItem('cs_announcements', JSON.stringify(MOCK_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem('cs_complaints')) {
    localStorage.setItem('cs_complaints', JSON.stringify(MOCK_COMPLAINTS));
  }
  if (!localStorage.getItem('cs_bookings')) {
    localStorage.setItem('cs_bookings', JSON.stringify([]));
  }
  if (!localStorage.getItem('cs_visitors')) {
    localStorage.setItem('cs_visitors', JSON.stringify([]));
  }
  if (!localStorage.getItem('cs_visitor_logs')) {
    localStorage.setItem('cs_visitor_logs', JSON.stringify([]));
  }
  if (!localStorage.getItem('cs_knowledge')) {
    localStorage.setItem('cs_knowledge', JSON.stringify([]));
  }
};

// Execute initialization in client browser
if (isMockMode) {
  initMockDB();
}

// Client Database Service Object
export const dbService = {
  // USER PROFILES
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('cs_users') || '{}');
      return users[uid] || null;
    }
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  },

  async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('cs_users') || '{}');
      users[uid] = profile;
      localStorage.setItem('cs_users', JSON.stringify(users));
      return;
    }
    await setDoc(doc(db, 'users', uid), profile);
  },

  async getAllUsersByRole(role: UserRole): Promise<UserProfile[]> {
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('cs_users') || '{}');
      return Object.values(users).filter((u: any) => u.role === role) as UserProfile[];
    }
    const q = query(collection(db, 'users'), where('role', '==', role));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
  },

  // ANNOUNCEMENTS
  async getAnnouncements(): Promise<any[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem('cs_announcements') || '[]')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createAnnouncement(announcement: any): Promise<void> {
    if (isMockMode) {
      const anns = JSON.parse(localStorage.getItem('cs_announcements') || '[]');
      const newAnn = {
        id: `ann-${Date.now()}`,
        ...announcement,
        createdAt: new Date().toISOString()
      };
      anns.unshift(newAnn);
      localStorage.setItem('cs_announcements', JSON.stringify(anns));
      return;
    }
    await addDoc(collection(db, 'announcements'), {
      ...announcement,
      createdAt: new Date().toISOString()
    });
  },

  // COMPLAINTS
  async getComplaints(filters?: { residentId?: string; technicianId?: string }): Promise<any[]> {
    if (isMockMode) {
      let complaints = JSON.parse(localStorage.getItem('cs_complaints') || '[]');
      if (filters?.residentId) {
        complaints = complaints.filter((c: any) => c.residentId === filters.residentId);
      }
      if (filters?.technicianId) {
        complaints = complaints.filter((c: any) => c.technicianId === filters.technicianId);
      }
      return complaints.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    let q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    if (filters?.residentId) {
      q = query(collection(db, 'complaints'), where('residentId', '==', filters.residentId));
    } else if (filters?.technicianId) {
      q = query(collection(db, 'complaints'), where('technicianId', '==', filters.technicianId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createComplaint(complaint: any): Promise<any> {
    if (isMockMode) {
      const complaints = JSON.parse(localStorage.getItem('cs_complaints') || '[]');
      const newComplaint = {
        id: `comp-${Date.now()}`,
        ...complaint,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      complaints.unshift(newComplaint);
      localStorage.setItem('cs_complaints', JSON.stringify(complaints));
      return newComplaint;
    }
    const docRef = await addDoc(collection(db, 'complaints'), {
      ...complaint,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...complaint };
  },

  async updateComplaint(id: string, updates: any): Promise<void> {
    if (isMockMode) {
      const complaints = JSON.parse(localStorage.getItem('cs_complaints') || '[]');
      const idx = complaints.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        complaints[idx] = {
          ...complaints[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('cs_complaints', JSON.stringify(complaints));
      }
      return;
    }
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // BOOKINGS
  async getBookings(): Promise<any[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem('cs_bookings') || '[]');
    }
    const snap = await getDocs(collection(db, 'bookings'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createBooking(booking: any): Promise<void> {
    if (isMockMode) {
      const bookings = JSON.parse(localStorage.getItem('cs_bookings') || '[]');
      const newBooking = {
        id: `book-${Date.now()}`,
        ...booking,
        status: 'booked',
        createdAt: new Date().toISOString()
      };
      bookings.push(newBooking);
      localStorage.setItem('cs_bookings', JSON.stringify(bookings));
      return;
    }
    await addDoc(collection(db, 'bookings'), {
      ...booking,
      status: 'booked',
      createdAt: new Date().toISOString()
    });
  },

  async cancelBooking(id: string): Promise<void> {
    if (isMockMode) {
      const bookings = JSON.parse(localStorage.getItem('cs_bookings') || '[]');
      const idx = bookings.findIndex((b: any) => b.id === id);
      if (idx !== -1) {
        bookings[idx].status = 'cancelled';
        localStorage.setItem('cs_bookings', JSON.stringify(bookings));
      }
      return;
    }
    await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' });
  },

  // VISITORS
  async getVisitors(residentId?: string): Promise<any[]> {
    if (isMockMode) {
      let visitors = JSON.parse(localStorage.getItem('cs_visitors') || '[]');
      if (residentId) {
        visitors = visitors.filter((v: any) => v.residentId === residentId);
      }
      return visitors.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    let q = query(collection(db, 'visitors'), orderBy('createdAt', 'desc'));
    if (residentId) {
      q = query(collection(db, 'visitors'), where('residentId', '==', residentId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createVisitor(visitor: any): Promise<any> {
    if (isMockMode) {
      const visitors = JSON.parse(localStorage.getItem('cs_visitors') || '[]');
      const newVisitor = {
        id: `vis-${Date.now()}`,
        ...visitor,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      visitors.unshift(newVisitor);
      localStorage.setItem('cs_visitors', JSON.stringify(visitors));
      return newVisitor;
    }
    const docRef = await addDoc(collection(db, 'visitors'), {
      ...visitor,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...visitor };
  },

  async updateVisitorStatus(id: string, status: 'approved' | 'rejected' | 'expired'): Promise<void> {
    if (isMockMode) {
      const visitors = JSON.parse(localStorage.getItem('cs_visitors') || '[]');
      const idx = visitors.findIndex((v: any) => v.id === id);
      if (idx !== -1) {
        visitors[idx].status = status;
        localStorage.setItem('cs_visitors', JSON.stringify(visitors));
      }
      return;
    }
    await updateDoc(doc(db, 'visitors', id), { status });
  },

  // VISITOR LOGS
  async getVisitorLogs(): Promise<any[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem('cs_visitor_logs') || '[]')
        .sort((a: any, b: any) => new Date(b.gateEntryTime).getTime() - new Date(a.gateEntryTime).getTime());
    }
    const q = query(collection(db, 'visitorLogs'), orderBy('gateEntryTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createVisitorLog(log: any): Promise<void> {
    if (isMockMode) {
      const logs = JSON.parse(localStorage.getItem('cs_visitor_logs') || '[]');
      const newLog = {
        id: `vlog-${Date.now()}`,
        ...log,
        gateEntryTime: new Date().toISOString()
      };
      logs.unshift(newLog);
      localStorage.setItem('cs_visitor_logs', JSON.stringify(logs));
      return;
    }
    await addDoc(collection(db, 'visitorLogs'), {
      ...log,
      gateEntryTime: new Date().toISOString()
    });
  },

  // KNOWLEDGEBASE (RAG)
  async getKnowledgeDocuments(): Promise<any[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem('cs_knowledge') || '[]');
    }
    const snap = await getDocs(collection(db, 'knowledgeBase'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async addKnowledgeDocument(docData: any, chunks: any[]): Promise<void> {
    if (isMockMode) {
      const docs = JSON.parse(localStorage.getItem('cs_knowledge') || '[]');
      const docId = `doc-${Date.now()}`;
      const newDoc = {
        id: docId,
        ...docData,
        createdAt: new Date().toISOString(),
        chunks: chunks.map((c, i) => ({ ...c, id: `chunk-${docId}-${i}`, sourceDocumentId: docId }))
      };
      docs.unshift(newDoc);
      localStorage.setItem('cs_knowledge', JSON.stringify(docs));
      return;
    }

    // Save main doc meta
    const docRef = await addDoc(collection(db, 'knowledgeBase'), {
      ...docData,
      createdAt: new Date().toISOString()
    });

    // Save sub-chunks (can be stored in a collection, or sub-collection)
    for (const chunk of chunks) {
      await addDoc(collection(db, `knowledgeBase/${docRef.id}/chunks`), {
        ...chunk,
        sourceDocumentId: docRef.id,
        sourceDocumentTitle: docData.title
      });
    }
  },

  async getAllChunks(): Promise<any[]> {
    if (isMockMode) {
      const docs = JSON.parse(localStorage.getItem('cs_knowledge') || '[]');
      const chunks: any[] = [];
      docs.forEach((d: any) => {
        if (d.chunks) chunks.push(...d.chunks);
      });
      return chunks;
    }
    const docSnap = await getDocs(collection(db, 'knowledgeBase'));
    const chunks: any[] = [];
    for (const docObj of docSnap.docs) {
      const chunkSnap = await getDocs(collection(db, `knowledgeBase/${docObj.id}/chunks`));
      chunkSnap.forEach((c) => {
        chunks.push({ id: c.id, ...c.data() });
      });
    }
    return chunks;
  }
};
