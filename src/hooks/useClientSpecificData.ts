import { useState, useEffect, useMemo } from 'react';
import { useFirebaseProjects } from './useFirebaseProjects';
import { useFirebaseMaterials } from './useFirebaseMaterials';
import { useClientAuth } from './useClientAuth';
import { useClientData } from './useClientData';
import { useClientProjectLookup } from './useClientProjectLookup';
import type { FirebaseProject, FirebaseMaterial } from '../types/firebase';
import type { Project, Material, Category } from '../types';
import {
  transformFirebaseProjectToProject,
  transformFirebaseMaterialToMaterial,
  groupMaterialsByCategory,
  filterProjectsByClient
} from '../utils/dataTransformers';

export const useClientSpecificData = () => {
  const { session, isAuthenticated } = useClientAuth();
  const { clientData } = useClientData(session?.clientId || null);
  const { projects: allProjects, loading: projectsLoading, error: projectsError } = useFirebaseProjects();
  const { materials: allMaterials, loading: materialsLoading, error: materialsError } = useFirebaseMaterials();

  // Use the new client project lookup hook for proper project filtering
  const clientProjectLookup = useClientProjectLookup(session?.clientId || null);

  // Client-specific projects - now properly filtered by projetAdhere
  const clientProjects = useMemo(() => {
    if (!isAuthenticated || !clientProjectLookup.isReady || !clientProjectLookup.hasValidProject) {
      return [];
    }

    // Return array with the client's specific project
    return clientProjectLookup.clientProject ? [clientProjectLookup.clientProject] : [];
  }, [isAuthenticated, clientProjectLookup.isReady, clientProjectLookup.hasValidProject, clientProjectLookup.clientProject]);

  // Get all available materials grouped by category
  const materialCategories = useMemo(() => {
    if (!allMaterials.length) return [];
    return groupMaterialsByCategory(allMaterials);
  }, [allMaterials]);

  // Get current project for the client - now their specific assigned project
  const currentProject = useMemo(() => {
    return clientProjectLookup.clientProject || null;
  }, [clientProjectLookup.clientProject]);

  // Loading state - include project lookup loading
  const loading = projectsLoading || materialsLoading || clientProjectLookup.loading;

  // Error state - prioritize project assignment errors
  const error = clientProjectLookup.assignmentError || projectsError || materialsError;

  // Client information
  const clientInfo = useMemo(() => {
    if (!clientData || !session) return null;

    return {
      id: session.clientId,
      name: `${clientData.prenom} ${clientData.nom}`,
      firstName: clientData.prenom,
      lastName: clientData.nom,
      email: clientData.email,
      status: clientData.status,
      projectName: clientData.projetAdhere,
      siteLocation: clientData.localisationSite
    };
  }, [clientData, session]);

  // Get materials by category
  const getMaterialsByCategory = (categoryName: string): Material[] => {
    const category = materialCategories.find(cat => cat.name === categoryName);
    return category ? category.materials : [];
  };

  // Search functionality
  const searchProjects = (query: string): Project[] => {
    const lowercaseQuery = query.toLowerCase();
    return clientProjects.filter(project =>
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.address.toLowerCase().includes(lowercaseQuery)
    );
  };

  const searchMaterials = (query: string): Material[] => {
    const lowercaseQuery = query.toLowerCase();
    const allMaterialsList = materialCategories.flatMap(cat => cat.materials);

    return allMaterialsList.filter(material =>
      material.name.toLowerCase().includes(lowercaseQuery) ||
      material.category.toLowerCase().includes(lowercaseQuery) ||
      material.description?.toLowerCase().includes(lowercaseQuery) ||
      material.supplier?.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    // Authentication state
    isAuthenticated,
    clientInfo,

    // Data
    projects: clientProjects,
    currentProject,
    materialCategories,

    // Loading and error states
    loading,
    error,

    // Project assignment information
    hasProjectAssignment: clientProjectLookup.hasProjectAssignment,
    isValidProjectAssignment: clientProjectLookup.isValidAssignment,
    projectAssignmentError: clientProjectLookup.assignmentError,
    suggestedProjects: clientProjectLookup.suggestedProjects,

    // Utility functions
    getMaterialsByCategory,
    searchProjects,
    searchMaterials,
    getProjectAssignmentDiagnostics: clientProjectLookup.getAssignmentDiagnostics,

    // Raw data (for advanced use cases)
    rawProjects: allProjects,
    rawMaterials: allMaterials,
    rawClientProject: clientProjectLookup.rawClientProject
  };
};