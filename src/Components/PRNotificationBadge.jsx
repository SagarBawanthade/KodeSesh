import React, { useState, useEffect } from 'react';
import { GitPullRequest } from 'lucide-react';
import prManager from '../service/PRService';

const PRNotificationBadge = ({
  sessionId,
  onClick = () => {},
  color = 'cyan',
  isHost = false
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Load pending PR count on mount and periodically
  useEffect(() => {
    // Initial load
    updatePendingCount();
    
    // Set up an interval to refresh counts
    const intervalId = setInterval(updatePendingCount, 10000); // Every 10 seconds
    
    // Subscribe to PR events for real-time updates
    const unsubscribe = prManager.subscribe((event, data) => {
      if (['pr-added', 'pr-sync', 'pr-approved', 'pr-rejected', 'pr-changes-requested'].includes(event)) {
        updatePendingCount();
      }
    });
    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [sessionId]);
  
  // Update pending count
  const updatePendingCount = () => {
    // Use the existing methods in prManager
    let count = 0;
    
    if (sessionId) {
      // If sessionId is provided, get PRs for that session
      count = prManager.getPendingReviewsForSession(sessionId).length;
    } else {
      // Otherwise get all pending reviews
      count = prManager.getPendingReviews().length;
    }
    
    // Animate if count increases
    if (count > pendingCount) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
    
    setPendingCount(count);
  };
  
  // Get color classes based on color prop
  const getColorClasses = () => {
    switch (color) {
      case 'cyan':
        return {
          icon: 'text-cyan-400',
          badge: 'bg-cyan-600/60 text-cyan-200 border-cyan-500/30',
          pulse: 'from-cyan-500/30 to-transparent'
        };
      case 'purple':
        return {
          icon: 'text-purple-400',
          badge: 'bg-purple-600/60 text-purple-200 border-purple-500/30',
          pulse: 'from-purple-500/30 to-transparent'
        };
      case 'yellow':
        return {
          icon: 'text-yellow-400',
          badge: 'bg-yellow-600/60 text-yellow-200 border-yellow-500/30',
          pulse: 'from-yellow-500/30 to-transparent'
        };
      default:
        return {
          icon: 'text-cyan-400',
          badge: 'bg-cyan-600/60 text-cyan-200 border-cyan-500/30',
          pulse: 'from-cyan-500/30 to-transparent'
        };
    }
  };
  
  const colorClasses = getColorClasses();
  
  // If no pending PRs and user is not a host, don't show anything
  if (pendingCount === 0 && !isHost) {
    return null;
  }
  
  return (
    <div 
      className="relative inline-flex items-center cursor-pointer hover:scale-110 transition-transform duration-200"
      onClick={onClick}
      title={`${pendingCount} pull request${pendingCount !== 1 ? 's' : ''} waiting for review`}
    >
      <GitPullRequest size={18} className={colorClasses.icon} />
      
      {pendingCount > 0 && (
        <>
          {/* Notification badge */}
          <span className={`absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center px-1 rounded-full text-[10px] font-medium ${colorClasses.badge} border shadow-sm`}>
            {pendingCount}
          </span>
          
          {/* Pulsing animation when new PRs arrive */}
          {isAnimating && (
            <span className={`absolute inset-0 rounded-full animate-ping-once bg-gradient-radial ${colorClasses.pulse}`}></span>
          )}
        </>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes ping-once {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        .animate-ping-once {
          animation: ping-once 1s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default PRNotificationBadge;