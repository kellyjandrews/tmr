// app/dashboard/account/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';

export const metadata = {
  title: 'My Account | Dashboard',
  description: 'Manage your account settings',
};

export default async function AccountPage() {
  // Get the session server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile if available
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <DashboardPageWrapper pageName="My Account">
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Profile Information</h2>
          
          <div className="flex items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl mr-6">
              {(profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Profile Picture</p>
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900 mt-1">
                Change Avatar
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                name="name"
                type="text" 
                defaultValue={profile?.full_name || ''} 
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                name="email"
                defaultValue={user.email || ''} 
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
                name="bio"
                defaultValue={profile?.bio || ''} 
                placeholder="Tell us about yourself and your magical interests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 h-24"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button type="button" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
              Save Profile Changes
            </button>
          </div>
        </div>
        
        {/* Password Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Change Password</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input 
                type="password" 
                placeholder="Confirm your new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button type="button" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
              Update Password
            </button>
          </div>
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
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                Enable
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-red-600">Delete Account</h3>
                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
              </div>
              <button type="button" className="text-sm text-red-600 hover:text-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}