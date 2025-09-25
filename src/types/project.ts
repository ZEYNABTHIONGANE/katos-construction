/**
 * Types pour la collection 'projects'
 * Collection: /projects/{id}
 */

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Project {
  /** ID unique du projet */
  id: string;

  /** UID du client propriétaire */
  clientId: string;

  /** Adresse du projet (optionnelle) */
  address?: string;

  /** Statut actuel du projet */
  status: ProjectStatus;

  /** Titre du projet */
  title: string;

  /** Description du projet */
  description?: string;

  /** Date de création */
  createdAt: Date;

  /** Dernière mise à jour */
  updatedAt: Date;

  /** Date de début prévue */
  startDate?: Date;

  /** Date de fin prévue */
  endDate?: Date;
}

/**
 * Type pour la création d'un nouveau projet
 * Exclut les champs générés automatiquement
 */
export type CreateProjectData = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type pour la mise à jour d'un projet
 * Tous les champs optionnels sauf l'id
 */
export type UpdateProjectData = Partial<Omit<Project, 'id' | 'createdAt'>> & {
  updatedAt: Date;
};