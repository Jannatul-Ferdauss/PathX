// setupAdmin.js - Quick Admin Setup Script
// Import this in your browser console to set up admin access

/**
 * Quick setup function - Run this in browser console after logging in
 * Usage: In browser console, paste this entire file and run setupAdminAccess()
 */
async function setupAdminAccess() {
  console.log('🚀 Starting Admin Setup...');
  
  try {
    // Dynamically import Firebase modules
    const { auth, db } = await import('./firebase');
    const { doc, setDoc, getDoc } = await import('firebase/firestore');
    
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ ERROR: No user is logged in!');
      console.log('📝 Please login first, then run this script again.');
      return;
    }
    
    console.log('👤 Current User:', currentUser.email);
    
    // Check if user document exists
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document with super_admin role
      await setDoc(userRef, {
        email: currentUser.email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        roleUpdatedAt: new Date().toISOString(),
      });
      console.log('✅ Created new user document with Super Admin role');
    } else {
      // Update existing user document
      await setDoc(userRef, {
        ...userDoc.data(),
        role: 'super_admin',
        roleUpdatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log('✅ Updated existing user to Super Admin role');
    }
    
    console.log('');
    console.log('🎉 SUCCESS! You are now a Super Admin!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Refresh this page (F5)');
    console.log('2. Navigate to: /admin');
    console.log('3. Configure your API keys (Gemini/OpenRouter)');
    console.log('');
    console.log('📚 For detailed instructions, see: ADMIN_SETUP_GUIDE.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('- Make sure you are logged in');
    console.log('- Check Firebase connection');
    console.log('- Verify Firestore permissions');
    console.log('- See ADMIN_SETUP_GUIDE.md for more help');
  }
}

// Instructions
console.log('═══════════════════════════════════════════');
console.log('🔧 PathX Admin Setup Helper');
console.log('═══════════════════════════════════════════');
console.log('');
console.log('To set up admin access, run:');
console.log('  setupAdminAccess()');
console.log('');
console.log('Make sure you are logged in first!');
console.log('═══════════════════════════════════════════');

// Export for use
if (typeof window !== 'undefined') {
  window.setupAdminAccess = setupAdminAccess;
}

export { setupAdminAccess };
