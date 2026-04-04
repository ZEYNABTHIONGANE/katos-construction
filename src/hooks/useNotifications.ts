import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export const useNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndSubscribe = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            // Get user role first
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const role = userDoc.exists() ? userDoc.data()?.role : 'client';
            const isChef = role === 'chef' || userDoc.data()?.isChef;

            // Subscribe to notifications
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', user.uid)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const docs = snapshot.docs;
                const unread = docs.filter(doc => {
                    const data = doc.data();
                    if (data.isRead) return false;
                    
                    // If chef, no notifications
                    if (isChef) {
                        return false;
                    }
                    
                    return true;
                }).length;
                
                setUnreadCount(unread);
                setLoading(false);
            }, (error) => {
                console.error('Error in useNotifications:', error);
                setLoading(false);
            });

            return unsubscribe;
        };

        const currentUnsubscribePromise = fetchAndSubscribe();

        return () => {
            currentUnsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [auth.currentUser?.uid]);

    return {
        unreadCount,
        hasUnread: unreadCount > 0,
        loading
    };
}; 
