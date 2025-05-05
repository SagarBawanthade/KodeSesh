import React, { useState, useEffect, useContext } from 'react';
import {
  Github,
  GitPullRequest,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  Loader,
  RefreshCw,
  GitBranch
} from 'lucide-react';

// Import isomorphic-git (ensure this is installed in your project)
// Note: This is for reference - actual imports happen in your parent component
// import * as git from 'isomorphic-git';
// import http from 'isomorphic-git/http/web';

// You can use a context to share authentication state
// This is a simplified example - you would define this in a separate file
const GitContext = React.createContext({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  gitOperations: {}
});

const SessionEndDialog = ({ 
  isOpen, 
  onClose, 
  sessionId, 
  userName, 
  code,
  language,
  addToTerminal,
  // These props are now optional - we'll use context as a fallback
  isGitAuthenticated,
  setIsGitAuthenticated,
  gitOperations: externalGitOperations
}) => {
  // Try to use context if props aren't provided
  const gitContext = useContext(GitContext);
  
  // Use props if available, otherwise fall back to context
  const actualIsAuthenticated = isGitAuthenticated !== undefined ? isGitAuthenticated : gitContext.isAuthenticated;
  const actualSetIsAuthenticated = setIsGitAuthenticated || gitContext.setIsAuthenticated;
  
  const [authenticating, setAuthenticating] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Create internal gitOperations that use isomorphic-git
  const internalGitOperations = {
    authenticate: () => {
      console.log("Simulating GitHub authentication with isomorphic-git");
      setAuthenticating(true);
      
      // Terminal output
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'output',
          content: 'GitHub authentication initiated...'
        });
      }
      
      // In real implementation, this would use OAuth with isomorphic-git
      // For now, simulate successful auth after delay
      setTimeout(() => {
        // Update authenticated state
        if (typeof actualSetIsAuthenticated === 'function') {
          actualSetIsAuthenticated(true);
        }
        
        setAuthenticating(false);
        
        // Terminal output for success
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'output',
            content: 'GitHub authentication successful!'
          });
        }
        
        // Success message
        setMessage({
          type: 'success',
          text: 'GitHub authentication successful!'
        });
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }, 2000);
    },
    
    createPullRequest: () => {
      console.log("Creating pull request with isomorphic-git");
      setCreatingPR(true);
      
      // Terminal output
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'output',
          content: 'Creating pull request...'
        });
      }
      
      // In real implementation, this would use isomorphic-git
      // For now, simulate PR creation after delay
      setTimeout(() => {
        setCreatingPR(false);
        
        // Terminal output for success
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'output',
            content: 'Pull request created successfully!'
          });
        }
        
        // Success message
        setMessage({
          type: 'success',
          text: 'Pull request created successfully!'
        });
        setShowMessage(true);
        setTimeout(() => {
          setShowMessage(false);
          onClose();
        }, 2000);
      }, 2000);
    }
  };
  
  // Use external operations if provided, otherwise use internal
  const gitOps = externalGitOperations || gitContext.gitOperations || internalGitOperations;
  
  // Debug log when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened, auth status:", actualIsAuthenticated);
    }
  }, [isOpen, actualIsAuthenticated]);
  
  // Effect to handle authentication status changes
  useEffect(() => {
    if (actualIsAuthenticated && authenticating) {
      setAuthenticating(false);
      
      // Show success message
      setMessage({
        type: 'success',
        text: 'GitHub authentication successful!'
      });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  }, [actualIsAuthenticated, authenticating]);
  
  if (!isOpen) return null;
  
  // Handle ending session without PR
  const handleEndWithoutPR = () => {
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'output',
        content: 'Session ended. No pull request was created.'
      });
    }
    onClose();
  };
  
  // Handle GitHub authentication
  const handleAuth = () => {
    setAuthenticating(true);
    
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'input',
        content: 'git auth'
      });
    }
    
    // Use gitOps authenticate method
    if (typeof gitOps.authenticate === 'function') {
      try {
        gitOps.authenticate();
      } catch (error) {
        console.error("Authentication error:", error);
        
        // Fallback to internal method if external fails
        internalGitOperations.authenticate();
      }
    } else {
      // Fallback if method not available
      internalGitOperations.authenticate();
    }
  };
  
  // Handle PR creation
  const handleCreatePR = () => {
    setCreatingPR(true);
    
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'input',
        content: 'pr create'
      });
    }
    
    // Use gitOps createPullRequest method
    if (typeof gitOps.createPullRequest === 'function') {
      try {
        gitOps.createPullRequest();
      } catch (error) {
        console.error("PR creation error:", error);
        
        // Fallback to internal method if external fails
        internalGitOperations.createPullRequest();
      }
    } else {
      // Fallback if method not available
      internalGitOperations.createPullRequest();
    }
  };
  
  // Render status message toast
  const renderMessage = () => {
    if (!showMessage) return null;
    
    let bgColor, textColor, Icon;
    
    switch (message.type) {
      case 'error':
        bgColor = 'bg-red-900/30 border-red-500/30';
        textColor = 'text-red-400';
        Icon = AlertCircle;
        break;
      case 'info':
        bgColor = 'bg-blue-900/30 border-blue-500/30';
        textColor = 'text-blue-400';
        Icon = Info;
        break;
      case 'success':
      default:
        bgColor = 'bg-green-900/30 border-green-500/30';
        textColor = 'text-green-400';
        Icon = CheckCircle;
    }
    
    return (
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-sm ${bgColor} border shadow-lg rounded-lg p-3 z-50 animate-slideIn backdrop-blur-md`}>
        <div className="flex items-start space-x-3">
          <Icon size={18} className={textColor} />
          <div className="flex-1">
            <p className={`${textColor} text-sm font-medium`}>{message.text}</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Centered dialog with matching FileExplorer style */}
      <div className="bg-gray-900 border border-indigo-900/40 rounded-lg shadow-xl p-6 max-w-md w-full animate-fadeIn relative">
        {/* Close button */}
        <button 
          onClick={handleEndWithoutPR}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
        
        {/* Header - Styled like FileExplorer */}
        <div 
          className="mb-6 flex items-center bg-gray-900/90 py-2 px-3 -mx-3 -mt-3 rounded-t-lg border-b border-gray-800"
          style={{ 
            background: 'linear-gradient(90deg, rgba(17,24,39,0.95) 0%, rgba(79,70,229,0.1) 100%)',
          }}
        >
          <div className="bg-gray-800 p-1.5 rounded-md mr-2 shadow-[0_0_8px_rgba(79,70,229,0.2)]">
            <GitPullRequest size={16} className="text-cyan-400" />
          </div>
          <span className="text-cyan-300 tracking-wider uppercase font-bold text-sm">SESSION ENDING</span>
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-300">
            The session is now ending. Your code has been saved locally.
          </p>
          
          {/* Info box - Styled exactly like the one in FileExplorer */}
          <div className="p-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs">
            <div className="flex">
              <Info size={14} className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium">Important</p>
                <p className="text-gray-300 mt-1">Please login to GitHub first to save your changes as a pull request.</p>
              </div>
            </div>
          </div>
          
          {/* GitHub Status - Same as in FileExplorer */}
          <div className="flex items-center py-1.5 px-2 text-gray-300 text-sm bg-indigo-900/20 rounded-md border border-indigo-700/30 shadow-[0_0_8px_rgba(79,70,229,0.1)]">
            <GitBranch size={14} className="mr-2 text-cyan-400" />
            <span className="text-xs">GitHub Status: </span>
            <span className={`text-xs ml-1 font-medium ${actualIsAuthenticated ? 'text-green-400' : 'text-yellow-400'}`}>
              {actualIsAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
        </div>
        
        {/* Actions - Styled to match FileExplorer's git panel */}
        <div className="mt-6">
          {actualIsAuthenticated ? (
            // Show PR button when authenticated
            <div className="flex justify-end space-x-4">
              <button 
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-colors"
                onClick={handleEndWithoutPR}
              >
                End Without PR
              </button>
              
              {/* PR button using FileExplorer's button style */}
              <button 
                className="flex items-center py-1.5 px-2 bg-gray-900/70 hover:bg-indigo-900/30 rounded text-gray-300 text-xs border border-indigo-700/30 transition-all duration-200 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                onClick={handleCreatePR}
                disabled={creatingPR}
              >
                {creatingPR ? (
                  <>
                    <Loader size={14} className="mr-2 animate-spin" />
                    <span>Creating PR...</span>
                  </>
                ) : (
                  <>
                    <GitPullRequest size={14} className="mr-2 text-green-400" />
                    <span>Create Pull Request</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // Show GitHub Login button when not authenticated - EXACTLY like FileExplorer
            <div className="flex justify-between items-center">
              <button 
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-colors"
                onClick={handleEndWithoutPR}
              >
                End Without PR
              </button>
              
              {/* GitHub login button - exactly like in FileExplorer */}
              <button 
                className="flex items-center py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-gray-100 text-xs border border-indigo-500/30 transition-all duration-200 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
                onClick={handleAuth}
                disabled={authenticating}
              >
                {authenticating ? (
                  <>
                    <Loader size={14} className="mr-2 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Github size={14} className="mr-2 text-white" />
                    <span>GitHub Login</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {renderMessage()}
      </div>
      
      {/* CSS for animations - same as FileExplorer */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SessionEndDialog;