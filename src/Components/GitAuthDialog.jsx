// components/GitAuthDialog.jsx
import React, { useState } from 'react';
import GitHubService from '../service/GitHubService.js';

const GitAuthDialog = ({ isOpen, onClose, addToTerminal }) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (!isOpen) return null;
  
  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!token || !owner || !repo) {
        setError('All fields are required');
        return;
      }
      
      // Add to terminal
      addToTerminal({
        type: 'output',
        content: 'Authenticating with GitHub...'
      });
      
      const result = await GitHubService.authenticate(token, owner, repo);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Success
      addToTerminal({
        type: 'output',
        content: `Successfully authenticated with GitHub for repository ${owner}/${repo}`
      });
      
      onClose();
      
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
      
      addToTerminal({
        type: 'error',
        content: `GitHub authentication error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#0f172a] border border-indigo-900/40 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">GitHub Authentication</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            GitHub Token (with repo scope)
          </label>
          <input
            type="password"
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_*********************************"
          />
          <p className="mt-1 text-xs text-gray-500">
            Generate a token from GitHub Settings {'>'} Developer Settings {'>'} Personal Access Tokens
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Repository Owner
          </label>
          <input
            type="text"
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="username or organization"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Repository Name
          </label>
          <input
            type="text"
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="repository-name"
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button 
            className="px-4 py-2 bg-transparent border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-colors"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded hover:from-cyan-600 hover:to-blue-700 transition-colors disabled:opacity-50"
            onClick={handleAuthenticate}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitAuthDialog;