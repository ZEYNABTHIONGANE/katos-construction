import { chantierService } from '../services/chantierService';
import { clientService } from '../services/clientService';

// Fonction de diagnostic pour les chantiers
export const diagnosticChantiers = async () => {
  console.log('🔍 === DIAGNOSTIC CHANTIERS ===');

  try {
    // 1. Lister tous les chantiers
    console.log('\n📋 1. Récupération de tous les chantiers...');
    const allChantiers = await chantierService.getAllChantiers();
    console.log(`   Nombre total de chantiers: ${allChantiers.length}`);

    if (allChantiers.length > 0) {
      console.log('\n   Détails des chantiers:');
      allChantiers.forEach((chantier, index) => {
        console.log(`   ${index + 1}. ID: ${chantier.id}`);
        console.log(`      - Nom: ${chantier.name}`);
        console.log(`      - Client ID: ${chantier.clientId}`);
        console.log(`      - Chef ID: ${chantier.assignedChefId}`);
        console.log(`      - Status: ${chantier.status}`);
        console.log(`      - Adresse: ${chantier.address}`);
        console.log('      ---');
      });
    }

    // 2. Lister tous les clients
    console.log('\n👥 2. Récupération de tous les clients...');
    const allClients = await clientService.getClients();
    console.log(`   Nombre total de clients: ${allClients.length}`);

    if (allClients.length > 0) {
      console.log('\n   Détails des clients:');
      allClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ID: ${client.id}`);
        console.log(`      - Nom: ${client.prenom} ${client.nom}`);
        console.log(`      - Email: ${client.email}`);
        console.log(`      - User ID: ${client.userId || 'NON DÉFINI'}`);
        console.log(`      - Status: ${client.status}`);
        console.log(`      - Invitation Status: ${client.invitationStatus}`);
        console.log('      ---');
      });
    }

    // 3. Analyser les correspondances
    console.log('\n🔗 3. Analyse des correspondances Client <-> Chantier...');

    if (allChantiers.length > 0 && allClients.length > 0) {
      allChantiers.forEach((chantier) => {
        const matchingClient = allClients.find(client => client.id === chantier.clientId);
        if (matchingClient) {
          console.log(`✅ Chantier "${chantier.name}" -> Client "${matchingClient.prenom} ${matchingClient.nom}"`);
          console.log(`   Chantier.clientId: ${chantier.clientId}`);
          console.log(`   Client.id: ${matchingClient.id}`);
          console.log(`   Client.userId: ${matchingClient.userId || 'NON DÉFINI'}`);

          if (!matchingClient.userId) {
            console.log(`   ⚠️  PROBLÈME: Client sans userId - impossible d'accéder au chantier`);
          }
        } else {
          console.log(`❌ Chantier "${chantier.name}" -> AUCUN CLIENT TROUVÉ (clientId: ${chantier.clientId})`);
        }
      });
    }

    console.log('\n🏁 === FIN DU DIAGNOSTIC ===');

  } catch (error) {
    console.error('❌ Erreur durant le diagnostic:', error);
  }
};