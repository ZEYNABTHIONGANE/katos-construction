/**
 * Types pour la sous-collection 'messages'
 * Collection: /projects/{projectId}/messages/{id}
 *
 * Index recommandés:
 * - createdAt DESC (pour ordre chronologique)
 * - fromUid, createdAt DESC (messages par utilisateur)
 */

export interface Message {
  /** ID unique du message */
  id: string;

  /** UID de l'expéditeur */
  fromUid: string;

  /** Contenu texte du message (optionnel si mediaUrl présent) */
  text?: string;

  /** URL du média associé (optionnel) */
  mediaUrl?: string;

  /** Type de média si présent */
  mediaType?: 'image' | 'video' | 'document';

  /** Date de création du message */
  createdAt: Date;

  /** Message lu par le destinataire */
  isRead?: boolean;

  /** ID du message auquel on répond (optionnel) */
  replyToId?: string;
}

/**
 * Type pour la création d'un nouveau message
 * Exclut les champs générés automatiquement
 */
export type CreateMessageData = Omit<Message, 'id' | 'createdAt'>;

/**
 * Type pour la mise à jour d'un message
 * Seuls certains champs peuvent être mis à jour
 */
export type UpdateMessageData = Pick<Message, 'isRead'>;

/**
 * Type pour la validation des messages
 * Un message doit avoir soit du texte, soit un média
 */
export type ValidMessage = Message & (
  | { text: string }
  | { mediaUrl: string; mediaType: 'image' | 'video' | 'document' }
);