// components/PRReviewPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import GitHubService from '../service/GitHubService.js';

const PRReviewPanel = ({ 
  isVisible, 
  onClose,
  addToTerminal
}) => {
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPR, setSelectedPR] = useState(null);
  const [prDetails, setPRDetails] = useState(null);
  const [diffView, setDiffView] = useState(null);
  
  // Define fetchPullRequests with useCallback to avoid recreation on each render
  const fetchPullRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      addToTerminal({
        type: 'output',
        content: 'Fetching pull requests...'
      });
      
      const result = await GitHubService.getPullRequests();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Filter for session-related PRs
      const sessionPRs = result.pullRequests.filter(pr => 
        pr.title.includes('Session') || pr.body.includes('KodeSesh session')
      );
      
      setPullRequests(sessionPRs);
      
      addToTerminal({
        type: 'output',
        content: `Found ${sessionPRs.length} session pull requests`
      });
      
    } catch (error) {
      console.error('Fetch PRs error:', error);
      setError(error.message);
      
      addToTerminal({
        type: 'error',
        content: `Error fetching pull requests: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [addToTerminal]);
  
  // Fetch PRs when panel becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchPullRequests();
    }
  }, [isVisible, fetchPullRequests]);
  
  const handleSelectPR = async (prNumber) => {
    try {
      setSelectedPR(prNumber);
      setLoading(true);
      
      const result = await GitHubService.getPRDetails(prNumber);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setPRDetails(result.prDetails);
      setDiffView(result.diffText);
      
    } catch (error) {
      console.error('Get PR details error:', error);
      setError(error.message);
      
      addToTerminal({
        type: 'error',
        content: `Error getting PR details: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMergePR = async (prNumber) => {
    try {
      setLoading(true);
      
      addToTerminal({
        type: 'output',
        content: `Merging pull request #${prNumber}...`
      });
      
      const result = await GitHubService.mergePR(prNumber);
      
      if (!result.success) {
        if (result.needsManualMerge) {
          addToTerminal({
            type: 'error',
            content: `Merge conflict detected in PR #${prNumber}. Please resolve conflicts manually on GitHub.`
          });
        }
        throw new Error(result.error);
      }
      
      addToTerminal({
        type: 'output',
        content: `Successfully merged pull request #${prNumber}`
      });
      
      // Refresh PR list and reset selection
      await fetchPullRequests();
      setSelectedPR(null);
      setPRDetails(null);
      setDiffView(null);
      
    } catch (error) {
      console.error('Merge PR error:', error);
      setError(error.message);
      
      addToTerminal({
        type: 'error',
        content: `Error merging pull request: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Format diff for display
  const formatDiff = (diffText) => {
    if (!diffText) return null;
    
    // Split diff into lines
    const lines = diffText.split('\n');
    
    return (
      <pre className="text-xs font-mono bg-slate-900 p-4 rounded overflow-x-auto">
        {lines.map((line, index) => {
          let className = "text-gray-300";
          
          if (line.startsWith('+')) {
            className = "text-green-400";
          } else if (line.startsWith('-')) {
            className = "text-red-400";
          } else if (line.startsWith('@@')) {
            className = "text-cyan-400";
          } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
            className = "text-blue-400";
          }
          
          return (
            <div key={index} className={className}>
              {line}
            </div>
          );
        })}
      </pre>
    );
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-indigo-900 border-opacity-40 rounded-lg shadow-xl p-6 max-w-4xl w-full h-5/6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-cyan-400">
            Session Pull Requests
          </h2>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-1 overflow-hidden">
          {/* PR List */}
          <div className="w-1/3 border-r border-indigo-900 border-opacity-40 pr-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-blue-400 mb-3">Pull Requests</h3>
            
            {loading && !pullRequests.length ? (
              <div className="text-gray-400 animate-pulse">Loading pull requests...</div>
            ) : pullRequests.length === 0 ? (
              <div className="text-gray-400">No session pull requests found.</div>
            ) : (
              <div className="space-y-3">
                {pullRequests.map(pr => (
                  <div 
                    key={pr.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedPR === pr.number 
                        ? 'bg-indigo-900 bg-opacity-40 border border-indigo-700' 
                        : 'bg-slate-800 hover:bg-slate-700 border border-transparent'
                    }`}
                    onClick={() => handleSelectPR(pr.number)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-white">#{pr.number}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-200">{pr.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      By {pr.user.login} • {new Date(pr.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <button
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded hover:from-blue-600 hover:to-indigo-700 transition-colors"
                onClick={fetchPullRequests}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh PRs'}
              </button>
            </div>
          </div>
          
          {/* PR Details */}
          <div className="w-2/3 pl-4 overflow-y-auto">
            {selectedPR ? (
              loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-cyan-400 animate-pulse">Loading PR details...</div>
                </div>
              ) : prDetails ? (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-blue-400 mb-2">
                      #{prDetails.number} {prDetails.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <div className="flex items-center">
                        <img src={prDetails.user.avatar_url} alt={prDetails.user.login} className="w-5 h-5 rounded-full mr-2" />
                        <span>{prDetails.user.login}</span>
                      </div>
                      <span>•</span>
                      <span>Created: {new Date(prDetails.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4 bg-slate-800 rounded p-3 text-sm text-gray-300 max-h-32 overflow-y-auto">
                    {prDetails.body}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="px-3 py-1 bg-indigo-900 bg-opacity-40 border border-indigo-700 border-opacity-50 rounded text-xs text-gray-200">
                      <span className="text-gray-400">Branch:</span> {prDetails.head.ref}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <div className="px-3 py-1 bg-indigo-900 bg-opacity-40 border border-indigo-700 border-opacity-50 rounded text-xs text-gray-200">
                      <span className="text-gray-400">Into:</span> {prDetails.base.ref}
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-blue-400 mb-2">Changes</h4>
                  
                  <div className="flex-1 overflow-y-auto mb-4">
                    {diffView ? formatDiff(diffView) : (
                      <div className="text-gray-400">No changes to display</div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <a
                      href={prDetails.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition-colors"
                    >
                      View on GitHub
                    </a>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded hover:from-green-600 hover:to-teal-700 transition-colors"
                      onClick={() => handleMergePR(prDetails.number)}
                      disabled={loading}
                    >
                      Merge Pull Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Error loading PR details. Please try again.
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-center">Select a pull request from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRReviewPanel;