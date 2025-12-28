import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  FirebaseChantier,
  ChantierPhase,
  TeamMember,
  ProgressPhoto,
  ProgressUpdate,
  ChantierStatus
} from '../types/firebase';
import {
  calculateGlobalProgress,
  getChantierStatus,
  getPhaseStatus
} from '../types/firebase';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storageService';

export class ChantierService {
  private readonly COLLECTION_NAME = 'chantiers';

  // Récupérer un chantier par ID
  async getChantierById(chantierId: string): Promise<FirebaseChantier | null> {
    try {
      const chantierRef = doc(db, this.COLLECTION_NAME, chantierId);
      const snapshot = await getDoc(chantierRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as FirebaseChantier;
    } catch (error) {
      console.error('Erreur lors de la récupération du chantier:', error);
      return null;
    }
  }

  // Récupérer le chantier d'un client spécifique
  async getClientChantier(clientId: string): Promise<FirebaseChantier | null> {
    try {
      const chantiersRef = collection(db, this.COLLECTION_NAME);
      const q = query(chantiersRef, where('clientId', '==', clientId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Un client ne devrait avoir qu'un seul chantier actif
      const chantierDoc = snapshot.docs[0];
      return {
        id: chantierDoc.id,
        ...chantierDoc.data()
      } as FirebaseChantier;
    } catch (error) {
      console.error('Erreur lors de la récupération du chantier client:', error);
      return null;
    }
  }

  // Récupérer tous les chantiers assignés à un chef
  async getChefChantiers(chefId: string): Promise<FirebaseChantier[]> {
    try {
      const chantiersRef = collection(db, this.COLLECTION_NAME);
      const q = query(chantiersRef, where('assignedChefId', '==', chefId));
      const snapshot = await getDocs(q);

      const chantiers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseChantier));

      // Client-side sorting
      return chantiers.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des chantiers du chef:', error);
      return [];
    }
  }

  // Récupérer tous les chantiers (pour les tests et diagnostics)
  async getAllChantiers(): Promise<FirebaseChantier[]> {
    try {
      const chantiersRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(chantiersRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseChantier));
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les chantiers:', error);
      return [];
    }
  }

  // Mettre à jour la progression d'une sous-étape
  async updateStepProgress(
    chantierId: string,
    phaseId: string,
    stepId: string,
    progress: number,
    updatedBy: string
  ): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      const updatedPhases = chantier.phases.map(phase => {
        if (phase.id === phaseId && (phase as any).steps) {
          const katosPhase = phase as any;
          const updatedSteps = katosPhase.steps.map((step: any) => {
            if (step.id === stepId) {
              return {
                ...step,
                progress: Math.max(0, Math.min(100, progress)),
                status: getPhaseStatus(progress),
                actualStartDate: progress > 0 && !step.actualStartDate ? Timestamp.now() : (step.actualStartDate || undefined),
                actualEndDate: progress === 100 ? Timestamp.now() : undefined,
                updatedBy // Track who updated the step
              };
            }
            return step;
          });

          // Recalculate phase progress based on steps
          const totalStepProgress = updatedSteps.reduce((sum: number, step: any) => sum + step.progress, 0);
          const newPhaseProgress = Math.round(totalStepProgress / updatedSteps.length);

          return {
            ...phase,
            steps: updatedSteps,
            progress: newPhaseProgress,
            status: getPhaseStatus(newPhaseProgress),
            lastUpdated: Timestamp.now(),
            updatedBy
          };
        }
        return phase;
      });

      const globalProgress = calculateGlobalProgress(updatedPhases);
      const status = getChantierStatus(updatedPhases, chantier.plannedEndDate);

      await this.updateChantier(chantierId, {
        phases: updatedPhases,
        globalProgress,
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étape:', error);
      throw error;
    }
  }

  // Mettre à jour la progression d'une phase
  async updatePhaseProgress(
    chantierId: string,
    phaseId: string,
    progress: number,
    notes?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      const updatedPhases = chantier.phases.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            progress: Math.max(0, Math.min(100, progress)), // Clamp entre 0 et 100
            status: getPhaseStatus(progress),
            notes: notes || phase.notes,
            lastUpdated: Timestamp.now(),
            updatedBy: updatedBy || 'system'
          };
        }
        return phase;
      });

      const globalProgress = calculateGlobalProgress(updatedPhases);
      const status = getChantierStatus(updatedPhases, chantier.plannedEndDate);

      await this.updateChantier(chantierId, {
        phases: updatedPhases,
        globalProgress,
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la phase:', error);
      throw error;
    }
  }

  // Ajouter une photo ou vidéo à une phase ou à la galerie générale
  async addPhasePhoto(
    chantierId: string,
    phaseId: string,
    photoUrl: string,
    description?: string,
    uploadedBy?: string,
    mediaType: 'image' | 'video' = 'image',
    duration?: number,
    thumbnailUrl?: string,
    stepId?: string
  ): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      let updatedPhases = chantier.phases;

      // Ajouter à la phase spécifique si phaseId est fourni
      if (phaseId) {
        updatedPhases = chantier.phases.map(phase => {
          if (phase.id === phaseId) {
            return {
              ...phase,
              photos: [...phase.photos, photoUrl],
              lastUpdated: Timestamp.now(),
              updatedBy: uploadedBy || 'system'
            };
          }
          return phase;
        });

        // Si un stepId est fourni, ajouter aussi à la sous-étape
        if (stepId) {
          updatedPhases = updatedPhases.map(phase => {
            if (phase.id === phaseId && (phase as any).steps) {
              const steps = (phase as any).steps.map((step: any) => {
                if (step.id === stepId) {
                  return {
                    ...step,
                    photos: [...(step.photos || []), photoUrl]
                  };
                }
                return step;
              });
              return { ...phase, steps };
            }
            return phase;
          });
        }
      }

      // Ajouter à la galerie générale
      const newPhoto: ProgressPhoto = {
        id: uuidv4(),
        url: photoUrl,
        type: mediaType,
        ...(phaseId && phaseId.trim() !== '' && { phaseId }), // N'ajouter phaseId que s'il existe et n'est pas vide
        ...(stepId && stepId.trim() !== '' && { stepId }), // N'ajouter stepId que s'il existe et n'est pas vide
        ...(description && description.trim() !== '' && { description }), // N'ajouter description que si elle existe et n'est pas vide
        ...(duration && mediaType === 'video' && { duration }), // Ajouter duration pour les vidéos
        ...(thumbnailUrl && mediaType === 'video' && { thumbnailUrl }), // Ajouter thumbnailUrl pour les vidéos
        uploadedAt: Timestamp.now(),
        uploadedBy: uploadedBy || 'system'
      };

      await this.updateChantier(chantierId, {
        phases: updatedPhases,
        gallery: [...chantier.gallery, newPhoto],
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la photo:', error);
      throw error;
    }
  }

  // Supprimer une photo de la galerie
  async removePhasePhoto(
    chantierId: string,
    photoId: string,
    removedBy?: string
  ): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      // Trouver la photo à supprimer pour obtenir l'URL
      const photoToRemove = chantier.gallery.find(photo => photo.id === photoId);
      if (!photoToRemove) {
        throw new Error('Photo non trouvée');
      }

      // Supprimer la photo de Firebase Storage
      try {
        await storageService.deleteImage(photoToRemove.url);
      } catch (storageError) {
        console.warn('Erreur lors de la suppression de l\'image du storage:', storageError);
        // Continue même si la suppression du storage échoue
      }

      // Supprimer de la galerie générale
      const updatedGallery = chantier.gallery.filter(photo => photo.id !== photoId);

      // Supprimer aussi des phases si la photo était associée à une phase
      let updatedPhases = chantier.phases;
      if (photoToRemove.phaseId) {
        updatedPhases = chantier.phases.map(phase => {
          if (phase.id === photoToRemove.phaseId) {
            let updatedSteps = (phase as any).steps;
            if (photoToRemove.stepId && updatedSteps) {
              updatedSteps = updatedSteps.map((step: any) => {
                if (step.id === photoToRemove.stepId) {
                  return {
                    ...step,
                    photos: (step.photos || []).filter((url: string) => url !== photoToRemove.url)
                  };
                }
                return step;
              });
            }

            return {
              ...phase,
              photos: phase.photos.filter(photoUrl => photoUrl !== photoToRemove.url),
              steps: updatedSteps || (phase as any).steps,
              lastUpdated: Timestamp.now(),
              updatedBy: removedBy || 'system'
            };
          }
          return phase;
        });
      }

      await this.updateChantier(chantierId, {
        phases: updatedPhases,
        gallery: updatedGallery,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      throw error;
    }
  }

  // Ajouter un membre à l'équipe
  async addTeamMember(
    chantierId: string,
    member: Omit<TeamMember, 'id' | 'addedAt' | 'addedBy'>,
    addedBy: string
  ): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      const newMember: TeamMember = {
        ...member,
        id: uuidv4(),
        addedAt: Timestamp.now(),
        addedBy
      };

      await this.updateChantier(chantierId, {
        team: [...chantier.team, newMember],
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre d\'équipe:', error);
      throw error;
    }
  }

  // Supprimer un membre de l'équipe
  async removeTeamMember(chantierId: string, memberId: string): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      const updatedTeam = chantier.team.filter(member => member.id !== memberId);

      await this.updateChantier(chantierId, {
        team: updatedTeam,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du membre d\'équipe:', error);
      throw error;
    }
  }

  // Ajouter une mise à jour de progression
  async addProgressUpdate(
    chantierId: string,
    update: Omit<ProgressUpdate, 'id' | 'createdAt' | 'createdBy'>,
    createdBy: string
  ): Promise<void> {
    try {
      const chantier = await this.getChantierById(chantierId);
      if (!chantier) {
        throw new Error('Chantier non trouvé');
      }

      const newUpdate: ProgressUpdate = {
        ...update,
        id: uuidv4(),
        createdAt: Timestamp.now(),
        createdBy
      };

      await this.updateChantier(chantierId, {
        updates: [newUpdate, ...chantier.updates], // Nouvelles mises à jour en premier
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la mise à jour:', error);
      throw error;
    }
  }

  // Mettre à jour un chantier
  async updateChantier(chantierId: string, updates: Partial<FirebaseChantier>): Promise<void> {
    try {
      const chantierRef = doc(db, this.COLLECTION_NAME, chantierId);

      // Filtrer les valeurs undefined pour éviter l'erreur Firestore
      const cleanedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanedUpdates[key] = value;
        }
      });

      await updateDoc(chantierRef, {
        ...cleanedUpdates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chantier:', error);
      throw error;
    }
  }

  // Écouter les changements d'un chantier en temps réel
  subscribeToChantier(chantierId: string, callback: (chantier: FirebaseChantier | null) => void): () => void {
    const chantierRef = doc(db, this.COLLECTION_NAME, chantierId);

    return onSnapshot(chantierRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as FirebaseChantier);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Erreur lors de l\'écoute du chantier:', error);
      callback(null);
    });
  }

  // Écouter les changements des chantiers d'un chef
  subscribeToChefChantiers(chefId: string, callback: (chantiers: FirebaseChantier[]) => void): () => void {
    const chantiersRef = collection(db, this.COLLECTION_NAME);
    const q = query(chantiersRef, where('assignedChefId', '==', chefId));

    return onSnapshot(q, (snapshot) => {
      const chantiers: FirebaseChantier[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseChantier));

      // Client-side sorting
      chantiers.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });

      callback(chantiers);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des chantiers du chef:', error);
      callback([]);
    });
  }

  // Écouter le chantier d'un client
  subscribeToClientChantier(clientId: string, callback: (chantier: FirebaseChantier | null) => void): () => void {
    console.log('🔍 Searching for chantier with clientId:', clientId);
    const chantiersRef = collection(db, this.COLLECTION_NAME);
    const q = query(chantiersRef, where('clientId', '==', clientId));

    return onSnapshot(q, (snapshot) => {
      console.log('📊 Query snapshot result:', {
        empty: snapshot.empty,
        size: snapshot.size,
        clientId,
        collection: this.COLLECTION_NAME
      });

      if (!snapshot.empty) {
        const chantierDoc = snapshot.docs[0];
        const chantierData = chantierDoc.data();
        console.log('✅ Found chantier for client:', {
          chantierId: chantierDoc.id,
          clientId: chantierData.clientId,
          name: chantierData.name
        });
        callback({
          id: chantierDoc.id,
          ...chantierData
        } as FirebaseChantier);
      } else {
        console.log('❌ No chantier found for clientId:', clientId);
        // Let's also try to list all chantiers to debug
        getDocs(collection(db, this.COLLECTION_NAME)).then((allSnapshot) => {
          console.log('🔍 All chantiers in database:');
          allSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`  ${index + 1}. ID: ${doc.id}, clientId: ${data.clientId}, name: ${data.name || 'N/A'}`);
          });
        }).catch(console.error);
        callback(null);
      }
    }, (error) => {
      console.error('Erreur lors de l\'écoute du chantier client:', error);
      callback(null);
    });
  }

  // Calculer les statistiques pour un chef
  async getChefStats(chefId: string): Promise<{
    totalChantiers: number;
    chantiersActifs: number;
    chantiersTermines: number;
    chantiersEnRetard: number;
    progressionMoyenne: number;
  }> {
    try {
      const chantiers = await this.getChefChantiers(chefId);

      const totalChantiers = chantiers.length;
      const chantiersActifs = chantiers.filter(c => c.status === 'En cours').length;
      const chantiersTermines = chantiers.filter(c => c.status === 'Terminé').length;
      const chantiersEnRetard = chantiers.filter(c => c.status === 'En retard').length;

      const progressionMoyenne = chantiers.length > 0
        ? Math.round(chantiers.reduce((sum, chantier) => sum + chantier.globalProgress, 0) / chantiers.length)
        : 0;

      return {
        totalChantiers,
        chantiersActifs,
        chantiersTermines,
        chantiersEnRetard,
        progressionMoyenne
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalChantiers: 0,
        chantiersActifs: 0,
        chantiersTermines: 0,
        chantiersEnRetard: 0,
        progressionMoyenne: 0
      };
    }
  }
}

export const chantierService = new ChantierService();