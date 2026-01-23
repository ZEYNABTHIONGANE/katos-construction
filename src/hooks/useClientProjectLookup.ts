import { useState, useEffect, useMemo } from 'react';
import { useFirebaseProjects } from './useFirebaseProjects';
import { useClientData } from './useClientData';
import { getClientSpecificProject, transformFirebaseProjectToProject } from '../utils/dataTransformers';
import type { FirebaseProject, FirebaseClient } from '../types/firebase';
import type { Project } from '../types';

export interface ClientProjectLookupState {
  // Core data
  clientProject: Project | null;
  rawClientProject: FirebaseProject | null;
  clientData: FirebaseClient | null;

  // Project assignment status
  hasProjectAssignment: boolean;
  isValidAssignment: boolean;
  assignmentError: string | null;

  // Suggested projects for debugging/admin
  suggestedProjects: FirebaseProject[];

  // Loading and error states
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing client-specific project lookup and validation
 * Handles the relationship between client's projetAdhere field and actual projects
 */
export const useClientProjectLookup = (clientId: string | null) => {
  const { projects: allProjects, loading: projectsLoading, error: projectsError } = useFirebaseProjects();
  const { clientData, loading: clientLoading, error: clientError } = useClientData(clientId);

  const [state, setState] = useState<Omit<ClientProjectLookupState, 'loading' | 'error'>>({
    clientProject: null,
    rawClientProject: null,
    clientData: null,
    hasProjectAssignment: false,
    isValidAssignment: false,
    assignmentError: null,
    suggestedProjects: []
  });

  // Compute client's specific project when data changes
  const clientProjectInfo = useMemo(() => {
    if (!clientData || !allProjects.length) {
      return {
        project: null,
        hasAssignment: false,
        isValid: false,
        error: 'En attente des données...',
        suggestions: []
      };
    }

    return getClientSpecificProject(allProjects, clientData);
  }, [clientData, allProjects]);

  // Update state when project info changes
  useEffect(() => {
    const { project, hasAssignment, isValid, error, suggestions = [] } = clientProjectInfo;

    setState({
      clientProject: project ? transformFirebaseProjectToProject(project) : null,
      rawClientProject: project,
      clientData,
      hasProjectAssignment: hasAssignment,
      isValidAssignment: isValid,
      assignmentError: error,
      suggestedProjects: suggestions
    });
  }, [clientProjectInfo, clientData]);

  // Computed loading and error states
  const loading = projectsLoading || clientLoading;
  const error = projectsError || clientError;

  // Debugging utilities
  const getAssignmentDiagnostics = () => {
    if (!clientData) {
      return {
        clientId: clientId || 'N/A',
        projetAdhere: 'N/A',
        availableProjects: allProjects.map(p => p.name),
        diagnosis: 'Client data not loaded'
      };
    }

    return {
      clientId: clientId || 'N/A',
      projetAdhere: clientData.projetAdhere || 'No project assigned',
      availableProjects: allProjects.map(p => p.name),
      suggestedProjects: state.suggestedProjects.map(p => p.name),
      diagnosis: state.assignmentError || 'Assignment valid'
    };
  };

  // Force refresh of data
  const refreshAssignment = async () => {
    // This will trigger re-computation through the data hooks
    // Could add additional refresh logic here if needed
  };

  return {
    ...state,
    loading,
    error,

    // Utility methods
    getAssignmentDiagnostics,
    refreshAssignment,

    // Computed properties
    isReady: !loading && !error,
    hasValidProject: !loading && !error && state.isValidAssignment,
    needsProjectAssignment: !loading && !error && !state.hasProjectAssignment,
    hasInvalidProject: !loading && !error && state.hasProjectAssignment && !state.isValidAssignment
  } as ClientProjectLookupState & {
    getAssignmentDiagnostics: () => any;
    refreshAssignment: () => Promise<void>;
    isReady: boolean;
    hasValidProject: boolean;
    needsProjectAssignment: boolean;
    hasInvalidProject: boolean;
  };
};