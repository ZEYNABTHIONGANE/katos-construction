import { useState, useEffect } from 'react';
import { showcaseService, ShowcaseContent } from '../services/showcaseService';
import { projectService } from '../services/projectService';
import { FirebaseProject } from '../types/firebase';

export function useShowcaseData() {
    const [content, setContent] = useState<ShowcaseContent | null>(null);
    const [villas, setVillas] = useState<FirebaseProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let currentContent: ShowcaseContent | null = null;
        let allProjects: FirebaseProject[] = [];

        const updateState = (newContent: ShowcaseContent | null, newProjects: FirebaseProject[]) => {
            setContent(newContent);

            if (newContent && newContent.featuredVillas && newContent.featuredVillas.length > 0) {
                // Si on a des villas spécifiquement marquées à la une
                const featured = newProjects.filter(p => newContent.featuredVillas.includes(p.id!));
                setVillas(featured);
            } else {
                // Sinon on prend tous les projets (villas) triés par date
                setVillas(newProjects);
            }
            setLoading(false);
        };

        console.log('Setting up real-time showcase subscriptions...');

        // 1. S'abonner au contenu du showcase
        const unsubscribeShowcase = showcaseService.subscribeToShowcase((data) => {
            currentContent = data;
            updateState(currentContent, allProjects);
        });

        // 2. S'abonner à la liste des projets
        const unsubscribeProjects = projectService.subscribeToProjects((projects) => {
            allProjects = projects;
            updateState(currentContent, allProjects);
        });

        // Nettoyage des abonnements
        return () => {
            unsubscribeShowcase();
            unsubscribeProjects();
        };
    }, []);

    return { content, villas, loading, error };
}
