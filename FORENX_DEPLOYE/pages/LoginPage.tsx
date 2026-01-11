import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnimatedFeatureDisplay from '../components/AnimatedFeatureDisplay';
import { Fingerprint, Lock, User, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'password123') {
      sessionStorage.removeItem('welcomeMessagePlayed'); // Reset flag for new session
      login();
      // Pass a state flag to dashboard to trigger the popup
      navigate('/dashboard', { state: { showWelcome: true } });
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      
      {/* Right Panel - Info & Branding (Shows first on mobile) */}
      <div className="w-full lg:w-1/2 bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-12 text-center lg:order-2 border-b lg:border-b-0 lg:border-l border-slate-800">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[0%] left-[0%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
          <div className="p-6 bg-slate-800/50 rounded-full mb-8 border border-slate-700 shadow-2xl animate-pulse-fast">
            <Fingerprint size={80} className="text-cyan-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            India's First Generative AI Forensic Intelligence Platform
          </h1>
          <p className="text-slate-400 text-lg mb-12">
            ForenX understands, connects, and summarizes evidence to generate actionable intelligence and reveal hidden links between cases.
          </p>

          <AnimatedFeatureDisplay />
        </div>
      </div>

      {/* Left Panel - Login Form & Credentials (Shows second on mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative z-20 lg:order-1">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400">Please authenticate to access the secure portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Officer ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Secure Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-10 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

              <button 
                type="submit" 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.01]"
              >
                Authenticate
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-xs text-cyan-600 dark:text-cyan-400 text-center uppercase font-bold mb-3 tracking-widest">
                  Demo Credentials
                </p>
                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 mb-0.5">Username</span>
                    <span className="font-mono font-bold select-all">admin</span>
                  </div>
                  <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-400 mb-0.5">Password</span>
                    <span className="font-mono font-bold select-all">password123</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;