'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, ProfileUpdateFormData, PasswordChangeFormData } from '@/types/user';

type AccountFormProps = {
  initialProfile: UserProfile;
};

export default function AccountForm({ initialProfile }: AccountFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileUpdateFormData>({
    full_name: initialProfile.full_name || '',
    bio: initialProfile.bio || '',
    avatar_url: initialProfile.avatar_url || '',
  });
  const [passwordData, setPasswordData] = useState<PasswordChangeFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState<boolean>(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProfileSaving, setIsProfileSaving] = useState<boolean>(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle notifications toggle
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };

  // Validate profile form
  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Add validation as needed
    if (profile.full_name && profile.full_name.length > 100) {
      newErrors.full_name = 'Name must be less than 100 characters';
    }
    
    if (profile.bio && profile.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    return newErrors;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateProfileForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsProfileSaving(true);
    setSuccessMessage(null);
    
    try {
      // Import the updateProfile action
      const { updateUserProfile } = await import('@/actions/account');
      
      const result = await updateUserProfile(profile);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      setSuccessMessage('Profile updated successfully');
      router.refresh(); // Refresh the page data
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({
        form: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validatePasswordForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsPasswordSaving(true);
    setSuccessMessage(null);
    
    try {
      // Import the updatePassword action
      const { updateUserPassword } = await import('@/actions/account');
      
      const result = await updateUserPassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSuccessMessage('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      setErrors({
        passwordForm: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Profile Information</h2>
        
        <form onSubmit={handleProfileSubmit}>
          <div className="flex items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl mr-6">
              {(profile.full_name?.charAt(0) || initialProfile.email?.charAt(0) || 'U').toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Profile Picture</p>
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900 mt-1">
                Change Avatar
              </button>
            </div>
          </div>
          
          {errors.form && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.form}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text" 
                value={profile.full_name || ''} 
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                id="email"
                value={initialProfile.email || ''} 
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea 
                id="bio"
                name="bio"
                value={profile.bio || ''} 
                onChange={handleProfileChange}
                placeholder="Tell us about yourself and your magical interests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 h-24"
              />
              {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              disabled={isProfileSaving}
            >
              {isProfileSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Change Password</h2>
        
        <form onSubmit={handlePasswordSubmit}>
          {errors.passwordForm && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.passwordForm}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input 
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input 
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input 
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              disabled={isPasswordSaving}
            >
              {isPasswordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Account Management Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Account Management</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive updates about your account and orders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={handleNotificationsToggle}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button 
              type="button" 
              className="text-sm text-purple-700 hover:text-purple-900"
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-red-600">Delete Account</h3>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <button 
              type="button" 
              className="text-sm text-red-600 hover:text-red-700"
              onClick={() => {
                // Handle delete account confirmation
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Call delete account action
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}