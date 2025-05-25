// service/PRService.js
// Enhanced implementation for PR management

class PRService {
  constructor() {
    // Initialize pull requests from localStorage
    this.pullRequests = this.loadPRs();
    this.subscribers = [];
    
    // Set up localStorage event listener for cross-tab synchronization
    window.addEventListener('storage', (event) => {
      if (event.key === 'pullRequests') {
        this.pullRequests = JSON.parse(event.newValue || '[]');
        this.notifySubscribers('pr-sync', this.pullRequests);
      }
    });
  }
  
  // Load PRs from localStorage
  loadPRs() {
    try {
      const storedPRs = localStorage.getItem('pullRequests');
      return storedPRs ? JSON.parse(storedPRs) : [];
    } catch (error) {
      console.error('Error loading PRs from localStorage:', error);
      return [];
    }
  }
  
  // Save PRs to localStorage
  savePRs() {
    try {
      localStorage.setItem('pullRequests', JSON.stringify(this.pullRequests));
    } catch (error) {
      console.error('Error saving PRs to localStorage:', error);
    }
  }
  
  // Create a new PR
  createPR(prData) {
  // Generate a unique ID
  const id = `pr-${Date.now()}`;
  
  // Create PR object with defaults
  const pr = {
    id,
    title: prData.title || 'Untitled PR',
    description: prData.description || '',
    sessionId: prData.sessionId || '',
    author: prData.author || 'Anonymous',
    authorId: prData.authorId || '',
    sourceBranch: prData.sourceBranch || 'feature',
    targetBranch: prData.targetBranch || 'main',
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    comments: '',
    code: prData.code || '',
    language: prData.language || 'javascript',
    files: prData.files || [],
    prNumber: prData.prNumber || null,
    prUrl: prData.prUrl || null,
    ...prData
  };
  
  // Add to PRs array
  this.pullRequests.push(pr);
  
  // Save to localStorage
  this.savePRs();
  
  // Notify subscribers
  this.notifySubscribers('pr-added', pr);
  
  // Broadcast to other users via socket if available
  this.broadcastPR('pr-added', pr);
  
  return pr;
}

// Add this method to PRService
// Add this method to PRService
broadcastPR(event, pr) {
  try {
    // Try to get socket from various locations for reliability
    let socket = null;
    
    // Check all possible socket locations
    if (window.socket && window.socket.connected) {
      socket = window.socket;
    } else if (window.socketConnection && window.socketConnection.connected) {
      socket = window.socketConnection;
    }
    
    // If socket exists and is connected, broadcast PR
    if (socket && socket.connected) {
      console.log(`📤 Broadcasting PR event: ${event}`, pr);
      
      const prSyncData = {
        sessionId: pr.sessionId,
        eventType: event,
        prData: pr
      };
      
      try {
        socket.emit("prSync", prSyncData);
        console.log('✅ PR broadcast sent successfully');
      } catch (socketError) {
        console.error('❌ Socket emit error:', socketError);
        
        // Retry after a short delay
        setTimeout(() => {
          try {
            socket.emit("prSync", prSyncData);
            console.log('✅ PR broadcast retry sent');
          } catch (retryError) {
            console.error('❌ Socket emit retry error:', retryError);
          }
        }, 500);
      }
    } else {
      console.warn("⚠️ No connected socket found for PR broadcast");
      
      // Try to get available socket and reconnect if possible
      const availableSocket = window.socket || window.socketConnection;
      if (availableSocket && typeof availableSocket.connect === 'function' && !availableSocket.connected) {
        try {
          console.log('🔄 Attempting socket reconnection...');
          availableSocket.connect();
          
          // Try broadcast after reconnection
          setTimeout(() => {
            if (availableSocket.connected) {
              availableSocket.emit("prSync", {
                sessionId: pr.sessionId,
                eventType: event,
                prData: pr
              });
              console.log('✅ PR broadcast sent after reconnection');
            } else {
              console.warn('⚠️ Socket still not connected after reconnection attempt');
            }
          }, 1000);
        } catch (reconnectError) {
          console.error('❌ Socket reconnection error:', reconnectError);
        }
      }
    }
  } catch (error) {
    console.warn("❌ PR broadcast error:", error);
    // Don't throw - this is a non-critical feature
  }
}

// Add method to handle incoming PR sync
// Add method to handle incoming PR sync
handlePRSync(sessionId, eventType, prData) {
  console.log(`Received PR sync: ${eventType}`, prData);
  
  if (!sessionId || !eventType || !prData) {
    return;
  }
  
  switch (eventType) {
    case 'pr-added':
      // Check if PR already exists by ID
      const existingPR = this.getPRById(prData.id);
      
      if (!existingPR) {
        // Add the PR to local storage
        this.pullRequests.push(prData);
        this.savePRs();
        
        // Notify subscribers locally (but don't broadcast again)
        this.notifySubscribers(eventType, prData);
      }
      break;
    
    case 'pr-updated':
    case 'pr-approved':
    case 'pr-rejected':
    case 'pr-changes-requested':
      // Find and update existing PR
      const index = this.pullRequests.findIndex(pr => pr.id === prData.id);
      
      if (index !== -1) {
        this.pullRequests[index] = prData;
        this.savePRs();
        
        // Notify subscribers locally
        this.notifySubscribers(eventType, prData);
      } else {
        // If PR doesn't exist locally, add it
        this.pullRequests.push(prData);
        this.savePRs();
        this.notifySubscribers(eventType, prData);
      }
      break;
      
    case 'pr-deleted':
      // Remove PR if exists
      const deleteIndex = this.pullRequests.findIndex(pr => pr.id === prData.id);
      
      if (deleteIndex !== -1) {
        this.pullRequests.splice(deleteIndex, 1);
        this.savePRs();
        
        // Notify subscribers locally
        this.notifySubscribers(eventType, prData);
      }
      break;
      
    default:
      console.warn(`Unknown PR sync event type: ${eventType}`);
  }
}

  prExists(title, sessionId) {
    return this.pullRequests.some(pr => 
      pr.title === title && pr.sessionId === sessionId
    );
  }
  
  // Get all PRs
  getAllPRs() {
    return [...this.pullRequests];
  }
  
  // Get PRs by session ID
  getPRsBySession(sessionId) {
    return this.pullRequests.filter(pr => pr.sessionId === sessionId);
  }
  
  // Get PR by ID
  getPRById(id) {
    return this.pullRequests.find(pr => pr.id === id);
  }
  
  // Get pending reviews (PRs that need review)
  getPendingReviews() {
    return this.pullRequests.filter(pr => pr.status === 'pending');
  }
  
  // Get pending reviews for a specific session
  getPendingReviewsForSession(sessionId) {
    return this.pullRequests.filter(pr => 
      pr.status === 'pending' && pr.sessionId === sessionId
    );
  }
  
  // Get reviewed PRs (approved, rejected, or changes requested)
  getReviewedPRs() {
    return this.pullRequests.filter(pr => 
      pr.status !== 'pending'
    );
  }
  
  // Review a PR
  // Review a PR
a// Review a PR
async reviewPR(id, action, comments = '') {
  const pr = this.getPRById(id);
  
  if (!pr) {
    return { success: false, error: `PR with ID ${id} not found` };
  }
  
  // Update PR based on review action
  switch (action) {
    case 'approve':
      pr.status = 'approved';
      break;
    case 'reject':
      pr.status = 'rejected';
      break;
    case 'request-changes':
      pr.status = 'changes-requested';
      break;
    default:
      return { success: false, error: `Unknown review action: ${action}` };
  }
  
  // Set reviewed details
  pr.reviewedAt = new Date().toISOString();
  pr.reviewedBy = localStorage.getItem('userName') || 'Anonymous';
  
  if (comments) {
    pr.comments = comments;
  }
  
  // If approved, create an actual GitHub PR
  let prUrl = null;
  let prNumber = null;
  
  if (action === 'approve') {
    try {
      const GitHubService = await this.getGitHubService();
      
      if (GitHubService && GitHubService.isAuthenticated) {
        try {
          await GitHubService.addFiles();
          await GitHubService.commit(`PR: ${pr.title}`);
          await GitHubService.push();
          
          const prResult = await GitHubService.createPullRequest(
            pr.title,
            pr.description || `Pull request from KodeSesh session: ${pr.sessionId}`,
            pr.sourceBranch || '',
            pr.targetBranch || 'main'
          );
          
          if (prResult.success) {
            prUrl = prResult.url;
            prNumber = prResult.number;
            
            pr.prUrl = prUrl;
            pr.prNumber = prNumber;
          }
        } catch (error) {
          console.error('Error creating GitHub PR:', error);
        }
      }
    } catch (error) {
      console.error('Error loading GitHubService:', error);
    }
  }
  
  // Save changes
  this.savePRs();
  
  // Map action to proper event name
  let eventName;
  switch (action) {
    case 'approve':
      eventName = 'pr-approved';
      break;
    case 'reject':
      eventName = 'pr-rejected';
      break;
    case 'request-changes':
      eventName = 'pr-changes-requested';
      break;
    default:
      eventName = `pr-${action}d`;
  }
  
  // Notify local subscribers
  this.notifySubscribers(eventName, pr);
  
  // IMPORTANT: Broadcast the review action to other users
  this.broadcastPR(eventName, pr);
  
  return { 
    success: true, 
    review: pr,
    prUrl,
    prNumber,
    action: action
  };
}
  
  // Get GitHubService (dynamic import to avoid circular dependencies)
  async getGitHubService() {
    try {
      // Try different ways to access GitHubService
      
      // First check if it's available in window
      if (window.GitHubService) {
        return window.GitHubService;
      }
      
      // Try to import it dynamically
      try {
        const module = await import('../service/GitHubService');
        return module.default;
      } catch (importError) {
        console.warn('Could not import GitHubService:', importError);
      }
      
      // Last resort - try to get it from localStorage if someone saved it there
      const gitHubServiceString = localStorage.getItem('GitHubService');
      if (gitHubServiceString) {
        try {
          return JSON.parse(gitHubServiceString);
        } catch (parseError) {
          console.warn('Could not parse GitHubService from localStorage:', parseError);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting GitHubService:', error);
      return null;
    }
  }
  
  // Subscribe to PR events
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('Callback must be a function');
      return () => {}; // Return no-op unsubscribe function
    }
    
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  // Notify subscribers of events
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in PR event subscriber:', error);
      }
    });
  }
  
  // Request sync of PRs from other users (e.g., when joining a session)
  
  requestPRSync(sessionId) {
  try {
    // Get socket from window
    const socket = window.socket || window.socketConnection;
    
    if (socket && socket.connected) {
      console.log(`Requesting PR sync for session: ${sessionId}`);
      
      // Broadcast request for PRs
      socket.emit("requestPRSync", {
        sessionId,
        userId: localStorage.getItem("userId") || 'unknown'
      });
      
      // Share our PRs too
      const sessionPRs = this.getPRsBySession(sessionId);
      
      if (sessionPRs.length > 0) {
        sessionPRs.forEach(pr => {
          this.broadcastPR('pr-added', pr);
        });
      }
    }
  } catch (error) {
    console.warn("PR sync request error:", error);
  }
  
  return this.pullRequests;
}


  
  // Delete a PR
  deletePR(id) {
    const index = this.pullRequests.findIndex(pr => pr.id === id);
    
    if (index === -1) {
      return false;
    }
    
    const deletedPR = this.pullRequests[index];
    this.pullRequests.splice(index, 1);
    this.savePRs();
    
    // Notify subscribers
    this.notifySubscribers('pr-deleted', deletedPR);
    
    return true;
  }
  
  // Clear all PRs (for testing/development)
  clearAllPRs() {
    this.pullRequests = [];
    this.savePRs();
    this.notifySubscribers('pr-cleared', null);
    return true;
  }
}

// Create a singleton instance
const prService = new PRService();

// Add to window for easier access from other modules
window.PRService = prService;

export default prService;