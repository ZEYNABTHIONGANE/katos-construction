import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { FirebaseClientSelection } from '../types/firebase';
import type { Selection } from '../types';
import { COLLECTIONS } from '../types/firebase';

export class ClientSelectionService {
  private collectionName = COLLECTIONS.clientSelections;

  /**
   * Submit client material selections
   */
  async submitSelections(
    clientId: string,
    selections: Selection[],
    chantierId?: string
  ): Promise<string> {
    const selectionRef = collection(db, this.collectionName);

    // Calculate total amount
    const totalAmount = selections.reduce((sum, selection) => sum + selection.material.price, 0);

    // Transform selections to Firebase format
    const formattedSelections = selections.map(selection => ({
      materialId: selection.material.id,
      materialName: selection.material.name,
      materialCategory: selection.material.category,
      materialPrice: selection.material.price,
      materialImageUrl: selection.material.imageUrl,
      selectedAt: Timestamp.fromDate(selection.selectedAt)
    }));

    const newSelection: Omit<FirebaseClientSelection, 'id'> = {
      clientId,
      ...(chantierId && { chantierId }), // Only include chantierId if it's defined
      selections: formattedSelections,
      totalAmount,
      status: 'submitted',
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(selectionRef, newSelection);
    return docRef.id;
  }

  /**
   * Get client selections
   */
  async getClientSelections(clientId: string): Promise<FirebaseClientSelection[]> {
    const selectionRef = collection(db, this.collectionName);
    const q = query(
      selectionRef,
      where('clientId', '==', clientId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClientSelection));
  }

  /**
   * Get latest client selection
   */
  async getLatestClientSelection(clientId: string): Promise<FirebaseClientSelection | null> {
    const selections = await this.getClientSelections(clientId);
    return selections.length > 0 ? selections[0] : null;
  }

  /**
   * Update selection status (for backoffice)
   */
  async updateSelectionStatus(
    selectionId: string,
    status: FirebaseClientSelection['status'],
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    const selectionRef = doc(db, this.collectionName, selectionId);
    const updates: Partial<FirebaseClientSelection> = {
      status,
      reviewedAt: Timestamp.now(),
      reviewedBy,
      updatedAt: Timestamp.now()
    };

    if (notes) {
      updates.notes = notes;
    }

    await updateDoc(selectionRef, updates);
  }

  /**
   * Subscribe to client selections with real-time updates
   */
  subscribeToClientSelections(
    clientId: string,
    callback: (selections: FirebaseClientSelection[]) => void
  ): () => void {
    const selectionRef = collection(db, this.collectionName);
    const q = query(
      selectionRef,
      where('clientId', '==', clientId),
      orderBy('submittedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const selections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseClientSelection));
      callback(selections);
    });
  }

  /**
   * Subscribe to all selections (for backoffice)
   */
  subscribeToAllSelections(
    callback: (selections: FirebaseClientSelection[]) => void
  ): () => void {
    const selectionRef = collection(db, this.collectionName);
    const q = query(selectionRef, orderBy('submittedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const selections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseClientSelection));
      callback(selections);
    });
  }

  /**
   * Subscribe to pending selections (for backoffice notifications)
   */
  subscribeToPendingSelections(
    callback: (selections: FirebaseClientSelection[]) => void
  ): () => void {
    const selectionRef = collection(db, this.collectionName);
    const q = query(
      selectionRef,
      where('status', '==', 'submitted'),
      orderBy('submittedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const selections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseClientSelection));
      callback(selections);
    });
  }
}

export const clientSelectionService = new ClientSelectionService();