import React, { useState, useEffect } from 'react';
import { GitPullRequest, CheckCircle, XCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import PRService from '../service/PRService';

const PRList = ({ 
  sessionId, 
  onViewPR = () => {},
  onReviewPR = () => {},
  isHost = false,
  className = ''
}) => {
  const [pullRequests, setPullRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Load PRs on mount and when sessionId changes
  useEffect(() => {
    loadPullRequests();
    
    // Set up an interval to refresh PRs
    const intervalId = setInterval(loadPullRequests, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [sessionId]);
  
  // Load pull requests
  const loadPullRequests = () => {
    let prs = [];
    
    if (sessionId) {
      prs = PRService.getPRsBySession(sessionId);
    } else {
      prs = PRService.getAllPRs();
    }
    
    setPullRequests(prs);
    setPendingCount(prs.filter(pr => pr.status === 'pending').length);
  };
  
  // Format date
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    // Convert to seconds
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) {
      return `${diffSecs} sec${diffSecs !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to minutes
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to hours
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to days
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to months
    const diffMonths = Math.floor(diffDays / 30);
    
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="text-yellow-400" />;
      case 'approved':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'rejected':
        return <XCircle size={14} className="text-red-400" />;
      case 'merged':
        return <GitPullRequest size={14} className="text-purple-400" />;
      default:
        return <AlertCircle size={14} className="text-gray-400" />;
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // No PRs yet
  if (pullRequests.length === 0) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        <div className="flex items-center p-2">
          <GitPullRequest size={14} className="mr-2 text-gray-500" />
          <span>No pull requests yet</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`text-xs rounded-md border border-gray-700/50 bg-gray-800/50 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <GitPullRequest size={14} className="mr-2 text-cyan-400" />
          <span className="font-medium text-gray-300">Pull Requests</span>
          
          {pendingCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-yellow-600/30 text-yellow-300 text-[10px]">
              {pendingCount} pending
            </span>
          )}
        </div>
        
        <ChevronRight 
          size={14} 
          className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
        />
      </div>
      
      {/* List of PRs */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-gray-700/50 custom-scrollbar overflow-y-auto max-h-60">
          {pullRequests.map(pr => (
            <div 
              key={pr.id}
              className="p-2 hover:bg-gray-700/30 cursor-pointer border-b border-gray-700/20 last:border-b-0 transition-colors"
              onClick={() => isHost && pr.status === 'pending' ? onReviewPR(pr.id) : onViewPR(pr.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(pr.status)}
                  <span className="ml-2 text-gray-300 truncate max-w-[150px]">{pr.title}</span>
                </div>
                
                <span className="text-gray-500 text-[10px]">{formatTimeAgo(pr.createdAt)}</span>
              </div>
              
              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500 text-[10px]">by {pr.author || 'Anonymous'}</span>
                
                {isHost && pr.status === 'pending' && (
                  <span className="text-cyan-400 text-[10px]">Review</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Custom styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.4);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.5);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default PRList;