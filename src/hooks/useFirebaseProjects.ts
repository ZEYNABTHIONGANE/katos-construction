import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import type { FirebaseProject } from '../types/firebase';

export const useFirebaseProjects = () => {
  const [projects, setProjects] = useState<FirebaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = projectService.subscribeToProjects((projects) => {
      setProjects(projects);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addProject = async (projectData: Omit<FirebaseProject, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      return await projectService.addProject(projectData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Omit<FirebaseProject, 'id' | 'createdAt'>>) => {
    try {
      setError(null);
      await projectService.updateProject(id, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setError(null);
      await projectService.deleteProject(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const searchProjects = async (searchTerm: string) => {
    try {
      setError(null);
      return await projectService.searchProjects(searchTerm);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getProjectsByType = async (type: string) => {
    try {
      setError(null);
      return await projectService.getProjectsByType(type);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getProjectTypes = async () => {
    try {
      setError(null);
      return await projectService.getProjectTypes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    searchProjects,
    getProjectsByType,
    getProjectTypes
  };
};

export const useFirebaseProjectsByType = (type: string) => {
  const [projects, setProjects] = useState<FirebaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = projectService.subscribeToProjectsByType(type, (projects) => {
      setProjects(projects);
      setLoading(false);
    });

    return unsubscribe;
  }, [type]);

  return {
    projects,
    loading,
    error
  };
};

export const useFirebaseProject = (id: string) => {
  const [project, setProject] = useState<FirebaseProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setError(null);
        if (!project) setLoading(true);
        const projectData = await projectService.getProjectById(id);
        setProject(projectData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  return {
    project,
    loading,
    error
  };
};