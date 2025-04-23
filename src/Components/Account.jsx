import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { toast } from 'react-toastify';

const colorOptions = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-teal-500', 'bg-rose-500',
];

const Account = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileBg, setProfileBg] = useState('');
  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [originalUser, setOriginalUser] = useState({});

  useEffect(() => {
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setProfileBg(randomColor);
    
    // Try to initialize user from localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setUser({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
        });
        setOriginalUser({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      // Get the user object from localStorage and parse it
      const userString = localStorage.getItem('user');
      if (!userString) {
        toast.error('Please login to view account details');
        setIsLoading(false);
        return;
      }
      
      const userData = JSON.parse(userString);
      const userId = userData._id;
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        toast.error('Please login to view account details');
        setIsLoading(false);
        return;
      }

      // Use the correct API endpoint based on your server routes
      const response = await axios.get(`http://localhost:5000/api/auth/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const responseData = response.data.data;
        setUser({
          name: responseData.name,
          email: responseData.email,
          password: '', // Password is never returned from the API for security
        });
        setOriginalUser({
          name: responseData.name,
          email: responseData.email,
          password: '', 
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch user details');
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleSubmit();
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      // Get the user object from localStorage and parse it
      const userString = localStorage.getItem('user');
      if (!userString) {
        toast.error('Please login to update account details');
        setIsLoading(false);
        return;
      }
      
      const userData = JSON.parse(userString);
      const userId = userData._id;
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        toast.error('Please login to update account details');
        setIsLoading(false);
        return;
      }

      // Only send fields that have changed
      const updateData = {};
      if (user.name !== originalUser.name) updateData.name = user.name;
      if (user.email !== originalUser.email) updateData.email = user.email;
      if (user.password) updateData.password = user.password;

      // If nothing changed, just exit edit mode
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      // Use the correct API endpoint based on your server routes
      const response = await axios.put(`http://localhost:5000/api/auth/user/${userId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const responseData = response.data.data;
        setUser({
          name: responseData.name,
          email: responseData.email,
          password: '', // Clear password field after update
        });
        setOriginalUser({
          name: responseData.name,
          email: responseData.email,
          password: '',
        });
        
        // Update the user in localStorage
        const updatedUserData = {
          ...userData,
          name: responseData.name,
          email: responseData.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating user details:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUser({...originalUser});
    setIsEditing(false);
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
    : '';

  return (
    <>
      {/* Navbar */}
      <Navbar />
  
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
        <div className="relative max-w-3xl w-full">
          {/* Glow Aura + Border */}
          <div className="absolute inset-0 rounded-3xl z-0">
            {/* Glow Layer */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 blur-3xl opacity-40"></div>
            {/* Gradient Border Layer */}
            <div className="absolute inset-0 rounded-3xl p-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600"></div>
          </div>

          {/* Gradient border container */}
          <div className="relative rounded-3xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 p-[1px]">
            {/* Main Card */}
            <div className="relative z-10 bg-slate-950 rounded-3xl p-8 backdrop-blur-md shadow-xl border border-transparent">
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${profileBg}`}>
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">{user.name}</h2>
                      <p className="text-gray-400">{user.email}</p>
                    </div>
                  </div>

                  {/* Editable Info */}
                  <div className="space-y-4 mt-8">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 capitalize">Name</label>
                      <input
                        name="name"
                        type="text"
                        value={user.name}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className={`w-full p-2 rounded-lg bg-gray-700 text-white ${
                          isEditing
                            ? 'focus:outline-none focus:ring-2 focus:ring-cyan-500'
                            : 'opacity-70 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 capitalize">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={user.email}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className={`w-full p-2 rounded-lg bg-gray-700 text-white ${
                          isEditing
                            ? 'focus:outline-none focus:ring-2 focus:ring-cyan-500'
                            : 'opacity-70 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 capitalize">Password</label>
                      <input
                        name="password"
                        type="password"
                        value={user.password}
                        placeholder={isEditing ? "Enter new password to change" : "••••••••"}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className={`w-full p-2 rounded-lg bg-gray-700 text-white ${
                          isEditing
                            ? 'focus:outline-none focus:ring-2 focus:ring-cyan-500'
                            : 'opacity-70 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-8 flex justify-between items-center">
                    <button
                      onClick={handleEditToggle}
                      className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : isEditing ? 'Save Changes' : 'Edit Info'}
                    </button>

                    {isEditing && (
                      <button
                        onClick={handleCancel}
                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;