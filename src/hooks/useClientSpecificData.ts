import { useState, useEffect, useMemo } from 'react';
import { useFirebaseProjects } from './useFirebaseProjects';
import { useClientAuth } from './useClientAuth';
import { useClientData } from './useClientData';
import { useClientProjectLookup } from './useClientProjectLookup';
import type { FirebaseProject } from '../types/firebase';
import type { Project } from '../types';
import {
  transformFirebaseProjectToProject,
  filterProjectsByClient
} from '../utils/dataTransformers';

export const useClientSpecificData = () => {
  const { session, isAuthenticated, refreshKey } = useClientAuth();
  const { clientData } = useClientData(session?.clientId || null, refreshKey);
  const { projects: allProjects, loading: projectsLoading, error: projectsError } = useFirebaseProjects();

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


  // Get current project for the client - now their specific assigned project
  const currentProject = useMemo(() => {
    return clientProjectLookup.clientProject || null;
  }, [clientProjectLookup.clientProject]);

  // Loading state - include project lookup loading
  const loading = projectsLoading || clientProjectLookup.loading;

  // Error state - prioritize project assignment errors
  const error = clientProjectLookup.assignmentError || projectsError;

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


  // Search functionality
  const searchProjects = (query: string): Project[] => {
    const lowercaseQuery = query.toLowerCase();
    return clientProjects.filter(project =>
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.address.toLowerCase().includes(lowercaseQuery)
    );
  };


  return {
    // Authentication state
    isAuthenticated,
    clientInfo,

    // Data
    projects: clientProjects,
    currentProject,

    // Loading and error states
    loading,
    error,

    // Project assignment information
    hasProjectAssignment: clientProjectLookup.hasProjectAssignment,
    isValidProjectAssignment: clientProjectLookup.isValidAssignment,
    projectAssignmentError: clientProjectLookup.assignmentError,
    suggestedProjects: clientProjectLookup.suggestedProjects,

    // Utility functions
    searchProjects,
    getProjectAssignmentDiagnostics: clientProjectLookup.getAssignmentDiagnostics,

    // Raw data (for advanced use cases)
    rawProjects: allProjects,
    rawClientProject: clientProjectLookup.rawClientProject
  };
};