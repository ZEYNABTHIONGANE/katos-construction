import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export const useNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        // We only query by userId to avoid missing index errors for (userId + isRead)
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
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
    }, [auth.currentUser?.uid]);

    return {
        unreadCount,
        hasUnread: unreadCount > 0,
        loading
    };
}; 
