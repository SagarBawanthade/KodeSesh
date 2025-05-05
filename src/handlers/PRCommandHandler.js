// handlers/PRCommandHandler.js
import GitHubService from '../service/GitHubService.js';

class PRCommandHandler {
  constructor(addToTerminal, setShowPRPanel, getSessionData) {
    this.addToTerminal = addToTerminal;
    this.setShowPRPanel = setShowPRPanel;
    this.getSessionData = getSessionData; // Function to get current session data (id, code, etc.)
  }

  // Handle PR related terminal commands
  async handleCommand(command, args) {
    if (!GitHubService.isAuthenticated) {
      this.addToTerminal({
        type: 'error',
        content: 'GitHub authentication required. Use "git auth" command first.'
      });
      return;
    }

    switch (command) {
      case 'create':
        await this.createPR();
        break;
      case 'list':
        await this.listPRs();
        break;
      case 'merge':
        if (args.length === 0) {
          this.addToTerminal({
            type: 'error',
            content: 'PR number required. Usage: pr merge <number>'
          });
          return;
        }
        const prNumber = parseInt(args[0]);
        if (isNaN(prNumber)) {
          this.addToTerminal({
            type: 'error',
            content: `Invalid PR number: ${args[0]}`
          });
          return;
        }
        await this.mergePR(prNumber);
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        this.addToTerminal({
          type: 'error',
          content: `Unknown PR command: ${command}. Try 'pr help' for available commands.`
        });
    }
  }

  // Create a PR from current session
  async createPR() {
    try {
      this.addToTerminal({
        type: 'output',
        content: 'Creating pull request from current session...'
      });
      
      const { sessionId, userName, code, language } = this.getSessionData();
      
      // Create a branch for this session
      const branchName = `session-${sessionId}-${userName}-${new Date().toISOString().split('T')[0]}`;
      const branchResult = await GitHubService.createBranch(branchName);
      
      if (!branchResult.success) {
        throw new Error(`Failed to create branch: ${branchResult.error}`);
      }
      
      this.addToTerminal({
        type: 'output',
        content: `Created branch: ${branchName}`
      });
      
      // Push code to the branch
      const fileName = `main.${language === 'javascript' ? 'js' : 'py'}`;
      const commitMessage = `Session ${sessionId} changes by ${userName}`;
      
      const pushResult = await GitHubService.pushFile(
        fileName,
        code,
        branchName,
        commitMessage
      );
      
      if (!pushResult.success) {
        throw new Error(`Failed to push code: ${pushResult.error}`);
      }
      
      this.addToTerminal({
        type: 'output',
        content: `Pushed code to branch: ${branchName}`
      });
      
      // Create PR
      const prTitle = `Session ${sessionId} changes by ${userName}`;
      const prBody = `This PR contains code changes from KodeSesh session ${sessionId}.\n\nParticipant: ${userName}\nSession Date: ${new Date().toLocaleDateString()}`;
      
      const prResult = await GitHubService.createPullRequest(
        prTitle,
        prBody,
        branchName
      );
      
      if (!prResult.success) {
        throw new Error(`Failed to create PR: ${prResult.error}`);
      }
      
      this.addToTerminal({
        type: 'output',
        content: `✅ Pull request #${prResult.prNumber} created successfully!`
      });
      
      this.addToTerminal({
        type: 'output',
        content: `PR URL: ${prResult.prUrl}`
      });
      
    } catch (error) {
      console.error('Create PR error:', error);
      this.addToTerminal({
        type: 'error',
        content: `Error creating pull request: ${error.message}`
      });
    }
  }

  // List PRs
  async listPRs() {
    try {
      this.addToTerminal({
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
      
      if (sessionPRs.length === 0) {
        this.addToTerminal({
          type: 'output',
          content: 'No session-related pull requests found.'
        });
        return;
      }
      
      // Output PRs to terminal
      this.addToTerminal({
        type: 'output',
        content: `Found ${sessionPRs.length} session-related pull requests:`
      });
      
      sessionPRs.forEach(pr => {
        this.addToTerminal({
          type: 'output',
          content: `#${pr.number} - ${pr.title}`
        });
        this.addToTerminal({
          type: 'output',
          content: `  Created by: ${pr.user.login} | URL: ${pr.html_url}`
        });
      });
      
      // Show PR panel if we're the host
      const { isHost } = this.getSessionData();
      if (isHost) {
        this.addToTerminal({
          type: 'output',
          content: 'Opening PR review panel...'
        });
        this.setShowPRPanel(true);
      }
      
    } catch (error) {
      console.error('List PRs error:', error);
      this.addToTerminal({
        type: 'error',
        content: `Error listing pull requests: ${error.message}`
      });
    }
  }

  // Merge a PR
  async mergePR(prNumber) {
    try {
      this.addToTerminal({
        type: 'output',
        content: `Merging pull request #${prNumber}...`
      });
      
      const { isHost } = this.getSessionData();
      if (!isHost) {
        this.addToTerminal({
          type: 'error',
          content: 'Only session hosts can merge pull requests.'
        });
        return;
      }
      
      const result = await GitHubService.mergePR(prNumber);
      
      if (!result.success) {
        if (result.needsManualMerge) {
          this.addToTerminal({
            type: 'error',
            content: `Merge conflict detected in PR #${prNumber}. Please resolve conflicts manually on GitHub.`
          });
          return;
        }
        throw new Error(result.error);
      }
      
      this.addToTerminal({
        type: 'output',
        content: `✅ Successfully merged pull request #${prNumber}`
      });
      
    } catch (error) {
      console.error('Merge PR error:', error);
      this.addToTerminal({
        type: 'error',
        content: `Error merging pull request: ${error.message}`
      });
    }
  }

  // Show PR command help
  showHelp() {
    this.addToTerminal({
      type: 'output',
      content: 'Pull Request Commands:'
    });
    
    this.addToTerminal({
      type: 'output',
      content: '  pr create - Create a pull request from current session'
    });
    
    this.addToTerminal({
      type: 'output',
      content: '  pr list - List session-related pull requests'
    });
    
    this.addToTerminal({
      type: 'output',
      content: '  pr merge <number> - Merge a pull request (host only)'
    });
    
    this.addToTerminal({
      type: 'output',
      content: '  pr help - Show this help'
    });
  }
}

export default PRCommandHandler;