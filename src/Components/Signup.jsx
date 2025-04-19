import React, { useState } from 'react';
import Navbar from './Navbar'; // Import the Navbar component
import axios from 'axios';
import { toast } from 'react-toastify';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      // Make API request to register endpoint
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Handle successful registration
      setSuccess('Registration successful! Redirecting to login...');
       toast.success('Registration successful:', response.data);
      
      // Store token if needed
      localStorage.setItem('token', response.data.token);
      
      setTimeout(() => {
        window.location.href = '/signin';
      }, 2000);
      
    } catch (error) {
      // Handle registration errors
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Registration failed');
      } else {
        setError('Network error. Please try again later.');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Add Inter font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}
      </style>

      {/* Navbar */}
      <Navbar />

      {/* Card Container */}
      <div className="relative z-10 w-full min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        {/* Gradient Background Square */}
        <div className="absolute w-[200px] sm:w-[450px] lg:w-[550px] h-[200px] sm:h-[450px] lg:h-[550px] bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 opacity-30 blur-[50px] sm:blur-[80px] lg:blur-[110px]" />
        
        {/* Card with gradient border */}
        <div className="relative p-[2px] rounded-lg bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600 w-full max-w-[90vw] sm:w-96 md:w-[420px]">
          <div className="bg-black rounded-lg p-4 sm:p-6 w-full shadow-xl">
            <h2 className="text-xl sm:text-2xl font-serif text-white text-center mb-4 sm:mb-6 tracking-tight">Create Account</h2>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full px-3 py-2 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full px-3 py-2 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm sm:text-base"
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
                  className="w-full px-3 py-2 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full px-3 py-2 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm sm:text-base"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition duration-200 font-semibold shadow-lg hover:shadow-cyan-500/25 text-sm font-serif sm:text-base ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>

            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 text-gray-400 bg-black">or continue with</span>
              </div>
            </div>

         
            {/* <div className="flex gap-3 sm:gap-4 px-2 sm:px-0">
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105 hover:shadow-gray-700/30"
              >
             
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105 hover:shadow-gray-700/30"
              >
            
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div> */}

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-gray-400 text-xs sm:text-sm">
                Already have an account?{' '}
                <a href="/signin" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;