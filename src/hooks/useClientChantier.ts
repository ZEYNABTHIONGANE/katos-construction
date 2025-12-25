
import { useState, useEffect, useCallback } from 'react';
import { chantierService } from '../services/chantierService';
import { useClientAuth } from './useClientAuth';
import type { FirebaseChantier, KatosChantierPhase } from '../types/firebase';

export const useClientChantier = (specificChantierId?: string) => {
  const { session, isAuthenticated, refreshKey } = useClientAuth();
  const [chantier, setChantier] = useState<FirebaseChantier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useClientChantier useEffect triggered:', {
      isAuthenticated,
      clientId: session?.clientId,
      specificChantierId,
      refreshKey,
      hasSession: !!session
    });

    if (!isAuthenticated || !session?.clientId) {
      console.log('❌ useClientChantier: Not authenticated or no clientId');
      setChantier(null);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('✅ useClientChantier: Starting subscription for clientId:', session.clientId);
    // Only set loading to true if we don't already have data
    if (!chantier) {
      setLoading(true);
    }
    setError(null);

    let unsubscribe: () => void;

    if (specificChantierId) {
      console.log('🎯 useClientChantier: Using specific chantier ID:', specificChantierId);
      // Si un ID spécifique est fourni, récupérer ce chantier directement
      unsubscribe = chantierService.subscribeToChantier(
        specificChantierId,
        (chantierData) => {
          console.log('📦 useClientChantier (specific): Received chantier data:', chantierData?.id || null);
          setChantier(chantierData);
          setLoading(false);
          setError(chantierData === null ? 'Chantier non trouvé' : null);
        }
      );
    } else {
      console.log('🏠 useClientChantier: Using client chantier for clientId:', session.clientId);
      // Sinon, récupérer le chantier du client connecté
      unsubscribe = chantierService.subscribeToClientChantier(
        session.clientId,
        (chantierData) => {
          console.log('📦 useClientChantier (client): Received chantier data:', chantierData?.id || null);
          setChantier(chantierData);
          setLoading(false);
          setError(chantierData === null ? 'Aucun chantier assigné' : null);
        }
      );
    }

    return () => {
      console.log('🧹 useClientChantier: Cleanup subscription');
      unsubscribe();
    };
  }, [isAuthenticated, session?.clientId, specificChantierId]); // Remove refreshKey from dependencies to avoid multiple triggers

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
      uploadedAt: photo.uploadedAt,
      type: photo.type,
      thumbnailUrl: photo.thumbnailUrl
    }));

    // Add phase photos
    const phasePhotos = chantier.phases
      .flatMap(phase =>
        phase.photos.map(photoUrl => ({
          id: `phase_${phase.id}_${photoUrl}`,
          url: photoUrl,
          description: `Photo ${phase.name}`,
          uploadedAt: phase.lastUpdated,
          type: 'image' as const,
          thumbnailUrl: undefined
        }))
      );

    return [...galleryPhotos, ...phasePhotos]
      .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());
  };

  // Get phases with completion status
  const getPhases = () => {
    if (!chantier?.phases) return [];

    return chantier.phases
      .filter(phase => phase.name !== 'Électricité & Plomberie')
      .map(phase => {
        // Cast to KatosChantierPhase to access expanded properties
        const katosPhase = phase as unknown as KatosChantierPhase;

        return {
          id: phase.id,
          name: phase.name,
          description: phase.description,
          status: phase.status,
          progress: phase.progress,
          // Pass through additional fields needed for UI
          lastUpdated: phase.lastUpdated,
          updatedBy: phase.updatedBy,
          category: katosPhase.category, // From KatosChantierPhase
          steps: katosPhase.steps,       // From KatosChantierPhase

          startDate: phase.actualStartDate
            ? phase.actualStartDate.toDate().toLocaleDateString('fr-FR')
            : phase.plannedStartDate?.toDate().toLocaleDateString('fr-FR'),
          endDate: phase.actualEndDate
            ? phase.actualEndDate.toDate().toLocaleDateString('fr-FR')
            : phase.plannedEndDate?.toDate().toLocaleDateString('fr-FR')
        };
      });
  };

  const photos = getPhotos();

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
    assignedChefId: chantier?.assignedChefId || '',
    startDate: chantier?.startDate?.toDate().toLocaleDateString('fr-FR') || '',
    plannedEndDate: chantier?.plannedEndDate?.toDate().toLocaleDateString('fr-FR') || '',

    // Main image logic
    mainImage: chantier?.coverImage
      ? { id: 'cover', url: chantier.coverImage, description: 'Image de couverture', uploadedAt: chantier.updatedAt }
      : photos.length > 0
        ? photos[0]
        : null,

    // Data arrays
    photos,
    phases: getPhases(),
    recentUpdates: getRecentUpdates()
  };
};