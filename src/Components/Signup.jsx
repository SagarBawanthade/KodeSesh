import React, { useState } from 'react';
import Navbar from './Navbar'; // Import the Navbar component
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
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

    // Additional validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare the payload
      const payload = {
        name: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      console.log('Sending payload:', payload); // Debug log

      // Make API request to register endpoint
      const response = await axios.post('https://kodesesh-server.onrender.com/api/auth/register', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Registration response:', response.data); // Debug log

      // Handle successful registration
      setSuccess('Registration successful! Redirecting to login...');
      toast.success('Registration successful!');
      
      // Store token if needed
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      navigate('/signin'); // Redirect to sign-in page
      
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      
      // Handle registration errors
      if (error.response) {
        // Server responded with error status
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(`Registration failed: ${error.response.status}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.log('No response received:', error.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        console.log('Error message:', error.message);
        setError('An unexpected error occurred. Please try again.');
      }
      
      toast.error('Registration failed. Please try again.');
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
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}
            
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