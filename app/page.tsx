// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Welcome to MyApp</h1>
          <p className="mt-3 text-lg text-gray-600">
            A simple application with user authentication
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link 
            href="/login" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create an Account
          </Link>
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Built with NextJS 15.1, TypeScript, Tailwind CSS, and Supabase
          </p>
        </div>
      </div>
    </div>
  );
}