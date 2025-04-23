import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, loginUser } from '../store/userSlice';
import Navbar from './Navbar'; 
 
const SignInPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fixed selectors to properly use useSelector
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const isLoading = useSelector((state) => state.user.loading);
  const error = useSelector((state) => state.user.error);
  const user = useSelector((state) => state.user.user);

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Show success toast only when user logs in (not on initial load)
      if (user) {
        toast.success(`Welcome back, ${user.name || 'User'}!`);
      }
      navigate('/');
    }
  }, [isAuthenticated, navigate, user]);
  
  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
    if (errorParam) {
      toast.error(errorParam);
    }
    
    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [location, dispatch]);
  
  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs before sending
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      // Dispatch login action but don't navigate immediately
      await dispatch(loginUser(formData)).unwrap();
      
      // Navigation will happen in the useEffect when isAuthenticated becomes true
      // This prevents us from navigating before the redux state is updated
    } catch (err) {
      // Error is already handled in the useEffect for error state
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Card Container */}
      <div className="relative z-10 w-full min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="absolute w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 opacity-30 blur-[50px] sm:blur-[75px] lg:blur-[100px]" />
        
        <div className="relative p-[2px] rounded-lg bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600">
          <div className="bg-black rounded-lg p-6 sm:p-8 w-full max-w-[90vw] sm:w-80 md:w-96 lg:w-[450px] h-auto min-h-[400px] flex flex-col justify-center shadow-xl">
            <h2 className="text-2xl font-serif text-white text-center mb-6">Sign In</h2>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email/Username"
                  className="w-full px-4 py-2 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-2 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 text-gray-400 bg-black">or continue with</span>
              </div>
            </div>

            <div className="mt-4 text-center space-y-2">
              <p className="text-white text-sm">
                New User?{' '}
                <a href="/signup" className="text-cyan-300 hover:text-cyan-200">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;