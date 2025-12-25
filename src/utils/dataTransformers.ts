import type { FirebaseProject, FirebaseClient } from '../types/firebase';
import type { Project, User, ProjectUpdate, ProjectPhase } from '../types';

/**
 * Transform Firebase project data to mobile app project format
 */
export const transformFirebaseProjectToProject = (firebaseProject: FirebaseProject): Project => {
  return {
    id: firebaseProject.id!,
    name: firebaseProject.name,
    address: firebaseProject.description, // Using description as address for now
    status: 'En cours', // Default status - could be derived from project metadata
    progress: 65, // Default progress - could be calculated from project phases
    imageUrl: firebaseProject.images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    startDate: firebaseProject.createdAt ? new Date(firebaseProject.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
    endDate: undefined // Could be added to Firebase schema if needed
  };
};


/**
 * Transform Firebase client data to mobile app user format
 */
export const transformFirebaseClientToUser = (firebaseClient: FirebaseClient): User => {
  return {
    id: firebaseClient.id!,
    name: `${firebaseClient.prenom} ${firebaseClient.nom}`,
    email: firebaseClient.email,
    phone: '', // Not available in current Firebase schema
    role: 'client',
    avatar: undefined // Could be added to Firebase schema if needed
  };
};


/**
 * Create mock project updates for a project (since this data isn't in Firebase yet)
 */
export const createMockProjectUpdates = (project: FirebaseProject): ProjectUpdate[] => {
  const baseDate = project.createdAt ? new Date(project.createdAt.seconds * 1000) : new Date();

  return [
    {
      id: '1',
      title: 'Début des travaux de fondation',
      description: `Les travaux de fondation pour ${project.name} ont commencé selon le planning prévu.`,
      date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop',
      status: 'completed' as const,
    },
    {
      id: '2',
      title: 'Installation en cours',
      description: `Progression des installations techniques pour ${project.name}.`,
      date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      status: 'in-progress' as const,
    },
    {
      id: '3',
      title: 'Livraison des matériaux',
      description: 'Réception des matériaux sélectionnés pour la suite des travaux.',
      date: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
      status: 'completed' as const,
    },
  ];
};

/**
 * Create mock project phases for a project (since this data isn't in Firebase yet)
 */
export const createMockProjectPhases = (project: FirebaseProject): ProjectPhase[] => {
  return [
    {
      id: '1',
      name: 'Fondations',
      status: 'completed',
      startDate: project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      endDate: project.createdAt ? new Date(project.createdAt.seconds * 1000 + 20 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR') : undefined,
      description: 'Excavation et coulage des fondations',
    },
    {
      id: '2',
      name: 'Gros œuvre',
      status: 'completed',
      startDate: project.createdAt ? new Date(project.createdAt.seconds * 1000 + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR') : undefined,
      endDate: project.createdAt ? new Date(project.createdAt.seconds * 1000 + 50 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR') : undefined,
      description: 'Construction des murs porteurs et structure',
    },
    {
      id: '3',
      name: 'Toiture',
      status: 'in-progress',
      startDate: project.createdAt ? new Date(project.createdAt.seconds * 1000 + 51 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR') : undefined,
      description: 'Installation de la charpente et couverture',
    },

    {
      id: '5',
      name: 'Finitions',
      status: 'pending',
      description: 'Peinture, carrelage, revêtements',
    },
  ];
};

/**
 * Calculate project progress based on phases
 */
export const calculateProjectProgress = (phases: ProjectPhase[]): number => {
  if (phases.length === 0) return 0;

  const completedPhases = phases.filter(phase => phase.status === 'completed').length;
  const inProgressPhases = phases.filter(phase => phase.status === 'in-progress').length;

  // Completed phases count as 100%, in-progress phases count as 50%
  const progress = (completedPhases + inProgressPhases * 0.5) / phases.length * 100;

  return Math.round(progress);
};

/**
 * Transform Firebase project to ClientProject format for ClientProjectsScreen
 */
export const transformFirebaseProjectToClientProject = (firebaseProject: FirebaseProject) => {
  const phases = createMockProjectPhases(firebaseProject);
  const progress = calculateProjectProgress(phases);

  return {
    id: firebaseProject.id!,
    name: firebaseProject.name,
    address: firebaseProject.description,
    status: progress === 100 ? 'Terminé' : progress > 0 ? 'En cours' : 'En attente' as 'En cours' | 'Terminé' | 'En attente',
    progress,
    imageUrl: firebaseProject.images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    startDate: firebaseProject.createdAt ? new Date(firebaseProject.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
    endDate: progress === 100 ? new Date().toLocaleDateString('fr-FR') : undefined,
    description: firebaseProject.description,
    documents: [] // Will be populated separately
  };
};

/**
 * Get current project phase name based on progress
 */
export const getCurrentPhaseName = (progress: number): string => {
  if (progress >= 90) return 'Finitions';

  if (progress >= 50) return 'Toiture';
  if (progress >= 30) return 'Gros œuvre';
  if (progress >= 10) return 'Fondations';
  return 'Préparation';
};

/**
 * Filter projects by client using the projetAdhere field
 * Returns the specific project assigned to the client based on their projetAdhere value
 */
export const filterProjectsByClient = (
  projects: FirebaseProject[],
  clientData: FirebaseClient | null
): FirebaseProject[] => {
  if (!clientData || !projects.length) {
    return [];
  }

  // Import the client project service to handle the matching logic
  const { clientProjectService } = require('../services/clientProjectService');

  const matchedProject = clientProjectService.findClientProject(clientData, projects);

  return matchedProject ? [matchedProject] : [];
};

/**
 * Get client's specific project with validation
 * Returns detailed information about the client-project relationship
 */
export const getClientSpecificProject = (
  projects: FirebaseProject[],
  clientData: FirebaseClient | null
) => {
  if (!clientData || !projects.length) {
    return {
      project: null,
      hasAssignment: false,
      isValid: false,
      error: 'Données client ou projets manquants'
    };
  }

  const { clientProjectService } = require('../services/clientProjectService');
  const validation = clientProjectService.validateClientProjectAssignment(clientData, projects);

  return {
    project: validation.matchedProject || null,
    hasAssignment: validation.hasProjectAssignment,
    isValid: validation.isValid,
    error: !validation.hasProjectAssignment
      ? 'Aucun projet assigné au client'
      : !validation.projectFound
        ? `Projet "${clientData.projetAdhere}" non trouvé`
        : null,
    suggestions: validation.suggestions || []
  };
};