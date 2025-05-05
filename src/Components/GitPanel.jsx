import React, { useState, useEffect } from 'react';
import {
  Github,
  GitBranch,
  GitCommit,
  GitMerge,
  Upload,
  Download,
  PlusCircle,
  RefreshCw,
  Info,
  User,
  LogOut,
  Shield
} from 'lucide-react';

// Separated Git Panel component for better organization
const GitPanel = ({ 
  isGitAuthenticated, 
  gitOperations, 
  currentBranch,
  gitUser = null,
  isHost = false
}) => {
  const [loadingOperation, setLoadingOperation] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Helper for performing operations with loading state
  const performOperation = async (operation, ...args) => {
    if (!isHost) {
      setMessage({
        type: 'error',
        text: 'Only the session host can perform Git operations'
      });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }
    
    setLoadingOperation(operation);
    
    try {
      if (typeof gitOperations[operation] === 'function') {
        await gitOperations[operation](...args);
      }
    } catch (error) {
      console.error(`Error performing ${operation}:`, error);
      setMessage({
        type: 'error',
        text: `Operation failed: ${error.message}`
      });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } finally {
      setLoadingOperation(null);
    }
  };
  
  // Git Operation Button sub-component
  const GitOperationButton = ({ icon, label, onClick, loading = false }) => {
    const [isHovering, setIsHovering] = useState(false);
    
    return (
      <button 
        className={`flex items-center py-1.5 px-2 bg-gray-900/70 hover:bg-indigo-900/30 rounded text-gray-300 text-xs border border-indigo-700/30 transition-all duration-200 ${
          isHovering ? 'shadow-[0_0_12px_rgba(99,102,241,0.3)]' : ''
        } ${loading ? 'opacity-70 cursor-wait' : ''}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={loading}
      >
        {loading ? (
          <RefreshCw size={14} className="mr-2 animate-spin" />
        ) : (
          icon
        )}
        <span>{loading ? `${label}...` : label}</span>
      </button>
    );
  };
  
  // Render status message toast
  const renderMessage = () => {
    if (!showMessage) return null;
    
    const bgColor = message.type === 'error' 
      ? 'bg-red-900/30 border-red-500/30' 
      : 'bg-green-900/30 border-green-500/30';
      
    const textColor = message.type === 'error' 
      ? 'text-red-400' 
      : 'text-green-400';
      
    const Icon = message.type === 'error' 
      ? Info 
      : Info;
    
    return (
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-xs ${bgColor} border shadow-lg rounded-lg p-3 z-50 animate-slideIn backdrop-blur-md`}>
        <div className="flex items-start space-x-2">
          <Icon size={16} className={textColor} />
          <p className={`${textColor} text-xs`}>{message.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-gray-700 bg-gradient-to-r from-gray-900/60 via-indigo-900/10 to-gray-900/60 backdrop-blur relative">
      {/* Git Panel Header */}
      <div 
        className="text-xs font-semibold text-gray-400 px-3 py-2 flex items-center justify-between"
      >
        <div className="flex items-center">
          <div className="bg-indigo-900/50 p-1.5 rounded-md shadow-[0_0_8px_rgba(79,70,229,0.4)] mr-2">
            <Github size={12} className="text-indigo-300" />
          </div>
          <span className="text-indigo-300 tracking-wider">GIT OPERATIONS</span>
        </div>
      </div>
      
      <div className="px-3 pb-3">
        {isGitAuthenticated && gitUser ? (
          // User is authenticated - show user info
          <div className="mb-3 bg-indigo-900/20 rounded-md border border-indigo-700/30 p-2.5 flex items-center">
            <div className="h-8 w-8 rounded-md overflow-hidden border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] mr-3">
              {gitUser.avatarUrl ? (
                <img 
                  src={gitUser.avatarUrl} 
                  alt={gitUser.username} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-indigo-800/60 flex items-center justify-center">
                  <User size={16} className="text-cyan-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-300 truncate">
                {gitUser.username || "GitHub User"}
              </div>
              <div className="text-[10px] text-gray-400 flex items-center">
                <Shield size={10} className="mr-1 text-green-400" />
                Authenticated
              </div>
            </div>
            <button 
              className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 p-1 rounded-md border border-red-800/30 transition-colors"
              onClick={() => gitOperations.logOut && gitOperations.logOut()}
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          // User is not authenticated - show login button
          <button 
            className="flex items-center w-full py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 rounded mt-2 text-gray-100 text-xs border border-indigo-500/30 transition-all duration-200 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
            onClick={() => gitOperations?.authenticate && gitOperations.authenticate()}
            disabled={loadingOperation === 'authenticate'}
          >
            {loadingOperation === 'authenticate' ? (
              <RefreshCw size={14} className="mr-2 animate-spin text-white" />
            ) : (
              <Github size={14} className="mr-2 text-white" />
            )}
            <span>{loadingOperation === 'authenticate' ? 'Authenticating...' : 'GitHub Login'}</span>
          </button>
        )}
        
        {/* Warning message about GitHub login */}
        {!isGitAuthenticated && (
          <div className="mb-2 p-2 mt-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs">
            <div className="flex">
              <Info size={14} className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium">Important</p>
                <p className="text-gray-300 mt-1">Please login to GitHub first after creating a new session.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Git Operations - Only show if authenticated */}
        {isGitAuthenticated && (
          <div className="space-y-1">
            {/* Branch info */}
            <div className="flex items-center py-1.5 px-2 text-gray-300 text-sm bg-indigo-900/20 rounded-md border border-indigo-700/30 shadow-[0_0_8px_rgba(79,70,229,0.1)]">
              <GitBranch size={14} className="mr-2 text-cyan-400" />
              <span className="text-xs">Branch: </span>
              <span className="text-xs text-cyan-400 ml-1 font-medium">{currentBranch}</span>
            </div>
            
            {/* Git operations grid */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {/* Git operations buttons with hover glow effect */}
              <GitOperationButton 
                icon={<RefreshCw size={14} className="mr-2 text-blue-400" />}
                label="Status"
                onClick={() => performOperation('status')}
                loading={loadingOperation === 'status'}
              />
              
              <GitOperationButton 
                icon={<PlusCircle size={14} className="mr-2 text-blue-400" />}
                label="Add"
                onClick={() => performOperation('add')}
                loading={loadingOperation === 'add'}
              />
              
              <GitOperationButton 
                icon={<GitCommit size={14} className="mr-2 text-yellow-400" />}
                label="Commit"
                onClick={() => performOperation('commit')}
                loading={loadingOperation === 'commit'}
              />
              
              <GitOperationButton 
                icon={<Upload size={14} className="mr-2 text-green-400" />}
                label="Push"
                onClick={() => performOperation('push')}
                loading={loadingOperation === 'push'}
              />
              
              <GitOperationButton 
                icon={<Download size={14} className="mr-2 text-purple-400" />}
                label="Pull"
                onClick={() => performOperation('pull')}
                loading={loadingOperation === 'pull'}
              />
              
              <GitOperationButton 
                icon={<GitMerge size={14} className="mr-2 text-red-400" />}
                label="Merge"
                onClick={() => performOperation('merge')}
                loading={loadingOperation === 'merge'}
              />
            </div>
          </div>
        )}
      </div>
      
      {renderMessage()}
    </div>
  );
};

export default GitPanel;