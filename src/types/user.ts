/**
 * Types pour la collection 'users'
 * Collection: /users/{uid}
 */

export type UserRole = 'client' | 'chef';

export interface User {
  /** UID Firebase Auth (sert d'ID document) */
  uid: string;

  /** Rôle de l'utilisateur */
  role: UserRole;

  /** Nom d'affichage */
  displayName: string;

  /** Email de l'utilisateur */
  email: string;

  /** ID du projet associé (pour les clients) */
  projectId?: string;

  /** Token Expo Push pour les notifications */
  pushToken?: string;

  /** Préférences notifications */
  notificationsEnabled?: boolean;

  /** Date de création du compte */
  createdAt: Date;

  /** Dernière mise à jour */
  updatedAt: Date;
}

/**
 * Type pour la création d'un nouvel utilisateur
 * Exclut les champs générés automatiquement
 */
export type CreateUserData = Omit<User, 'createdAt' | 'updatedAt'>;

/**
 * Type pour la mise à jour d'un utilisateur
 * Tous les champs optionnels sauf l'uid
 */
export type UpdateUserData = Partial<Omit<User, 'uid' | 'createdAt'>> & {
  updatedAt: Date;
};