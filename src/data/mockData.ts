import {
  User,
  Project,
  Message,
  Category,
  Material,
  ProjectUpdate,
  ProjectPhase,
  Selection,
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Moussa Diop',
    email: 'client@katos.com',
    phone: '+221 77 123 45 67',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Papis Sakho',
    email: 'chef@katos.com',
    phone: '+221 76 234 56 78',
    role: 'chef',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
];

export const mockUser: User = mockUsers[0];

// Mock Project
export const mockProject: Project = {
  id: '1',
  name: 'Villa Amina F6',
  address: '123 Avenue Léopold Sédar Senghor, Dakar',
  status: 'En cours',
  progress: 65,
  imageUrl: 'file:///C:/Users/Hp/Downloads/WhatsApp%20Image%202025-10-20%20%C3%A0%2015.31.53_d1624b71.jpg',
  startDate: '2024-01-15',
  endDate: '2024-06-30',
};

// Mock Project Updates
export const mockProjectUpdates: ProjectUpdate[] = [
  {
    id: '1',
    title: 'Finalisation des murs porteurs',
    description: 'Les murs porteurs du rez-de-chaussée sont terminés. Début des travaux d\'étanchéité prévu demain.',
    date: '2024-03-15',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop',
    status: 'completed',
  },
  {
    id: '2',
    title: 'Installation électrique en cours',
    description: 'L\'équipe électricité travaille sur le câblage du premier étage.',
    date: '2024-03-14',
    status: 'in-progress',
  },
  {
    id: '3',
    title: 'Livraison des matériaux de finition',
    description: 'Réception du carrelage et de la peinture sélectionnés.',
    date: '2024-03-13',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    status: 'completed',
  },
];

// Mock Project Phases
export const mockProjectPhases: ProjectPhase[] = [
  {
    id: '1',
    name: 'Fondations',
    status: 'completed',
    startDate: '2024-01-15',
    endDate: '2024-02-05',
    description: 'Excavation et coulage des fondations',
  },
  {
    id: '2',
    name: 'Gros œuvre',
    status: 'completed',
    startDate: '2024-02-06',
    endDate: '2024-03-10',
    description: 'Construction des murs porteurs et structure',
  },
  {
    id: '3',
    name: 'Toiture',
    status: 'in-progress',
    startDate: '2024-03-11',
    description: 'Installation de la charpente et couverture',
  },
  {
    id: '4',
    name: 'Électricité & Plomberie',
    status: 'pending',
    description: 'Installation des réseaux électriques et sanitaires',
  },
  {
    id: '5',
    name: 'Finitions',
    status: 'pending',
    description: 'Peinture, carrelage, revêtements',
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Bonjour M. Diop, j\'espère que vous allez bien. Je voulais vous informer que nous avons terminé les fondations selon le planning prévu.',
    senderId: 'chef1',
    senderName: 'Chef de chantier',
    timestamp: new Date('2024-03-15T09:00:00'),
    isFromUser: false,
  },
  {
    id: '2',
    text: 'Parfait ! Pouvez-vous m\'envoyer quelques photos ?',
    senderId: '1',
    senderName: 'Moussa Diop',
    timestamp: new Date('2024-03-15T09:15:00'),
    isFromUser: true,
  },
  {
    id: '3',
    text: 'Bien sûr, je vous envoie les photos dans quelques minutes. Nous commençons les murs porteurs lundi prochain.',
    senderId: 'chef1',
    senderName: 'Chef de chantier',
    timestamp: new Date('2024-03-15T09:30:00'),
    isFromUser: false,
  },
  {
    id: '4',
    text: 'Merci beaucoup pour le suivi régulier. À quelle heure puis-je passer voir l\'avancement ?',
    senderId: '1',
    senderName: 'Moussa Diop',
    timestamp: new Date('2024-03-15T14:00:00'),
    isFromUser: true,
  },
  {
    id: '5',
    text: 'Vous pouvez passer quand vous voulez entre 8h et 17h. Je serai sur place pour vous faire le point.',
    senderId: 'chef1',
    senderName: 'Chef de chantier',
    timestamp: new Date('2024-03-15T14:15:00'),
    isFromUser: false,
  },
];

// Mock Materials
const mockMaterials: Material[] = [
  // Peinture
  {
    id: 'mat1',
    name: 'Peinture Premium Blanc Cassé',
    category: 'Peinture',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&h=200&fit=crop',
    description: 'Peinture haut de gamme, résistante et facile d\'entretien',
    supplier: 'Dulux Sénégal',
  },
  {
    id: 'mat2',
    name: 'Peinture Acrylique Beige',
    category: 'Peinture',
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&h=200&fit=crop',
    description: 'Peinture acrylique, séchage rapide',
    supplier: 'Astral Paints',
  },

  // Carrelage
  {
    id: 'mat3',
    name: 'Carrelage Grès Cérame 60x60',
    category: 'Carrelage',
    price: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    description: 'Carrelage moderne, résistant aux taches',
    supplier: 'Ceramica Dakar',
  },
  {
    id: 'mat4',
    name: 'Carrelage Imitation Parquet',
    category: 'Carrelage',
    price: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
    description: 'Aspect bois naturel, facile d\'entretien',
    supplier: 'Wood Look Tiles',
  },

  // Sanitaires
  {
    id: 'mat5',
    name: 'Lavabo Design Moderne',
    category: 'Sanitaires',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=200&fit=crop',
    description: 'Lavabo en céramique avec robinetterie incluse',
    supplier: 'Roca Sénégal',
  },
  {
    id: 'mat6',
    name: 'WC Suspendu Premium',
    category: 'Sanitaires',
    price: 120000,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
    description: 'WC suspendu avec chasse d\'eau économique',
    supplier: 'Grohe Dakar',
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Peinture',
    icon: 'format-paint',
    materials: mockMaterials.filter(m => m.category === 'Peinture'),
  },
  {
    id: 'cat2',
    name: 'Carrelage',
    icon: 'view-module',
    materials: mockMaterials.filter(m => m.category === 'Carrelage'),
  },
  {
    id: 'cat3',
    name: 'Sanitaires',
    icon: 'plumbing',
    materials: mockMaterials.filter(m => m.category === 'Sanitaires'),
  },
  {
    id: 'cat4',
    name: 'Électricité',
    icon: 'electrical-services',
    materials: [],
  },
  {
    id: 'cat5',
    name: 'Menuiserie',
    icon: 'handyman',
    materials: [],
  },
  {
    id: 'cat6',
    name: 'Isolation',
    icon: 'layers',
    materials: [],
  },
];

// Mock User Selections
export const mockSelections: Selection[] = [
  {
    id: 'sel1',
    materialId: 'mat1',
    material: mockMaterials[0],
    selectedAt: new Date('2024-03-10'),
  },
  {
    id: 'sel2',
    materialId: 'mat3',
    material: mockMaterials[2],
    selectedAt: new Date('2024-03-12'),
  },
];

export { mockMaterials };