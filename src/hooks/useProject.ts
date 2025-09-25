import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';

import { db } from '../services/firebase';
import { Project } from '../types/project';

/**
 * Hook pour charger et écouter les données d'un projet en temps réel
 */
export const useProject = (projectId: string | null | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🏗️ Chargement projet:', projectId);
    setLoading(true);
    setError(null);

    const projectDocRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(
      projectDocRef,
      (snapshot: DocumentSnapshot) => {
        try {
          if (snapshot.exists()) {
            const projectData = snapshot.data() as Project;
            console.log('✅ Projet chargé:', projectData.title);
            setProject({
              ...projectData,
              id: snapshot.id,
            });
          } else {
            console.warn('⚠️ Projet non trouvé:', projectId);
            setProject(null);
            setError('Projet non trouvé');
          }
        } catch (err) {
          console.error('❌ Erreur parsing projet:', err);
          setError('Erreur lors du chargement du projet');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Erreur écoute projet:', err);
        setError('Erreur de connexion au projet');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [projectId]);

  return {
    project,
    loading,
    error,
  };
};