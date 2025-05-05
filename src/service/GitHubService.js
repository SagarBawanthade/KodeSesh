// GitHubService.js - Handles GitHub API interactions
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';

// Initialize the filesystem
const fs = new FS('kodeSeshFS');
const dir = '/working-dir';

// GitHub API URL
const GIT_API_URL = 'https://api.github.com';

class GitHubService {
  constructor() {
    this.token = localStorage.getItem('githubToken') || '';
    this.repoOwner = localStorage.getItem('gitRepoOwner') || '';
    this.repoName = localStorage.getItem('gitRepoName') || '';
    this.isAuthenticated = !!this.token;
    this.user = null;
    
    // If we have a token, fetch user info on init
    if (this.isAuthenticated) {
      this.fetchUserInfo();
    }
  }
  
  // Get and initialize repository
  async initRepo() {
    try {
      // Create directory if it doesn't exist
      try {
        await fs.promises.mkdir(dir);
      } catch (e) {
        // Directory might already exist, that's fine
      }
      
      // Initialize git repo if not already initialized
      try {
        await git.init({ fs, dir });
      } catch (e) {
        // Repo might already be initialized
      }
      
      return { success: true, output: 'Git repository initialized successfully' };
    } catch (error) {
      console.error('Git init error:', error);
      return { success: false, error: `Failed to initialize repository: ${error.message}` };
    }
  }
  
  // Authenticate with GitHub using personal access token
  async authenticate(token, owner, repo) {
    if (!token) {
      return { success: false, error: 'Token is required' };
    }
    
    try {
      // Test the token by fetching user info
      const response = await fetch(`${GIT_API_URL}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      
      // Get user data
      const userData = await response.json();
      
      // Save token and user info
      this.token = token;
      this.user = {
        username: userData.login,
        avatarUrl: userData.avatar_url,
        name: userData.name || userData.login,
        url: userData.html_url
      };
      
      // Save to localStorage
      localStorage.setItem('githubToken', token);
      
      // If repo info is provided, validate it
      if (owner && repo) {
        const repoResponse = await fetch(`${GIT_API_URL}/repos/${owner}/${repo}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!repoResponse.ok) {
          if (repoResponse.status === 404) {
            throw new Error(`Repository ${owner}/${repo} not found or you don't have access to it.`);
          } else {
            throw new Error(`Repository validation failed: ${repoResponse.status} ${repoResponse.statusText}`);
          }
        }
        
        // Save repo info
        this.repoOwner = owner;
        this.repoName = repo;
        
        // Save to localStorage
        localStorage.setItem('gitRepoOwner', owner);
        localStorage.setItem('gitRepoName', repo);
      }
      
      // Set authenticated flag
      this.isAuthenticated = true;
      
      // Initialize repo
      await this.initRepo();
      
      // Configure remote
      if (this.repoOwner && this.repoName) {
        await this.configureRemote();
      }
      
      return { 
        success: true, 
        output: `Authenticated as ${this.user.username}${owner && repo ? ` for repository ${owner}/${repo}` : ''}`,
        user: this.user
      };
    } catch (error) {
      console.error('GitHub authentication error:', error);
      this.logout(); // Clear invalid credentials
      return { success: false, error: error.message };
    }
  }
  
  // Fetch user info from GitHub
  async fetchUserInfo() {
    if (!this.token) {
      return null;
    }
    
    try {
      const response = await fetch(`${GIT_API_URL}/user`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }
      
      const userData = await response.json();
      
      this.user = {
        username: userData.login,
        avatarUrl: userData.avatar_url,
        name: userData.name || userData.login,
        url: userData.html_url
      };
      
      return this.user;
    } catch (error) {
      console.error('Error fetching GitHub user info:', error);
      this.logout(); // Clear invalid credentials
      return null;
    }
  }
  
  // Logout - clear GitHub credentials
  logout() {
    this.token = '';
    this.user = null;
    this.isAuthenticated = false;
    
    // Clear localStorage
    localStorage.removeItem('githubToken');
    
    return { success: true, output: 'Logged out from GitHub' };
  }
  
  // Configure Git remote
  async configureRemote() {
    if (!this.isAuthenticated || !this.token || !this.repoOwner || !this.repoName) {
      return { success: false, error: 'Authentication or repository information is missing' };
    }
    
    try {
      // Initialize git repo if needed
      await this.initRepo();
      
      // Configure Git user
      await git.setConfig({
        fs,
        dir,
        path: 'user.name',
        value: this.user?.name || 'KodeSesh User'
      });
      
      await git.setConfig({
        fs,
        dir,
        path: 'user.email',
        value: this.user?.email || 'user@kodesesh.com'
      });
      
      // Set up remote with auth
      const url = `https://${this.token}@github.com/${this.repoOwner}/${this.repoName}.git`;
      
      try {
        await git.addRemote({
          fs,
          dir,
          remote: 'origin',
          url
        });
      } catch (e) {
        // Remote might already exist, try to update it
        await git.deleteRemote({ fs, dir, remote: 'origin' });
        await git.addRemote({
          fs,
          dir,
          remote: 'origin',
          url
        });
      }
      
      return { 
        success: true, 
        output: `Remote 'origin' configured for ${this.repoOwner}/${this.repoName}` 
      };
    } catch (error) {
      console.error('Git remote config error:', error);
      return { success: false, error: `Failed to configure remote: ${error.message}` };
    }
  }
  
  // Check Git status
  async checkStatus(filePath) {
    try {
      // Initialize if needed
      await this.initRepo();
      
      let status = '';
      try {
        // Get status
        status = await git.status({
          fs,
          dir,
          filepath: filePath
        });
      } catch (e) {
        console.log('Could not get status:', e);
        status = '*modified'; // Assume modified if error
      }
      
      console.log('Git status:', status);
      
      // Create status array for UI indicators
      const fileStatus = [
        { path: filePath, status: status === '*modified' ? 'modified' : status === '*added' ? 'added' : status }
      ];
      
      let statusOutput = '';
      
      switch (status) {
        case '*added':
          statusOutput = `added: ${filePath}`;
          break;
        case '*modified':
          statusOutput = `modified: ${filePath}`;
          break;
        case '*deleted':
          statusOutput = `deleted: ${filePath}`;
          break;
        case '':
          statusOutput = `no changes: ${filePath}`;
          break;
        default:
          statusOutput = `${status}: ${filePath}`;
      }
      
      // Try to get current branch
      let branch = 'main';
      try {
        const branches = await git.listBranches({ fs, dir });
        const currentBranch = await git.currentBranch({ fs, dir });
        branch = currentBranch || branch;
      } catch (e) {
        console.error('Error getting branch:', e);
      }
      
      return {
        success: true,
        output: `On branch ${branch}\nChanges:\n${statusOutput}`,
        status: fileStatus,
        branch
      };
    } catch (error) {
      console.error('Git status error:', error);
      return { success: false, error: `Failed to get git status: ${error.message}` };
    }
  }
  
  // Add files to staging
  async addFiles(filePath = '.') {
    try {
      // Initialize if needed
      await this.initRepo();
      
      // Add file to git index
      await git.add({
        fs,
        dir,
        filepath: filePath
      });
      
      return { success: true, output: `Added ${filePath} to staging area` };
    } catch (error) {
      console.error('Git add error:', error);
      return { success: false, error: `Failed to add files: ${error.message}` };
    }
  }
  
  // Commit changes
async commit(message = 'Update from KodeSesh') {
  try {
    // First check if there are staged changes
    const statusResult = await this.checkStatus('.');
    if (!statusResult.success) {
      throw new Error('Failed to check git status before commit');
    }
    
    // Author information
    const author = {
      name: this.user?.name || 'KodeSesh User',
      email: this.user?.email || 'user@kodesesh.com'
    };
    
    // Commit changes
    const commitResult = await git.commit({
      fs,
      dir,
      message,
      author
    });
    
    // Get current branch
    let branch = 'main';
    try {
      branch = await git.currentBranch({ fs, dir }) || branch;
    } catch (e) {
      console.error('Error getting branch:', e);
    }
    
    // Check if commitResult exists and has oid property
    let commitId = 'latest';
    if (commitResult && commitResult.oid) {
      commitId = commitResult.oid.slice(0, 7);
    } else {
      console.warn('Commit successful but no commit ID returned', commitResult);
    }
    
    return {
      success: true,
      output: `[${branch}] ${message} (${commitId})`,
      commitId: commitResult?.oid || null
    };
  } catch (error) {
    console.error('Git commit error:', error);
    return { success: false, error: `Failed to commit changes: ${error.message}` };
  }
}
  // Push changes to GitHub
  async push(branch = 'main') {
    if (!this.isAuthenticated) {
      return { success: false, error: 'GitHub authentication required' };
    }
    
    try {
      // Push to GitHub
      await git.push({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: branch,
        onAuth: () => ({ username: this.token })
      });
      
      return {
        success: true,
        output: `Successfully pushed to ${this.repoOwner}/${this.repoName}:${branch}`
      };
    } catch (error) {
      console.error('Git push error:', error);
      return { success: false, error: `Failed to push changes: ${error.message}` };
    }
  }
  
  // Pull changes from GitHub
  async pull(branch = 'main') {
    if (!this.isAuthenticated) {
      return { success: false, error: 'GitHub authentication required' };
    }
    
    try {
      // Pull from GitHub
      await git.pull({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: branch,
        onAuth: () => ({ username: this.token })
      });
      
      return {
        success: true,
        output: `Successfully pulled latest changes from ${this.repoOwner}/${this.repoName}:${branch}`
      };
    } catch (error) {
      console.error('Git pull error:', error);
      return { success: false, error: `Failed to pull changes: ${error.message}` };
    }
  }
  
  // Create a branch
  async createBranch(branchName, startPoint = 'main') {
    try {
      // Initialize if needed
      await this.initRepo();
      
      // Create branch
      await git.branch({
        fs,
        dir,
        ref: branchName,
        checkout: true
      });
      
      return {
        success: true,
        output: `Created and switched to branch '${branchName}'`
      };
    } catch (error) {
      console.error('Git branch error:', error);
      return { success: false, error: `Failed to create branch: ${error.message}` };
    }
  }
  
  // Merge branches
  async merge(fromBranch, toBranch = 'main') {
    try {
      // Initialize if needed
      await this.initRepo();
      
      // Switch to target branch
      await git.checkout({
        fs,
        dir,
        ref: toBranch
      });
      
      // Merge from source branch
      await git.merge({
        fs,
        dir,
        theirs: fromBranch,
        author: {
          name: this.user?.name || 'KodeSesh User',
          email: this.user?.email || 'user@kodesesh.com'
        }
      });
      
      return {
        success: true,
        output: `Successfully merged '${fromBranch}' into '${toBranch}'`
      };
    } catch (error) {
      console.error('Git merge error:', error);
      return { success: false, error: `Failed to merge branches: ${error.message}` };
    }
  }
  
  // Create a pull request
  async createPullRequest(title, body, head, base = 'main') {
    if (!this.isAuthenticated) {
      return { success: false, error: 'GitHub authentication required' };
    }
    
    try {
      // Create pull request using GitHub API
      const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error (${response.status})`);
      }
      
      const prData = await response.json();
      
      return {
        success: true,
        output: `Pull request created: ${prData.html_url}`,
        url: prData.html_url,
        number: prData.number
      };
    } catch (error) {
      console.error('GitHub PR creation error:', error);
      return { success: false, error: `Failed to create pull request: ${error.message}` };
    }
  }
  
  // Get user and repository info
  getUserInfo() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.user,
      repoOwner: this.repoOwner,
      repoName: this.repoName
    };
  }
}

// Export a singleton instance
const gitHubService = new GitHubService();
export default gitHubService;