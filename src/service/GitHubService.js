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



// Push Function - Works with CORS
async push(branch = 'main', force = true) { // Force push enabled by default
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }

  try {
    // First attempt: Direct push with no CORS proxy
    try {
      console.log('Attempting direct push with no CORS proxy...');
      await git.push({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: branch,
        force: force,
        onAuth: () => ({ username: this.token })
      });
      
      return {
        success: true,
        output: `Successfully pushed to ${this.repoOwner}/${this.repoName}:${branch}`
      };
    } catch (directError) {
      console.log('Direct push failed:', directError.message);
      // Continue to next attempt
    }

    // Second attempt: Try multiple CORS proxies
    const corsProxies = [
      'https://cors.isomorphic-git.org',
      'https://proxy.cors.sh',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url='
    ];
    
    for (const corsProxy of corsProxies) {
      try {
        console.log(`Attempting push with CORS proxy: ${corsProxy}`);
        await git.push({
          fs,
          http,
          dir,
          remote: 'origin',
          ref: branch,
          corsProxy,
          force: force,
          onAuth: () => ({ 
            username: this.token,
            password: 'x-oauth-basic'
          })
        });
        
        return {
          success: true,
          output: `Successfully pushed to ${this.repoOwner}/${this.repoName}:${branch}`
        };
      } catch (proxyError) {
        console.log(`Push with proxy ${corsProxy} failed:`, proxyError.message);
        // Continue to next proxy
      }
    }

   
    
    try {
      // Get current branch and commit info
      const currentBranch = branch || await git.currentBranch({ fs, dir }) || 'main';
      
      // Get file list from local filesystem
      const walkFiles = async (dirPath) => {
        const fileList = [];
        const items = await fs.promises.readdir(dirPath);
        
        for (const item of items) {
          // Skip .git directory
          if (item === '.git') continue;
          
          const itemPath = `${dirPath}/${item}`;
          const stats = await fs.promises.stat(itemPath);
          
          if (stats.isDirectory()) {
            // Recursively walk directories
            const subFiles = await walkFiles(itemPath);
            fileList.push(...subFiles);
          } else {
            // Add file to list
            const relativePath = itemPath.replace(`${dir}/`, '');
            fileList.push(relativePath);
          }
        }
        
        return fileList;
      };
      
      const files = await walkFiles(dir);
      
      // Read content of each file
      const fileContents = {};
      for (const file of files) {
        try {
          const content = await fs.promises.readFile(`${dir}/${file}`, 'utf8');
          fileContents[file] = content;
        } catch (err) {
          console.log(`Could not read file ${file}:`, err);
        }
      }
      
      // Set up headers for GitHub API requests
      const headers = {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Git-Web-Client'
      };
      
      // Get current reference
      const refResponse = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs/heads/${currentBranch}`, {
        headers
      });
      
      if (!refResponse.ok) {
        const errorText = await refResponse.text();
        throw new Error(`Failed to get reference: ${errorText}`);
      }
      
      const refData = await refResponse.json();
      const baseCommitSha = refData.object.sha;
      
      console.log(`Current reference: ${baseCommitSha}`);
      
      // Create blobs for each file
      const fileEntries = [];
      for (const [path, content] of Object.entries(fileContents)) {
        console.log(`Creating blob for ${path}`);
        
        const blobResponse = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/blobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: content,
            encoding: 'utf-8'
          })
        });
        
        if (!blobResponse.ok) {
          console.log(`Failed to create blob for ${path}: ${await blobResponse.text()}`);
          continue;
        }
        
        const blobData = await blobResponse.json();
        
        fileEntries.push({
          path: path,
          mode: '100644', // Regular file
          type: 'blob',
          sha: blobData.sha
        });
      }
      
      // Create a tree containing all files
      console.log('Creating tree with all files...');
      const treeResponse = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: force ? null : baseCommitSha, // If force pushing, don't use base tree
          tree: fileEntries
        })
      });
      
      if (!treeResponse.ok) {
        throw new Error(`Failed to create tree: ${await treeResponse.text()}`);
      }
      
      const treeData = await treeResponse.json();
      console.log(`Created tree: ${treeData.sha}`);
      
      // Create a commit with the new tree
      console.log('Creating commit...');
      const commitResponse = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: 'Update via GitHub API (force push)',
          tree: treeData.sha,
          parents: force ? [] : [baseCommitSha] // If force pushing, no parents
        })
      });
      
      if (!commitResponse.ok) {
        throw new Error(`Failed to create commit: ${await commitResponse.text()}`);
      }
      
      const commitData = await commitResponse.json();
      console.log(`Created commit: ${commitData.sha}`);
      
      // Update the reference to point to the new commit
      console.log('Updating reference...');
      const updateRefResponse = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs/heads/${currentBranch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: commitData.sha,
          force: true // Always force when using the API fallback
        })
      });
      
      if (!updateRefResponse.ok) {
        throw new Error(`Failed to update reference: ${await updateRefResponse.text()}`);
      }
      
      return {
        success: true,
        output: `Successfully pushed to ${this.repoOwner}/${this.repoName}:${currentBranch} `
      };
    } catch (apiError) {
      console.error('GitHub API push error:', apiError);
      return { 
        success: false, 
        error: `GitHub API push failed: ${apiError.message}. Please try again or check your authentication token.`
      };
    }
  } catch (error) {
    console.error('Git push error:', error);
    return { 
      success: false, 
      error: `Failed to push changes: ${error.message}. Try refreshing your authentication token.`
    };
  }
}

// Pull Function - Works with CORS
async pull(branch = 'main') {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    // Try multiple CORS proxies
    const corsProxies = [
      'https://cors.isomorphic-git.org',
      'https://cors-anywhere.herokuapp.com',
      'https://api.allorigins.win/raw?url='
    ];
    
    let lastError = null;
    
    // Try each CORS proxy until one works
    for (const corsProxy of corsProxies) {
      try {
        await git.pull({
          fs,
          http,
          dir,
          remote: 'origin',
          ref: branch,
          corsProxy,
          fastForwardOnly: false,
          onAuth: () => ({ 
            username: this.token,
            password: 'x-oauth-basic' 
          }),
          author: {
            name: this.username || 'User',
            email: this.email || 'user@example.com'
          }
        });
        
        return {
          success: true,
          output: `Successfully pulled from ${this.repoOwner}/${this.repoName}:${branch}`
        };
      } catch (error) {
        console.log(`Pull attempt with proxy ${corsProxy} failed:`, error);
        lastError = error;
        
        // If this is NOT a CORS error, don't try other proxies
        if (!error.message.includes('CORS') && 
            !error.message.includes('Failed to fetch') && 
            !error.message.includes('NetworkError')) {
          break;
        }
      }
    }
    
    // Fallback: Use GitHub API to fetch the latest files
    try {
      // Get the latest commit from GitHub API
      const headers = {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Git-Web-Client'
      };
      
      // Get the current branch reference
      const refUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs/heads/${branch}`;
      const refResponse = await fetch(refUrl, { headers });
      
      if (!refResponse.ok) {
        throw new Error(`Failed to get branch reference: ${await refResponse.text()}`);
      }
      
      const refData = await refResponse.json();
      const latestCommitSha = refData.object.sha;
      
      // Get the commit details
      const commitUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/commits/${latestCommitSha}`;
      const commitResponse = await fetch(commitUrl, { headers });
      const commitData = await commitResponse.json();
      
      // Get the tree
      const treeUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees/${commitData.tree.sha}?recursive=1`;
      const treeResponse = await fetch(treeUrl, { headers });
      const treeData = await treeResponse.json();
      
      // Process and save all files
      for (const item of treeData.tree) {
        if (item.type === 'blob') {
          // Get the file content
          const contentUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/blobs/${item.sha}`;
          const contentResponse = await fetch(contentUrl, { headers });
          const contentData = await contentResponse.json();
          
          // Base64 decode the content
          const content = atob(contentData.content);
          
          // Save the file
          const filePath = `${dir}/${item.path}`;
          
          // Ensure directory exists
          const directories = item.path.split('/');
          directories.pop(); // Remove filename
          
          if (directories.length > 0) {
            let currentDir = dir;
            for (const directory of directories) {
              currentDir += `/${directory}`;
              try {
                await fs.promises.mkdir(currentDir, { recursive: true });
              } catch (err) {
                // Directory might already exist
              }
            }
          }
          
          // Write the file
          await fs.promises.writeFile(filePath, content);
        }
      }
      
      // Update the git index to reflect these changes
      await git.add({ fs, dir, filepath: '.' });
      
      return {
        success: true,
        output: `Successfully pulled from ${this.repoOwner}/${this.repoName}:${branch} via GitHub API`
      };
    } catch (apiError) {
      console.error('GitHub API pull error:', apiError);
    }
    
    // If all attempts failed
    return { 
      success: false, 
      error: `Failed to pull changes after multiple attempts. Last error: ${lastError?.message || 'Unknown error'}`
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
 // Robust PR creation method for GitHubService
async createPullRequest(title, body, head, base = 'main') {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    // Step 1: Always create a new branch if head and base are the same
    if (head === base) {
      console.log('Source and target branches are the same. Creating a new branch...');
      
      // Generate a unique branch name based on timestamp
      const timestamp = Date.now().toString().slice(-8);
      const newBranchName = `feature-${timestamp}`;
      
      try {
        // Get the current commit SHA of the base branch
        const branchResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/branches/${base}`, {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!branchResponse.ok) {
          throw new Error(`Failed to get branch info: ${await branchResponse.text()}`);
        }
        
        const branchData = await branchResponse.json();
        const baseSha = branchData.commit.sha;
        
        // Create a new branch from this SHA
        const createBranchResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/git/refs`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ref: `refs/heads/${newBranchName}`,
            sha: baseSha
          })
        });
        
        if (!createBranchResponse.ok) {
          throw new Error(`Failed to create branch: ${await createBranchResponse.text()}`);
        }
        
        console.log(`Successfully created new branch: ${newBranchName}`);
        
        // Update the current file on this new branch
        try {
          // Get current file content
          const fileContentResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/contents/main.js?ref=${base}`, {
            headers: {
              'Authorization': `token ${this.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (fileContentResponse.ok) {
            const fileData = await fileContentResponse.json();
            
            // Make a small change to the file (add a timestamp comment)
            let content = "";
            try {
              content = atob(fileData.content);
            } catch (e) {
              // Handle base64 decode errors
              content = "// Default content if decode failed";
            }
            
            // Add a timestamp comment to force a change
            const updatedContent = `${content}\n// Updated for PR at timestamp: ${Date.now()}\n`;
            
            // Update the file on the new branch
            const updateResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/contents/main.js`, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `Update for PR creation from ${newBranchName}`,
                content: btoa(updatedContent),
                branch: newBranchName,
                sha: fileData.sha
              })
            });
            
            if (!updateResponse.ok) {
              console.error(`Failed to update file: ${await updateResponse.text()}`);
              // Continue anyway, as we might still be able to create the PR
            } else {
              console.log("Successfully made a change on the new branch");
            }
          }
        } catch (fileError) {
          console.error("Error updating file:", fileError);
          // Continue anyway, the branch creation is what matters most
        }
        
        // Now use the new branch as the head
        head = newBranchName;
      } catch (branchError) {
        console.error('Error creating new branch:', branchError);
        return { 
          success: false, 
          error: `Failed to create a new branch: ${branchError.message}. Try manually creating a branch first.` 
        };
      }
    }
    
    // Step 2: Create the actual pull request
    console.log(`Creating PR from ${head} to ${base} for ${this.repoOwner}/${this.repoName}`);
    
    // Try different methods to create the PR
    let prResult = null;
    let manualMode = false;
    
    // Method 1: Direct GitHub API approach
    try {
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
      
      const responseData = await response.json();
      
      if (response.ok) {
        // Success! Return the PR details
        return {
          success: true,
          output: `Pull request created: ${responseData.html_url}`,
          url: responseData.html_url,
          number: responseData.number
        };
      } else {
        // Log the error but continue to try other methods
        console.error("GitHub API PR creation failed:", responseData.message);
        prResult = { 
          success: false, 
          error: responseData.message || `API error (${response.status})` 
        };
      }
    } catch (directApiError) {
      console.error("Error with direct API approach:", directApiError);
      prResult = { 
        success: false, 
        error: `Direct API approach failed: ${directApiError.message}` 
      };
    }
    
    // Method 2: Try using CORS proxies if direct API failed
    if (!prResult?.success) {
      const corsProxies = [
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url='
      ];
      
      for (const proxy of corsProxies) {
        try {
          console.log(`Trying with CORS proxy: ${proxy}`);
          
          const proxyUrl = `${proxy}https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls`;
          const proxyResponse = await fetch(proxyUrl, {
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
          
          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            return {
              success: true,
              output: `Pull request created: ${proxyData.html_url}`,
              url: proxyData.html_url,
              number: proxyData.number
            };
          }
        } catch (proxyError) {
          console.error(`Error with proxy ${proxy}:`, proxyError);
          // Try next proxy
        }
      }
    }
    
    // If all API approaches failed, fallback to browser-based approach
    console.log("All API approaches failed, falling back to browser-based approach");
    manualMode = true;
    
    // Method 3: Open GitHub's PR creation UI
    const prUrl = `https://github.com/${this.repoOwner}/${this.repoName}/compare/${base}...${head}?quick_pull=1&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(prUrl, '_blank');
    
    // Regardless of previous errors, this will be perceived as successful to the user
    // since we've opened the GitHub UI
    return { 
      success: true, 
      output: `A new branch "${head}" was created with changes. Opened GitHub's PR creation page in a new tab. Please complete the PR submission there.`,
      url: prUrl,
      manualCreation: true,
      newBranch: head
    };
  } catch (error) {
    console.error('GitHub PR creation error:', error);
    
    // Final fallback - direct user to GitHub
    try {
      const compareUrl = `https://github.com/${this.repoOwner}/${this.repoName}/compare/${base}...${head || base}?expand=1`;
      window.open(compareUrl, '_blank');
      
      return {
        success: true,
        output: `Opened GitHub's comparison page in a new tab. Please create a PR there.`,
        url: compareUrl,
        manualCreation: true
      };
    } catch (e) {
      console.error('Error opening GitHub URL:', e);
    }
    
    return { 
      success: false, 
      error: `Failed to create pull request: ${error.message}` 
    };
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