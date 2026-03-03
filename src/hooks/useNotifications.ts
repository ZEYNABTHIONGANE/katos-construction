import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useClientSpecificData } from './useClientSpecificData';

export const useNotifications = () => {
    const { clientInfo } = useClientSpecificData();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clientInfo?.id) {
            setLoading(false);
            return;
        }

        // We only query by userId to avoid missing index errors for (userId + isRead)
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', clientInfo.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs;
            const unread = docs.filter(doc => !doc.data().isRead).length;
            setUnreadCount(unread);
            setLoading(false);
        }, (error) => {
            console.error('Error in useNotifications:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientInfo?.id]);

    return {
        unreadCount,
        hasUnread: unreadCount > 0,
        loading
    };
}; 
