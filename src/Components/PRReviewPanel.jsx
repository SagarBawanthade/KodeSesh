import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, ChevronRight, GitPullRequest, MessageSquare } from 'lucide-react';
import prManager from '../service/PRService';

const PRReviewPanel = ({ isVisible, onClose, addToTerminal }) => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewedPRs, setReviewedPRs] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  // Load pending reviews on mount
  useEffect(() => {
    if (isVisible) {
      refreshReviews();
      
      // Request PR sync from other users
      prManager.requestPRSync();
    }
  }, [isVisible]);

  // Subscribe to PR events
  useEffect(() => {
    // Subscribe to PR events
    const unsubscribe = prManager.subscribe((event, data) => {
      if (['pr-added', 'review-requested', 'pr-approved', 'pr-rejected', 'pr-changes-requested'].includes(event)) {
        refreshReviews();
        
        // Add terminal notification
        let message = '';
        switch (event) {
          case 'pr-added':
          case 'review-requested':
            message = `New pull request submitted: "${data.title}"`;
            break;
          case 'pr-approved':
            message = `Pull request approved: "${data.title}"`;
            break;
          case 'pr-rejected':
            message = `Pull request rejected: "${data.title}"`;
            break;
          case 'pr-changes-requested':
            message = `Changes requested for PR: "${data.title}"`;
            break;
        }
        
        if (message && typeof addToTerminal === 'function') {
          addToTerminal({ type: 'output', content: message });
        }
      }
    });
    
    return unsubscribe;
  }, [addToTerminal]);

  // Refresh reviews list
  const refreshReviews = () => {
    setPendingReviews(prManager.getPendingReviews());
    setReviewedPRs(prManager.getReviewedPRs());
  };
  
  // Handle PR review action
  const handleReviewAction = async (reviewId, action) => {
    setIsReviewing(true);
    
    try {
      const result = await prManager.reviewPR(reviewId, action, reviewComment);
      
      if (result.success) {
        // Add message to terminal
        if (typeof addToTerminal === 'function') {
          let message = '';
          switch (action) {
            case 'approve':
              message = `PR approved and created: ${result.review.title}`;
              if (result.prUrl) {
                message += `\nPR URL: ${result.prUrl}`;
              }
              break;
            case 'reject':
              message = `PR rejected: ${result.review.title}`;
              break;
            case 'request-changes':
              message = `Changes requested for PR: ${result.review.title}`;
              break;
          }
          
          addToTerminal({ type: 'output', content: message });
        }
        
        // Reset active review and comment
        setActiveReviewId(null);
        setReviewComment('');
        
        // Refresh the lists
        refreshReviews();
      } else {
        // Show error
        if (typeof addToTerminal === 'function') {
          addToTerminal({ type: 'error', content: `Error: ${result.error}` });
        }
      }
    } catch (error) {
      console.error('Error during review action:', error);
      if (typeof addToTerminal === 'function') {
        addToTerminal({ type: 'error', content: `Error: ${error.message}` });
      }
    } finally {
      setIsReviewing(false);
    }
  };
  
  // Helper for formatted date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };
  
  // Get active review
  const activeReview = activeReviewId 
    ? pendingReviews.find(r => r.id === activeReviewId) || reviewedPRs.find(r => r.id === activeReviewId)
    : null;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="w-11/12 max-w-5xl h-5/6 mx-auto relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-lg opacity-10 blur-md"></div>
        
        <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 border border-blue-500/30 rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-blue-500/20 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <GitPullRequest size={18} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-blue-300">Pull Request Review Panel</h3>
            </div>
            
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-700/50"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-700/50">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'pending' 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Reviews ({pendingReviews.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'reviewed' 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('reviewed')}
            >
              Reviewed PRs ({reviewedPRs.length})
            </button>
          </div>
          
          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* List Panel */}
            <div className="w-1/3 border-r border-gray-700/50 overflow-y-auto">
              {activeTab === 'pending' && (
                <>
                  {pendingReviews.length === 0 ? (
                    <div className="p-4 text-gray-400 text-sm text-center">
                      No pending pull requests to review
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-800">
                      {pendingReviews.map(review => (
                        <li 
                          key={review.id} 
                          className={`p-3 hover:bg-gray-800/50 cursor-pointer transition-colors ${activeReviewId === review.id ? 'bg-blue-900/20' : ''}`}
                          onClick={() => setActiveReviewId(review.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-blue-300 truncate">{review.title}</div>
                            <ChevronRight size={16} className="text-gray-500" />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            By {review.author} • {formatDate(review.createdAt)}
                          </div>
                          <div className="text-xs mt-1 flex items-center">
                            <span className="px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-700/50">
                              {review.status || 'pending'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              
              {activeTab === 'reviewed' && (
                <>
                  {reviewedPRs.length === 0 ? (
                    <div className="p-4 text-gray-400 text-sm text-center">
                      No reviewed pull requests yet
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-800">
                      {reviewedPRs.map(review => (
                        <li 
                          key={review.id} 
                          className={`p-3 hover:bg-gray-800/50 cursor-pointer transition-colors ${activeReviewId === review.id ? 'bg-blue-900/20' : ''}`}
                          onClick={() => setActiveReviewId(review.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-blue-300 truncate">{review.title}</div>
                            <ChevronRight size={16} className="text-gray-500" />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            By {review.author} • {formatDate(review.reviewedAt)}
                          </div>
                          <div className="text-xs mt-1 flex items-center">
                            <span className={`px-2 py-0.5 rounded-full ${
                              review.status === 'approved' 
                                ? 'bg-green-900/40 text-green-400 border border-green-700/50' 
                                : review.status === 'rejected'
                                ? 'bg-red-900/40 text-red-400 border border-red-700/50'
                                : 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50'
                            }`}>
                              {review.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
            
            {/* Detail Panel */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {activeReview ? (
                <>
                  {/* PR Detail Header */}
                  <div className="p-4 bg-gray-800/30 border-b border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-blue-300">{activeReview.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeReview.status === 'approved' 
                          ? 'bg-green-900/40 text-green-400 border border-green-700/50' 
                          : activeReview.status === 'rejected'
                          ? 'bg-red-900/40 text-red-400 border border-red-700/50'
                          : 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50'
                      }`}>
                        {activeReview.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Submitted by <span className="text-blue-400">{activeReview.author}</span> on {formatDate(activeReview.createdAt)}
                    </div>
                    {activeReview.reviewedAt && (
                      <div className="mt-1 text-sm text-gray-400">
                        Reviewed on {formatDate(activeReview.reviewedAt)}
                      </div>
                    )}
                    <div className="mt-1 text-sm text-gray-400">
                      Branch: <span className="text-cyan-400">{activeReview.branch || 'main'}</span> → 
                      <span className="text-cyan-400"> {activeReview.targetBranch || 'main'}</span>
                    </div>
                    {activeReview.prUrl && (
                      <div className="mt-2">
                        <a 
                          href={activeReview.prUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 underline"
                        >
                          View PR on GitHub #{activeReview.prNumber}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="p-4 border-b border-gray-700/50">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                    <div className="text-sm text-gray-400 whitespace-pre-wrap bg-gray-800/30 p-3 rounded">
                      {activeReview.description || 'No description provided'}
                    </div>
                  </div>
                  
                  {/* Code */}
                  <div className="p-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Code Changes</h4>
                    <pre className="text-xs text-gray-300 bg-gray-800/50 p-3 rounded border border-gray-700/50 overflow-auto max-h-64">
                      {activeReview.code || 'No code changes provided'}
                    </pre>
                  </div>
                  
                  {/* Comments Section for Reviewed PRs */}
                  {activeReview.comments && (
                    <div className="p-4 border-t border-gray-700/50">
                      <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <MessageSquare size={14} />
                        Review Comments
                      </h4>
                      <div className="text-sm text-gray-400 bg-gray-800/30 p-3 rounded whitespace-pre-wrap">
                        {activeReview.comments}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Panel - only for pending reviews */}
                  {activeTab === 'pending' && activeReview.status !== 'rejected' && activeReview.status !== 'approved' && (
                    <div className="p-4 border-t border-gray-700/50 bg-gray-800/20">
                      <div className="mb-3">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-1">
                          Review Comments
                        </label>
                        <textarea
                          id="comment"
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-800 text-gray-200 text-sm rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="Add comments about this PR..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleReviewAction(activeReview.id, 'request-changes')}
                          disabled={isReviewing}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-800/40 hover:bg-yellow-800/60 text-yellow-300 border border-yellow-700/50 transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle size={14} />
                          <span>Request Changes</span>
                        </button>
                        <button
                          onClick={() => handleReviewAction(activeReview.id, 'reject')}
                          disabled={isReviewing}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700/50 transition-colors flex items-center gap-1.5"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleReviewAction(activeReview.id, 'approve')}
                          disabled={isReviewing}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-green-900/40 hover:bg-green-900/60 text-green-300 border border-green-700/50 transition-colors flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>Approve & Create PR</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <GitPullRequest size={40} className="mx-auto mb-3 text-gray-600" />
                    <p>Select a pull request to review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRReviewPanel;