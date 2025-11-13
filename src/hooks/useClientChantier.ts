import { useState, useEffect } from 'react';
import { chantierService } from '../services/chantierService';
import { useClientAuth } from './useClientAuth';
import type { FirebaseChantier } from '../types/firebase';

export const useClientChantier = (specificChantierId?: string) => {
  const { session, isAuthenticated } = useClientAuth();
  const [chantier, setChantier] = useState<FirebaseChantier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !session?.clientId) {
      setChantier(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: () => void;

    if (specificChantierId) {
      // Si un ID spécifique est fourni, récupérer ce chantier directement
      unsubscribe = chantierService.subscribeToChantier(
        specificChantierId,
        (chantierData) => {
          setChantier(chantierData);
          setLoading(false);
          setError(chantierData === null ? 'Chantier non trouvé' : null);
        }
      );
    } else {
      // Sinon, récupérer le chantier du client connecté
      unsubscribe = chantierService.subscribeToClientChantier(
        session.clientId,
        (chantierData) => {
          setChantier(chantierData);
          setLoading(false);
          setError(chantierData === null ? 'Aucun chantier assigné' : null);
        }
      );
    }

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, session?.clientId, specificChantierId]);

  // Calculate current phase based on phases status
  const getCurrentPhase = () => {
    if (!chantier?.phases) return 'En préparation';

    const inProgressPhase = chantier.phases.find(phase => phase.status === 'in-progress');
    if (inProgressPhase) return inProgressPhase.name;

    const nextPendingPhase = chantier.phases.find(phase => phase.status === 'pending');
    if (nextPendingPhase) return nextPendingPhase.name;

    const allCompleted = chantier.phases.every(phase => phase.status === 'completed');
    if (allCompleted) return 'Projet terminé';

    return 'En préparation';
  };

  // Get recent updates visible to client
  const getRecentUpdates = (limit = 3) => {
    if (!chantier?.updates) return [];

    return chantier.updates
      .filter(update => update.isVisibleToClient)
      .slice(0, limit)
      .map(update => ({
        id: update.id,
        title: update.title,
        description: update.description,
        date: update.createdAt.toDate().toLocaleDateString('fr-FR'),
        status: update.type === 'phase_completion' ? 'completed' : 'progress'
      }));
  };

  // Get photos from gallery and phases
  const getPhotos = () => {
    if (!chantier) return [];

    const galleryPhotos = chantier.gallery.map(photo => ({
      id: photo.id,
      url: photo.url,
      description: photo.description || 'Photo du chantier',
      uploadedAt: photo.uploadedAt
    }));

    // Add phase photos
    const phasePhotos = chantier.phases
      .flatMap(phase =>
        phase.photos.map(photoUrl => ({
          id: `phase_${phase.id}_${photoUrl}`,
          url: photoUrl,
          description: `Photo ${phase.name}`,
          uploadedAt: phase.lastUpdated
        }))
      );

    return [...galleryPhotos, ...phasePhotos]
      .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());
  };

  // Get phases with completion status
  const getPhases = () => {
    if (!chantier?.phases) return [];

    return chantier.phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      description: phase.description,
      status: phase.status,
      progress: phase.progress,
      startDate: phase.actualStartDate
        ? phase.actualStartDate.toDate().toLocaleDateString('fr-FR')
        : phase.plannedStartDate?.toDate().toLocaleDateString('fr-FR'),
      endDate: phase.actualEndDate
        ? phase.actualEndDate.toDate().toLocaleDateString('fr-FR')
        : phase.plannedEndDate?.toDate().toLocaleDateString('fr-FR')
    }));
  };

  return {
    chantier,
    loading,
    error,
    hasChantier: !!chantier,

    // Computed values
    currentPhase: getCurrentPhase(),
    globalProgress: chantier?.globalProgress || 0,
    status: chantier?.status || 'En attente',
    name: chantier?.name || '',
    address: chantier?.address || '',
    startDate: chantier?.startDate?.toDate().toLocaleDateString('fr-FR') || '',
    plannedEndDate: chantier?.plannedEndDate?.toDate().toLocaleDateString('fr-FR') || '',

    // Data arrays
    photos: getPhotos(),
    recentUpdates: getRecentUpdates(),
    phases: getPhases()
  };
};