import { FirebaseClient, FirebaseProject } from '../types/firebase';

/**
 * Service for managing client-specific project relationships
 * Handles matching clients to their assigned projects through the projetAdhere field
 */
export class ClientProjectService {

  /**
   * Find a client's specific project based on their projetAdhere field
   * Uses fuzzy matching to handle minor discrepancies in project names
   */
  static findClientProject(
    clientData: FirebaseClient,
    allProjects: FirebaseProject[]
  ): FirebaseProject | null {
    if (!clientData?.projetAdhere || !allProjects.length) {
      return null;
    }

    const targetProjectName = clientData.projetAdhere.toLowerCase().trim();

    // First, try exact match
    let matchedProject = allProjects.find(
      project => project.name.toLowerCase().trim() === targetProjectName
    );

    if (matchedProject) {
      return matchedProject;
    }

    // If no exact match, try fuzzy matching
    matchedProject = this.fuzzyMatchProject(targetProjectName, allProjects);

    return matchedProject;
  }

  /**
   * Fuzzy match project names to handle minor differences
   */
  private static fuzzyMatchProject(
    targetName: string,
    projects: FirebaseProject[]
  ): FirebaseProject | null {
    const targetWords = targetName.split(/\s+/).filter(word => word.length > 2);

    if (targetWords.length === 0) {
      return null;
    }

    let bestMatch: { project: FirebaseProject; score: number } | null = null;

    for (const project of projects) {
      const projectWords = project.name.toLowerCase().split(/\s+/);
      let matchCount = 0;

      // Count how many target words are found in project name
      for (const targetWord of targetWords) {
        if (projectWords.some(projectWord =>
          projectWord.includes(targetWord) || targetWord.includes(projectWord)
        )) {
          matchCount++;
        }
      }

      const score = matchCount / targetWords.length;

      // Consider it a match if at least 60% of words match
      if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { project, score };
      }
    }

    return bestMatch?.project || null;
  }

  /**
   * Get all projects that could potentially match a client's projetAdhere
   * Useful for debugging or admin interfaces
   */
  static getPotentialMatches(
    clientData: FirebaseClient,
    allProjects: FirebaseProject[]
  ): Array<{ project: FirebaseProject; matchType: 'exact' | 'fuzzy' | 'partial'; score: number }> {
    if (!clientData?.projetAdhere || !allProjects.length) {
      return [];
    }

    const targetProjectName = clientData.projetAdhere.toLowerCase().trim();
    const matches: Array<{ project: FirebaseProject; matchType: 'exact' | 'fuzzy' | 'partial'; score: number }> = [];

    for (const project of allProjects) {
      const projectName = project.name.toLowerCase().trim();

      // Exact match
      if (projectName === targetProjectName) {
        matches.push({ project, matchType: 'exact', score: 1.0 });
        continue;
      }

      // Fuzzy match
      const targetWords = targetProjectName.split(/\s+/).filter(word => word.length > 2);
      const projectWords = projectName.split(/\s+/);

      let matchCount = 0;
      for (const targetWord of targetWords) {
        if (projectWords.some(projectWord =>
          projectWord.includes(targetWord) || targetWord.includes(projectWord)
        )) {
          matchCount++;
        }
      }

      const score = targetWords.length > 0 ? matchCount / targetWords.length : 0;

      if (score >= 0.6) {
        matches.push({ project, matchType: 'fuzzy', score });
      } else if (score > 0) {
        matches.push({ project, matchType: 'partial', score });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Validate that a client has a valid project assignment
   */
  static validateClientProjectAssignment(
    clientData: FirebaseClient,
    allProjects: FirebaseProject[]
  ): {
    isValid: boolean;
    hasProjectAssignment: boolean;
    projectFound: boolean;
    matchedProject?: FirebaseProject;
    suggestions?: FirebaseProject[];
  } {
    const hasProjectAssignment = Boolean(clientData?.projetAdhere?.trim());

    if (!hasProjectAssignment) {
      return {
        isValid: false,
        hasProjectAssignment: false,
        projectFound: false
      };
    }

    const matchedProject = this.findClientProject(clientData, allProjects);
    const projectFound = Boolean(matchedProject);

    const result = {
      isValid: projectFound,
      hasProjectAssignment: true,
      projectFound,
      matchedProject: projectFound ? matchedProject : undefined
    };

    // If no project found, provide suggestions
    if (!projectFound) {
      const potentialMatches = this.getPotentialMatches(clientData, allProjects);
      return {
        ...result,
        suggestions: potentialMatches
          .filter(match => match.score > 0.3)
          .slice(0, 3)
          .map(match => match.project)
      };
    }

    return result;
  }
}

export const clientProjectService = ClientProjectService;