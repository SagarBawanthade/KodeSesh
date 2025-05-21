import PRService from '../service/PRService';
import GitHubService from '../service/GitHubService';

class PRCommandHandler {
  constructor(addToTerminal, showPRReviewPanel, getSessionData) {
    this.addToTerminal = addToTerminal || function() {};
    this.showPRReviewPanel = showPRReviewPanel || function() {};
    this.getSessionData = getSessionData || function() { return {}; };
  }
  
  async handleCommand(command, args = []) {
    // Log the command to the terminal
    this.addToTerminal({
      type: 'input',
      content: `pr ${command} ${args.join(' ')}`
    });
    
    switch (command) {
      case 'create':
      case 'new':
        await this.handleCreatePR(args);
        break;
      case 'list':
        this.handleListPRs();
        break;
      case 'review':
        this.handleReviewPR(args[0]);
        break;
      case 'status':
        this.handlePRStatus(args[0]);
        break;
      case 'help':
        this.showPRHelp();
        break;
      default:
        this.addToTerminal({
          type: 'error',
          content: `Unknown PR command: ${command}. Type 'pr help' for available commands.`
        });
    }
  }
  
  async handleCreatePR(args) {
    try {
      // Get session data
      const sessionData = this.getSessionData();
      const { sessionId, userName, code, language, isHost } = sessionData;
      
      if (!sessionId) {
        this.addToTerminal({
          type: 'error',
          content: 'Session ID is missing. Cannot create PR.'
        });
        return;
      }
      
      // Parse PR title from args or prompt
      let title = args.join(' ');
      if (!title) {
        this.addToTerminal({
          type: 'output',
          content: 'Please provide a title for your PR.'
        });
        return;
      }
      
      // Check if a PR with this title already exists
      // FIX: Check if PRService.prExists exists before calling it
      // If not implemented, we'll skip this check
      let prExists = false;
      if (PRService && typeof PRService.prExists === 'function') {
        prExists = PRService.prExists(title, sessionId);
      } else {
        // Alternative implementation if prExists is not available
        try {
          // Get all PRs and check title manually
          const allPRs = PRService && typeof PRService.getPRsBySession === 'function' 
            ? PRService.getPRsBySession(sessionId) 
            : (PRService && typeof PRService.getAllPRs === 'function' 
              ? PRService.getAllPRs() 
              : []);
              
          prExists = allPRs.some(pr => pr.title === title && pr.sessionId === sessionId);
        } catch (error) {
          console.warn("Error checking for existing PRs:", error);
          // Continue without checking for dupes
        }
      }
      
      if (prExists) {
        this.addToTerminal({
          type: 'error',
          content: `A PR with the title "${title}" already exists for this session.`
        });
        return;
      }
      
      // Prompt for description
      this.addToTerminal({
        type: 'output',
        content: 'Creating a new pull request...'
      });
      
      // Check if user is authenticated with GitHub
      let isAuthenticated = false;
      try {
        const userInfo = GitHubService && typeof GitHubService.getUserInfo === 'function'
          ? GitHubService.getUserInfo()
          : { isAuthenticated: false };
        isAuthenticated = userInfo.isAuthenticated;
      } catch (error) {
        console.warn("Error getting GitHub auth status:", error);
      }
      
      // If GitHub authenticated, try to create a GitHub PR
      let prNumber = null;
      let prUrl = null;
      
      if (isAuthenticated) {
        this.addToTerminal({
          type: 'output',
          content: 'Pushing changes to GitHub...'
        });
        
        try {
          // First ensure changes are committed
          if (GitHubService && typeof GitHubService.addFiles === 'function') {
            await GitHubService.addFiles();
          }
          
          if (GitHubService && typeof GitHubService.commit === 'function') {
            await GitHubService.commit(`PR: ${title}`);
          }
          
          // Push changes
          if (GitHubService && typeof GitHubService.push === 'function') {
            const pushResult = await GitHubService.push();
            
            if (!pushResult.success) {
              throw new Error(pushResult.error || 'Failed to push changes to GitHub');
            }
            
            this.addToTerminal({
              type: 'output',
              content: 'Creating GitHub pull request...'
            });
            
            // Create GitHub PR - can be improved with actual target branch selection
            if (GitHubService && typeof GitHubService.createPullRequest === 'function') {
              const createPrResult = await GitHubService.createPullRequest(
                title,
                `Pull request from KodeSesh session: ${sessionId}\n\nCreated by: ${userName || 'Anonymous'}\n\nLanguage: ${language}`,
                // Use the current branch or a new feature branch
                'feature-branch',
                'main'
              );
              
              if (createPrResult.success) {
                prNumber = createPrResult.number || null;
                prUrl = createPrResult.url || null;
                
                this.addToTerminal({
                  type: 'output',
                  content: `GitHub pull request created: ${prUrl}`
                });
              } else {
                this.addToTerminal({
                  type: 'error',
                  content: `Failed to create GitHub PR: ${createPrResult.error}`
                });
              }
            }
          }
        } catch (error) {
          this.addToTerminal({
            type: 'error',
            content: `GitHub error: ${error.message}`
          });
        }
      }
      
      // Create local PR record
      const pr = {
        title,
        description: `Changes from session ${sessionId}`,
        sessionId,
        author: userName || 'Anonymous',
        authorId: localStorage.getItem('userId'),
        sourceBranch: 'feature-branch',
        targetBranch: 'main',
        code,
        language,
        prNumber,
        prUrl,
        files: [`main.${language === 'javascript' ? 'js' : 'py'}`],
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      let createdPR;
      
      // FIX: Check if PRService.createPR exists before calling it
      if (PRService && typeof PRService.createPR === 'function') {
        createdPR = PRService.createPR(pr);
      } else {
        // If PRService.createPR doesn't exist, create a simple local storage fallback
        const prs = JSON.parse(localStorage.getItem('pullRequests') || '[]');
        pr.id = `pr-${Date.now()}`;
        prs.push(pr);
        localStorage.setItem('pullRequests', JSON.stringify(prs));
        createdPR = pr;
      }
      
      this.addToTerminal({
        type: 'output',
        content: `Pull request created successfully! ID: ${createdPR.id || 'unknown'}`
      });
      
      // If user is host, suggest reviewing the PR
      if (isHost) {
        this.addToTerminal({
          type: 'output',
          content: 'Since you are the host, you can review this PR by typing "pr review"'
        });
      } else {
        this.addToTerminal({
          type: 'output',
          content: 'Your pull request is now waiting for review by the host.'
        });
      }
      
      // Return the created PR for reference
      return createdPR;
    } catch (error) {
      this.addToTerminal({
        type: 'error',
        content: `Error creating PR: ${error.message}`
      });
      console.error('PR creation error:', error);
    }
  }
  
  handleListPRs() {
    try {
      // Get session data
      const { sessionId } = this.getSessionData();
      
      // Get PRs for this session
      let prs = [];
      
      // FIX: Check if the needed methods exist
      if (PRService) {
        if (sessionId && typeof PRService.getPRsBySession === 'function') {
          prs = PRService.getPRsBySession(sessionId);
        } else if (typeof PRService.getAllPRs === 'function') {
          prs = PRService.getAllPRs();
        }
      }
      
      // Fallback to localStorage if PRService methods not available
      if (!prs.length) {
        try {
          const allPRs = JSON.parse(localStorage.getItem('pullRequests') || '[]');
          if (sessionId) {
            prs = allPRs.filter(pr => pr.sessionId === sessionId);
          } else {
            prs = allPRs;
          }
        } catch (error) {
          console.warn("Error reading PRs from localStorage:", error);
        }
      }
      
      if (prs.length === 0) {
        this.addToTerminal({
          type: 'output',
          content: 'No pull requests found.'
        });
        return;
      }
      
      // Display PRs in terminal
      this.addToTerminal({
        type: 'output',
        content: `Found ${prs.length} pull request(s):`
      });
      
      prs.forEach((pr, index) => {
        const statusEmoji = 
          pr.status === 'pending' ? '⏳' :
          pr.status === 'approved' ? '✅' :
          pr.status === 'rejected' ? '❌' :
          pr.status === 'merged' ? '🔄' : '❓';
          
        this.addToTerminal({
          type: 'output',
          content: `${index + 1}. ${statusEmoji} [${pr.status?.toUpperCase() || 'PENDING'}] "${pr.title}" by ${pr.author} (ID: ${pr.id})`
        });
      });
      
      this.addToTerminal({
        type: 'output',
        content: 'To review a PR, type "pr review <ID>"'
      });
    } catch (error) {
      this.addToTerminal({
        type: 'error',
        content: `Error listing PRs: ${error.message}`
      });
      console.error('PR listing error:', error);
    }
  }
  
  handleReviewPR(id) {
    try {
      // If ID is provided, check if it exists
      if (id) {
        let prExists = false;
        
        // FIX: Check if PRService.getPRById exists
        if (PRService && typeof PRService.getPRById === 'function') {
          const pr = PRService.getPRById(id);
          prExists = !!pr;
        } else {
          // Fallback to localStorage
          try {
            const allPRs = JSON.parse(localStorage.getItem('pullRequests') || '[]');
            prExists = allPRs.some(pr => pr.id === id);
          } catch (error) {
            console.warn("Error checking PR in localStorage:", error);
          }
        }
        
        if (!prExists) {
          this.addToTerminal({
            type: 'error',
            content: `Pull request with ID ${id} not found.`
          });
          return;
        }
      }
      
      // Open PR review panel
      if (typeof this.showPRReviewPanel === 'function') {
        this.showPRReviewPanel(true, id);
      }
      
      this.addToTerminal({
        type: 'output',
        content: 'Opening PR review panel...'
      });
    } catch (error) {
      this.addToTerminal({
        type: 'error',
        content: `Error reviewing PR: ${error.message}`
      });
      console.error('PR review error:', error);
    }
  }
  
  handlePRStatus(id) {
    try {
      if (!id) {
        this.addToTerminal({
          type: 'error',
          content: 'Please provide a PR ID. Usage: pr status <ID>'
        });
        return;
      }
      
      // Get PR by ID
      let pr = null;
      
      // FIX: Check if PRService.getPRById exists
      if (PRService && typeof PRService.getPRById === 'function') {
        pr = PRService.getPRById(id);
      } else {
        // Fallback to localStorage
        try {
          const allPRs = JSON.parse(localStorage.getItem('pullRequests') || '[]');
          pr = allPRs.find(pr => pr.id === id);
        } catch (error) {
          console.warn("Error getting PR from localStorage:", error);
        }
      }
      
      if (!pr) {
        this.addToTerminal({
          type: 'error',
          content: `Pull request with ID ${id} not found.`
        });
        return;
      }
      
      // Format date
      const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleString();
      };
      
      // Display PR details
      this.addToTerminal({
        type: 'output',
        content: `=== Pull Request Details ===`
      });
      
      this.addToTerminal({
        type: 'output',
        content: `Title: ${pr.title}`
      });
      
      this.addToTerminal({
        type: 'output',
        content: `Status: ${pr.status?.toUpperCase() || 'PENDING'}`
      });
      
      this.addToTerminal({
        type: 'output',
        content: `Author: ${pr.author}`
      });
      
      this.addToTerminal({
        type: 'output',
        content: `Created: ${formatDate(pr.createdAt)}`
      });
      
      if (pr.reviewedAt) {
        this.addToTerminal({
          type: 'output',
          content: `Reviewed: ${formatDate(pr.reviewedAt)}`
        });
      }
      
      this.addToTerminal({
        type: 'output',
        content: `Description: ${pr.description || 'None'}`
      });
      
      if (pr.comments) {
        this.addToTerminal({
          type: 'output',
          content: `Comments: ${pr.comments}`
        });
      }
      
      if (pr.prUrl) {
        this.addToTerminal({
          type: 'output',
          content: `GitHub PR: ${pr.prUrl}`
        });
      }
    } catch (error) {
      this.addToTerminal({
        type: 'error',
        content: `Error getting PR status: ${error.message}`
      });
      console.error('PR status error:', error);
    }
  }
  
  showPRHelp() {
    this.addToTerminal({
      type: 'output',
      content: `=== Pull Request Commands ===`
    });
    
    this.addToTerminal({
      type: 'output',
      content: `pr create <title> - Create a new pull request`
    });
    
    this.addToTerminal({
      type: 'output',
      content: `pr list - List all pull requests for this session`
    });
    
    this.addToTerminal({
      type: 'output',
      content: `pr review [ID] - Open the PR review panel (optional: focus on specific PR)`
    });
    
    this.addToTerminal({
      type: 'output',
      content: `pr status <ID> - Show detailed status of a pull request`
    });
    
    this.addToTerminal({
      type: 'output',
      content: `pr help - Show this help message`
    });
  }
}

export default PRCommandHandler;