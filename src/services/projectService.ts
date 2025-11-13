import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  where,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirebaseProject } from '../types/firebase';
import { COLLECTIONS } from '../types/firebase';

export class ProjectService {
  private collectionName = COLLECTIONS.projects;

  /**
   * Add a new project
   */
  async addProject(projectData: Omit<FirebaseProject, 'id' | 'createdAt'>): Promise<string> {
    const projectRef = collection(db, this.collectionName);
    const newProject = {
      ...projectData,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(projectRef, newProject);
    return docRef.id;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<FirebaseProject[]> {
    const projectRef = collection(db, this.collectionName);
    const q = query(projectRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseProject));
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(id: string): Promise<FirebaseProject | null> {
    const projectRef = doc(db, this.collectionName, id);
    const projectDoc = await getDoc(projectRef);

    if (projectDoc.exists()) {
      return {
        id: projectDoc.id,
        ...projectDoc.data()
      } as FirebaseProject;
    }

    return null;
  }

  /**
   * Get projects by type
   */
  async getProjectsByType(type: string): Promise<FirebaseProject[]> {
    const projectRef = collection(db, this.collectionName);
    const q = query(
      projectRef,
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseProject));
  }

  /**
   * Get recent projects (limited number)
   */
  async getRecentProjects(limitCount: number = 10): Promise<FirebaseProject[]> {
    const projectRef = collection(db, this.collectionName);
    const q = query(
      projectRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseProject));
  }

  /**
   * Update a project
   */
  async updateProject(id: string, updates: Partial<Omit<FirebaseProject, 'id' | 'createdAt'>>): Promise<void> {
    const projectRef = doc(db, this.collectionName, id);
    await updateDoc(projectRef, updates);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    const projectRef = doc(db, this.collectionName, id);
    await deleteDoc(projectRef);
  }

  /**
   * Subscribe to real-time project updates
   */
  subscribeToProjects(callback: (projects: FirebaseProject[]) => void): () => void {
    const projectRef = collection(db, this.collectionName);
    const q = query(projectRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseProject));
      callback(projects);
    });
  }

  /**
   * Subscribe to projects by type with real-time updates
   */
  subscribeToProjectsByType(
    type: string,
    callback: (projects: FirebaseProject[]) => void
  ): () => void {
    const projectRef = collection(db, this.collectionName);
    const q = query(
      projectRef,
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseProject));
      callback(projects);
    });
  }

  /**
   * Search projects by name or description
   */
  async searchProjects(searchTerm: string): Promise<FirebaseProject[]> {
    const projects = await this.getProjects();
    const lowercaseSearch = searchTerm.toLowerCase();

    return projects.filter(project =>
      project.name.toLowerCase().includes(lowercaseSearch) ||
      project.description.toLowerCase().includes(lowercaseSearch)
    );
  }

  /**
   * Get unique project types
   */
  async getProjectTypes(): Promise<string[]> {
    const projects = await this.getProjects();
    const types = projects.map(project => project.type);
    return [...new Set(types)].sort();
  }
}

export const projectService = new ProjectService();