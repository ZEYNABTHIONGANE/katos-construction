/**
 * Test utilities to verify data synchronization between mobile client and backoffice
 * This file contains functions to test that Firebase data flows correctly between systems
 */

import { projectService } from '../services/projectService';
import { materialService } from '../services/materialService';
import { clientService } from '../services/clientService';
import type { FirebaseProject, FirebaseMaterial, FirebaseClient } from '../types/firebase';

/**
 * Test project data synchronization
 */
export const testProjectSync = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing project data synchronization...');

    // Test fetching projects
    const projects = await projectService.getProjects();
    console.log(`✅ Successfully fetched ${projects.length} projects from Firebase`);

    // Test project structure
    if (projects.length > 0) {
      const firstProject = projects[0];
      const requiredFields = ['id', 'name', 'description', 'images', 'type', 'createdAt'];

      for (const field of requiredFields) {
        if (!(field in firstProject)) {
          console.error(`❌ Missing required field: ${field}`);
          return false;
        }
      }

      console.log('✅ Project data structure is consistent');
    }

    return true;
  } catch (error) {
    console.error('❌ Project sync test failed:', error);
    return false;
  }
};

/**
 * Test material data synchronization
 */
export const testMaterialSync = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing material data synchronization...');

    // Test fetching materials
    const materials = await materialService.getMaterials();
    console.log(`✅ Successfully fetched ${materials.length} materials from Firebase`);

    // Test material structure
    if (materials.length > 0) {
      const firstMaterial = materials[0];
      const requiredFields = ['id', 'name', 'category', 'price', 'image', 'supplier', 'description', 'createdAt'];

      for (const field of requiredFields) {
        if (!(field in firstMaterial)) {
          console.error(`❌ Missing required field: ${field}`);
          return false;
        }
      }

      console.log('✅ Material data structure is consistent');

      // Test category grouping
      const categories = await materialService.getCategories();
      console.log(`✅ Materials grouped into ${categories.length} categories`);
    }

    return true;
  } catch (error) {
    console.error('❌ Material sync test failed:', error);
    return false;
  }
};

/**
 * Test client data synchronization
 */
export const testClientSync = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing client data synchronization...');

    // Test fetching clients
    const clients = await clientService.getClients();
    console.log(`✅ Successfully fetched ${clients.length} clients from Firebase`);

    // Test client structure
    if (clients.length > 0) {
      const firstClient = clients[0];
      const requiredFields = ['id', 'nom', 'prenom', 'email', 'localisationSite', 'projetAdhere', 'status', 'invitationStatus', 'createdAt'];

      for (const field of requiredFields) {
        if (!(field in firstClient)) {
          console.error(`❌ Missing required field: ${field}`);
          return false;
        }
      }

      console.log('✅ Client data structure is consistent');
    }

    return true;
  } catch (error) {
    console.error('❌ Client sync test failed:', error);
    return false;
  }
};

/**
 * Test real-time data listeners
 */
export const testRealTimeSync = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing real-time data synchronization...');

    return new Promise((resolve) => {
      let projectsReceived = false;
      let materialsReceived = false;

      // Test project real-time updates
      const unsubscribeProjects = projectService.subscribeToProjects((projects) => {
        console.log(`✅ Received ${projects.length} projects via real-time listener`);
        projectsReceived = true;

        if (materialsReceived) {
          unsubscribeProjects();
          unsubscribeMaterials();
          resolve(true);
        }
      });

      // Test material real-time updates
      const unsubscribeMaterials = materialService.subscribeToMaterials((materials) => {
        console.log(`✅ Received ${materials.length} materials via real-time listener`);
        materialsReceived = true;

        if (projectsReceived) {
          unsubscribeProjects();
          unsubscribeMaterials();
          resolve(true);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        unsubscribeProjects();
        unsubscribeMaterials();
        console.error('❌ Real-time sync test timed out');
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Real-time sync test failed:', error);
    return false;
  }
};

/**
 * Test data transformation utilities
 */
export const testDataTransformation = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing data transformation utilities...');

    const projects = await projectService.getProjects();
    const materials = await materialService.getMaterials();

    if (projects.length > 0) {
      // Import transformation functions
      const {
        transformFirebaseProjectToProject,
        transformFirebaseProjectToClientProject,
        calculateProjectProgress,
        getCurrentPhaseName
      } = await import('./dataTransformers');

      // Test project transformation
      const transformedProject = transformFirebaseProjectToProject(projects[0]);
      console.log('✅ Project transformation successful');

      // Test client project transformation
      const clientProject = transformFirebaseProjectToClientProject(projects[0]);
      console.log('✅ Client project transformation successful');

      // Test progress calculation
      const progress = calculateProjectProgress([]);
      console.log('✅ Progress calculation successful');

      // Test phase name generation
      const phaseName = getCurrentPhaseName(50);
      console.log('✅ Phase name generation successful');
    }

    if (materials.length > 0) {
      const { groupMaterialsByCategory, transformFirebaseMaterialToMaterial } = await import('./dataTransformers');

      // Test material transformation
      const transformedMaterial = transformFirebaseMaterialToMaterial(materials[0]);
      console.log('✅ Material transformation successful');

      // Test category grouping
      const categories = groupMaterialsByCategory(materials);
      console.log(`✅ Material category grouping successful: ${categories.length} categories`);
    }

    return true;
  } catch (error) {
    console.error('❌ Data transformation test failed:', error);
    return false;
  }
};

/**
 * Run all data synchronization tests
 */
export const runAllSyncTests = async (): Promise<void> => {
  console.log('🚀 Starting data synchronization tests...\n');

  const tests = [
    { name: 'Project Sync', test: testProjectSync },
    { name: 'Material Sync', test: testMaterialSync },
    { name: 'Client Sync', test: testClientSync },
    { name: 'Real-time Sync', test: testRealTimeSync },
    { name: 'Data Transformation', test: testDataTransformation }
  ];

  const results = [];

  for (const { name, test } of tests) {
    console.log(`\n📋 Running ${name} test...`);
    const success = await test();
    results.push({ name, success });
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');

  results.forEach(({ name, success }) => {
    console.log(`${success ? '✅' : '❌'} ${name}: ${success ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All data synchronization tests passed! The mobile app is ready to use real Firebase data.');
  } else {
    console.log('⚠️ Some tests failed. Please check the Firebase configuration and data structure.');
  }
};

/**
 * Quick verification that can be called from components
 */
export const quickDataVerification = async (): Promise<{ projects: number; materials: number; clients: number }> => {
  try {
    const [projects, materials, clients] = await Promise.all([
      projectService.getProjects(),
      materialService.getMaterials(),
      clientService.getClients()
    ]);

    return {
      projects: projects.length,
      materials: materials.length,
      clients: clients.length
    };
  } catch (error) {
    console.error('Quick data verification failed:', error);
    return { projects: 0, materials: 0, clients: 0 };
  }
};