// app/dashboard/messages/page.tsx
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';

export const metadata = {
  title: 'Messages | Dashboard',
  description: 'View and manage your messages',
};

export default async function MessagesPage() {
  return (
    <DashboardPageWrapper pageName="Messages">
      <div className="bg-white rounded-lg shadow-sm p-6 h-[calc(100vh-180px)]">
        <div className="flex h-full">
          {/* Message List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 pr-4 overflow-y-auto">
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            {/* Message threads */}
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 rounded-md cursor-pointer">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-purple-900">Aurora Nightshade</h3>
                  <span className="text-xs text-gray-500">2d ago</span>
                </div>
                <p className="text-sm text-gray-600 truncate">Is the Phoenix Feather Wand still available?</p>
              </div>
              
              <div className="p-3 hover:bg-gray-50 rounded-md cursor-pointer">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900">Merlin Wizard</h3>
                  <span className="text-xs text-gray-500">1w ago</span>
                </div>
                <p className="text-sm text-gray-600 truncate">Thank you for the quick delivery!</p>
              </div>
              
              <div className="p-3 hover:bg-gray-50 rounded-md cursor-pointer">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900">Gandalf Greyhame</h3>
                  <span className="text-xs text-gray-500">2w ago</span>
                </div>
                <p className="text-sm text-gray-600 truncate">Do you have any dragon scale items?</p>
              </div>
            </div>
          </div>
          
          {/* Message Content */}
          <div className="w-2/3 pl-4 flex flex-col">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-purple-900">Aurora Nightshade</h2>
              <p className="text-sm text-gray-600">Last active: 2 hours ago</p>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              <div className="flex justify-end">
                <div className="bg-purple-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-800">Hello! I&apos;m interested in your listing for the Crystal Ball.</p>
                  <span className="text-xs text-gray-500 block mt-1 text-right">3 days ago</span>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-800">Hi there! Yes, the Crystal Ball is still available. Did you have any questions about it?</p>
                  <span className="text-xs text-gray-500 block mt-1">3 days ago</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="bg-purple-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-800">Is the Phoenix Feather Wand still available?</p>
                  <span className="text-xs text-gray-500 block mt-1 text-right">2 days ago</span>
                </div>
              </div>
            </div>
            
            <div className="mt-auto">
              <div className="flex">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button type="button" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}