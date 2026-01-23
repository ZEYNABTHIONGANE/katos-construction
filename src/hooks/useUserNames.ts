import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

interface UserNamesCache {
    [uid: string]: string;
}

export const useUserNames = (userIds: string[]) => {
    const [userNames, setUserNames] = useState<UserNamesCache>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userIds.length === 0) {
            setLoading(false);
            return;
        }

        const loadUserNames = async () => {
            setLoading(true);
            const newUserNames: UserNamesCache = { ...userNames };

            // Récupérer les noms des utilisateurs qui ne sont pas encore en cache
            const uniqueIds = Array.from(new Set(userIds));
            const missingUserIds = uniqueIds.filter(uid => !newUserNames[uid] && uid !== 'system' && uid !== 'Fatou Sy');

            if (missingUserIds.length > 0) {
                try {
                    const userPromises = missingUserIds.map(uid =>
                        userService.getUserByUid(uid)
                    );

                    const users = await Promise.all(userPromises);

                    users.forEach((user, index) => {
                        const uid = missingUserIds[index];
                        if (user && user.displayName) {
                            newUserNames[uid] = user.displayName;
                        } else {
                            // Fallback si l'utilisateur n'est pas trouvé
                            newUserNames[uid] = 'Utilisateur inconnu';
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la récupération des noms d\'utilisateurs:', error);
                    // En cas d'erreur, utiliser un fallback pour tous les IDs manqués
                    missingUserIds.forEach(uid => {
                        newUserNames[uid] = 'Utilisateur';
                    });
                }
            }

            setUserNames(prev => ({ ...prev, ...newUserNames }));
            setLoading(false);
        };

        loadUserNames();
    }, [userIds.join(',')]); // Dépendance sur la concaténation des IDs

    const getUserName = (uid: string): string => {
        if (uid === 'system') return 'Système';
        if (uid === 'Fatou Sy') return 'Fatou Sy'; // Cas spécifique legacy
        return userNames[uid] || 'Chargement...';
    };

    return {
        userNames,
        loading,
        getUserName
    };
};
