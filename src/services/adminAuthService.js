// adminAuthService.js - Admin Role Management
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * User roles in the system
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

/**
 * Fixed admin credentials (for demo purposes)
 * In production, use proper authentication
 */
export const FIXED_ADMIN = {
  email: 'fawzia@gmail.com',
  password: '123456',
  role: USER_ROLES.SUPER_ADMIN,
};

/**
 * Check if current user is admin
 */
export const isAdmin = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return false;

    // Check if current user is fixed admin
    const currentUserEmail = auth.currentUser?.email;
    if (currentUserEmail === FIXED_ADMIN.email) {
      return true;
    }

    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    return userData.role === USER_ROLES.ADMIN || userData.role === USER_ROLES.SUPER_ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if current user is super admin
 */
export const isSuperAdmin = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return false;

    // Check if current user is fixed admin
    const currentUserEmail = auth.currentUser?.email;
    if (currentUserEmail === FIXED_ADMIN.email) {
      return true;
    }

    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    return userData.role === USER_ROLES.SUPER_ADMIN;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

/**
 * Get user role
 */
export const getUserRole = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return USER_ROLES.USER;

    // Check if current user is fixed admin
    const currentUserEmail = auth.currentUser?.email;
    if (currentUserEmail === FIXED_ADMIN.email) {
      return USER_ROLES.SUPER_ADMIN;
    }

    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) return USER_ROLES.USER;

    const userData = userDoc.data();
    return userData.role || USER_ROLES.USER;
  } catch (error) {
    console.error('Error getting user role:', error);
    return USER_ROLES.USER;
  }
};

/**
 * Set user role (Super Admin only)
 */
export const setUserRole = async (userId, newRole) => {
  try {
    // Check if current user is super admin
    const currentUserIsSuperAdmin = await isSuperAdmin();
    
    if (!currentUserIsSuperAdmin) {
      throw new Error('Only Super Admins can modify user roles');
    }

    // Validate role
    if (!Object.values(USER_ROLES).includes(newRole)) {
      throw new Error('Invalid role');
    }

    // Update user role
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      roleUpdatedAt: new Date().toISOString(),
      roleUpdatedBy: auth.currentUser.uid,
    });

    console.log(`✅ User ${userId} role updated to ${newRole}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

/**
 * Initialize user with default role
 */
export const initializeUserRole = async (userId, email) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      // Create new user document with default role
      await setDoc(doc(db, 'users', userId), {
        email,
        role: USER_ROLES.USER,
        createdAt: new Date().toISOString(),
      });
    } else {
      // If user exists but has no role, set default role
      const userData = userDoc.data();
      if (!userData.role) {
        await updateDoc(doc(db, 'users', userId), {
          role: USER_ROLES.USER,
        });
      }
    }
  } catch (error) {
    console.error('Error initializing user role:', error);
  }
};

/**
 * Get all admin users
 */
export const getAllAdmins = async () => {
  try {
    const adminsQuery = query(
      collection(db, 'users'),
      where('role', 'in', [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    );

    const snapshot = await getDocs(adminsQuery);
    const admins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return admins;
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
};

/**
 * Require admin authentication (use in components)
 */
export const requireAdmin = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Authentication required');
  }

  const adminStatus = await isAdmin(currentUser.uid);
  
  if (!adminStatus) {
    throw new Error('Admin access required');
  }

  return true;
};

/**
 * Create initial super admin (run once during setup)
 */
export const createSuperAdmin = async (email) => {
  try {
    // Find user by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );

    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      throw new Error('User not found with this email');
    }

    const userId = snapshot.docs[0].id;
    
    // Set as super admin
    await updateDoc(doc(db, 'users', userId), {
      role: USER_ROLES.SUPER_ADMIN,
      roleUpdatedAt: new Date().toISOString(),
    });

    console.log(`✅ Super Admin created for ${email}`);
    return { success: true, userId };
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
};
