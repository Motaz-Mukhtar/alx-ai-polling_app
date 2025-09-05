import AuthForm from '@/components/AuthForm';

export default async function Login() {
  // Server-side redirects are now handled by middleware
  // This prevents redirect loops by letting middleware handle auth state
  // We've simplified this page to avoid redirect loops
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white"></div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md z-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Welcome to Polling App</h1>
        <AuthForm isSignup={false} />
      </div>
    </div>
  );
}
