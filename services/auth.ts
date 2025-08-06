import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Failed to sign out:', error);
    throw error;
  }
};

/**
 * Signs in a user with email and password
 */
export const login = async (email: string, password: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logger.error('Login error:', error);
      throw error;
    }
    
    logger.info('User logged in successfully');
  } catch (error) {
    logger.error('Failed to login:', error);
    throw error;
  }
};

/**
 * Gets the current user session
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
    
    return user;
  } catch (error) {
    logger.error('Failed to get current user:', error);
    throw error;
  }
};