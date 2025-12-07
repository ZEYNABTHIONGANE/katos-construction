/**
 * Test script to verify client status synchronization between mobile app and backoffice
 * This file can be used to manually test the status update functionality
 */

import { clientService } from '../services/clientService';
import { authService } from '../services/authService';

/**
 * Test function to verify client status update after login
 */
export const testClientStatusUpdate = async (email: string): Promise<void> => {
  try {
    console.log('=== Testing Client Status Update ===');
    console.log('Email:', email);

    // 1. Find client by email before update
    const clientBefore = await clientService.getClientByEmail(email);
    if (!clientBefore) {
      console.error('❌ No client found for email:', email);
      return;
    }

    console.log('📋 Client status before update:', {
      id: clientBefore.id,
      email: clientBefore.email,
      status: clientBefore.status,
      invitationStatus: clientBefore.invitationStatus,
      acceptedAt: clientBefore.acceptedAt?.toDate().toISOString() || 'null'
    });

    // 2. Test the invitation status update
    const updateResult = await clientService.acceptClientInvitationByEmail(email);
    console.log('🔄 Update result:', updateResult);

    // 3. Find client by email after update
    const clientAfter = await clientService.getClientByEmail(email);
    if (!clientAfter) {
      console.error('❌ No client found after update for email:', email);
      return;
    }

    console.log('📋 Client status after update:', {
      id: clientAfter.id,
      email: clientAfter.email,
      status: clientAfter.status,
      invitationStatus: clientAfter.invitationStatus,
      acceptedAt: clientAfter.acceptedAt?.toDate().toISOString() || 'null'
    });

    // 4. Verify the update
    if (clientBefore.invitationStatus === 'pending' && clientAfter.invitationStatus === 'accepted') {
      console.log('✅ Invitation status successfully updated from pending to accepted');
    } else if (clientAfter.invitationStatus === 'accepted') {
      console.log('✅ Invitation status already accepted (expected for subsequent logins)');
    } else {
      console.error('❌ Invitation status update failed - unexpected state');
    }

    // 5. Verify project status update
    if (clientAfter.status === 'En cours') {
      console.log('✅ Project status set to "En cours" (active project)');
    } else {
      console.log('ℹ️ Project status:', clientAfter.status);
    }

    console.log('=== Test Complete ===');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

/**
 * Helper function to test the full login flow with status update
 */
export const testFullLoginFlow = async (username: string, password: string): Promise<void> => {
  try {
    console.log('=== Testing Full Login Flow ===');
    console.log('Username:', username);

    // 1. Get email from username
    const email = await authService.getUserEmailByUsername(username);
    if (!email) {
      console.error('❌ No email found for username:', username);
      return;
    }

    console.log('📧 Resolved email:', email);

    // 2. Test client status before login
    await testClientStatusUpdate(email);

    // 3. Perform login (this should trigger status update)
    console.log('🔐 Performing login...');
    const user = await authService.signInWithUsername(username, password);
    console.log('✅ Login successful for user:', user.uid);

    // 4. Test client status after login
    await testClientStatusUpdate(email);

    console.log('=== Full Login Flow Test Complete ===');
  } catch (error) {
    console.error('❌ Full login flow test failed:', error);
  }
};