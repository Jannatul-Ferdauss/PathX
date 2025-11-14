// makeAdmin.js - Helper script to make a user admin
// Run this script in the browser console while logged in

import { createSuperAdmin } from './services/adminAuthService';

/**
 * Make the current logged-in user a Super Admin
 * Open browser console and run: makeCurrentUserAdmin()
 */
window.makeCurrentUserAdmin = async () => {
  const { auth } = await import('./firebase');
  const { setDoc, doc } = await import('firebase/firestore');
  const { db } = await import('./firebase');
  
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is logged in');
    return;
  }
  
  try {
    const { getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists()) {
      // Create user document
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        roleUpdatedAt: new Date().toISOString(),
      });
    } else {
      // Update existing user
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'super_admin',
        roleUpdatedAt: new Date().toISOString(),
      });
    }
    
    console.log('✅ User', currentUser.email, 'is now a Super Admin!');
    console.log('🔄 Please refresh the page to see the changes');
    console.log('🔗 Navigate to /admin to access the admin dashboard');
  } catch (error) {
    console.error('❌ Error making user admin:', error);
  }
};

/**
 * Make any user admin by email (requires super admin privileges)
 */
window.makeUserAdminByEmail = async (email) => {
  const { createSuperAdmin } = await import('./services/adminAuthService');
  
  try {
    await createSuperAdmin(email);
    console.log('✅ User', email, 'is now a Super Admin!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

console.log('🔧 Admin Helper Functions Loaded:');
console.log('- makeCurrentUserAdmin() - Make current logged-in user a super admin');
console.log('- makeUserAdminByEmail(email) - Make any user admin by email');
