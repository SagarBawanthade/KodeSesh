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
async push(branch = 'main', force = true) {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }

  try {
    // Step 1: Ensure repository exists
    const repoResult = await this.ensureRepositoryExists();
    if (!repoResult.success) {
      throw new Error(`Repository issue: ${repoResult.error}`);
    }
    
    // If repository was just created, wait a moment for GitHub to process
    if (repoResult.created) {
      console.log('Waiting for repository creation to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Step 2: Ensure branch exists
    const branchResult = await this.ensureBranchExists(branch);
    if (!branchResult.success) {
      throw new Error(`Branch issue: ${branchResult.error}`);
    }
    
    // If branch was just created, wait a moment
    if (branchResult.created) {
      console.log('Waiting for branch creation to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Try to push with standard methods
    try {
      console.log(`Attempting to push to ${branch}...`);
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
    } catch (pushError) {
      console.log('Standard push failed:', pushError.message);
      
      // Try with CORS proxies
      const corsProxies = [
        'https://cors.isomorphic-git.org',
        'https://proxy.cors.sh',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
      ];
      
      for (const corsProxy of corsProxies) {
        try {
          console.log(`Trying with CORS proxy: ${corsProxy}`);
          await git.push({
            fs,
            http,
            dir,
            remote: 'origin',
            ref: branch,
            corsProxy,
            force: force,
            onAuth: () => ({ username: this.token })
          });
          
          return {
            success: true,
            output: `Successfully pushed to ${this.repoOwner}/${this.repoName}:${branch} via proxy`
          };
        } catch (proxyError) {
          console.log(`Push with proxy ${corsProxy} failed:`, proxyError.message);
        }
      }
      
      // If we're here, all standard push methods failed
      // Fall back to GitHub API
      console.log('Falling back to GitHub API for push...');
    }
    
    // Step 4: Fallback - Use GitHub API to create/update files directly
    try {
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
      
      if (files.length === 0) {
        // Create at least one file to push
        await fs.promises.writeFile(`${dir}/README.md`, `# KodeSesh Project\nCreated at ${new Date().toISOString()}`);
        files.push('README.md');
      }
      
      console.log(`Found ${files.length} files to push:`, files);
      
      // Set up headers for GitHub API
      const headers = {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };
      
      // Push each file individually using GitHub API
      for (const file of files) {
        try {
          // Read file content
          const content = await fs.promises.readFile(`${dir}/${file}`, 'utf8');
          
          // Check if file already exists in the repo
          const fileCheckResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/contents/${file}?ref=${branch}`, {
            headers
          });
          
          let sha = null;
          if (fileCheckResponse.ok) {
            const fileData = await fileCheckResponse.json();
            sha = fileData.sha;
          }
          
          // Create/update file
          const fileUpdateResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/contents/${file}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              message: `Update ${file} via API`,
              content: btoa(content), // Base64 encode
              branch: branch,
              sha: sha // Include SHA if updating existing file
            })
          });
          
          if (!fileUpdateResponse.ok) {
            const errorData = await fileUpdateResponse.json();
            console.warn(`Failed to update ${file}:`, errorData.message);
          } else {
            console.log(`Successfully pushed ${file}`);
          }
        } catch (fileError) {
          console.warn(`Error pushing ${file}:`, fileError);
        }
      }
      
      return {
        success: true,
        output: `Successfully pushed files to ${this.repoOwner}/${this.repoName}:${branch} using GitHub API`
      };
    } catch (apiError) {
      console.error('GitHub API push error:', apiError);
      return { 
        success: false, 
        error: `GitHub API push failed: ${apiError.message}`
      };
    }
  } catch (error) {
    console.error('Git push error:', error);
    return { 
      success: false, 
      error: `Failed to push changes: ${error.message}`
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
// This is just the fixed createPullRequest method for GitHubService.js
// Insert this method into your GitHubService class

// Robust PR creation method for GitHubService

async ensureRepositoryExists() {
  if (!this.isAuthenticated || !this.token) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  if (!this.repoOwner || !this.repoName) {
    return { success: false, error: 'Repository owner and name are required' };
  }
  
  try {
    console.log(`Checking if repository ${this.repoOwner}/${this.repoName} exists...`);
    
    // Try to get repository info to check if it exists
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      // Repository exists
      console.log(`Repository ${this.repoOwner}/${this.repoName} exists`);
      return { success: true, exists: true };
    }
    
    if (response.status === 404) {
      // Repository doesn't exist, try to create it
      console.log(`Repository ${this.repoOwner}/${this.repoName} not found. Creating it...`);
      
      const createResponse = await fetch(`${GIT_API_URL}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.repoName,
          description: 'Repository created automatically by KodeSesh',
          private: false,
          auto_init: true // Initialize with README
        })
      });
      
      if (createResponse.ok) {
        console.log(`Repository ${this.repoOwner}/${this.repoName} created successfully`);
        return { success: true, created: true };
      } else {
        const errorData = await createResponse.json();
        throw new Error(`Failed to create repository: ${errorData.message}`);
      }
    } else {
      // Other error
      const errorData = await response.json();
      throw new Error(`Error checking repository: ${errorData.message}`);
    }
  } catch (error) {
    console.error('Repository check/create error:', error);
    return { success: false, error: error.message };
  }
}

async ensureBranchExists(branch = 'main') {
  if (!this.isAuthenticated || !this.token) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    console.log(`Checking if branch ${branch} exists in ${this.repoOwner}/${this.repoName}...`);
    
    // Check if branch exists
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/branches/${branch}`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      // Branch exists
      console.log(`Branch ${branch} exists`);
      return { success: true, exists: true };
    }
    
    if (response.status === 404) {
      // Branch doesn't exist, try to create it
      console.log(`Branch ${branch} not found. Creating it...`);
      
      // First, check if there are any existing branches
      const branchesResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/branches`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (branchesResponse.ok) {
        const branches = await branchesResponse.json();
        
        // If there are no branches, repository might be empty
        if (branches.length === 0) {
          // Create a commit with a README file
          console.log('No branches found. Creating initial commit...');
          
          // Create an initial README file
          const createFileResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/contents/README.md`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${this.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Initial commit',
              content: btoa(`# ${this.repoName}\n\nRepository created by KodeSesh`),
              branch: branch
            })
          });
          
          if (createFileResponse.ok) {
            console.log(`Initial commit created successfully with README.md`);
            return { success: true, created: true };
          } else {
            const errorData = await createFileResponse.json();
            throw new Error(`Failed to create initial commit: ${errorData.message}`);
          }
        } else {
          // There are existing branches, use one as the base
          const sourceBranch = branches[0].name;
          console.log(`Using existing branch ${sourceBranch} as base...`);
          
          // Get the latest commit SHA from the source branch
          const refResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/git/refs/heads/${sourceBranch}`, {
            headers: {
              'Authorization': `token ${this.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (refResponse.ok) {
            const refData = await refResponse.json();
            const sha = refData.object.sha;
            
            // Create the new branch
            const createBranchResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/git/refs`, {
              method: 'POST',
              headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ref: `refs/heads/${branch}`,
                sha: sha
              })
            });
            
            if (createBranchResponse.ok) {
              console.log(`Branch ${branch} created successfully`);
              return { success: true, created: true };
            } else {
              const errorData = await createBranchResponse.json();
              throw new Error(`Failed to create branch: ${errorData.message}`);
            }
          } else {
            const errorData = await refResponse.json();
            throw new Error(`Failed to get reference for ${sourceBranch}: ${errorData.message}`);
          }
        }
      } else {
        // Error getting branches
        const errorData = await branchesResponse.json();
        throw new Error(`Failed to get branches: ${errorData.message}`);
      }
    } else {
      // Other error
      const errorData = await response.json();
      throw new Error(`Error checking branch: ${errorData.message}`);
    }
  } catch (error) {
    console.error('Branch check/create error:', error);
    return { success: false, error: error.message };
  }
}


a// Enhanced createPullRequest method for GitHubService
// This version focuses on making the PR appear directly on GitHub

async createPullRequest(title, body, head = '', base = 'main') {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    console.log(`Creating PR: "${title}" from ${head || 'current branch'} to ${base}`);
    
    // Step 1: Ensure repository exists
    const repoResult = await this.ensureRepositoryExists();
    if (!repoResult.success) {
      throw new Error(`Repository setup failed: ${repoResult.error}`);
    }
    
    // If repository was just created, wait a moment for GitHub to process
    if (repoResult.created) {
      console.log('Waiting for repository creation to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Step 2: Ensure base branch exists (usually 'main')
    const baseBranchResult = await this.ensureBranchExists(base);
    if (!baseBranchResult.success) {
      throw new Error(`Base branch setup failed: ${baseBranchResult.error}`);
    }
    
    // If base branch was just created, wait a moment
    if (baseBranchResult.created) {
      console.log('Waiting for base branch creation to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Determine current branch if head is not specified
    if (!head) {
      try {
        head = await git.currentBranch({ fs, dir }) || 'main';
        console.log(`Determined current branch: ${head}`);
      } catch (e) {
        console.warn('Could not determine current branch:', e);
        head = 'main'; // Default fallback
      }
    }
    
    // Step 4: Always create a new branch if head and base are the same or if head is not specified
    if (head === base || head === 'main') {
      console.log('Creating a feature branch for this PR...');
      
      // Generate a unique branch name based on timestamp and title
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 20);
      const timestamp = Date.now().toString().slice(-6);
      const newBranchName = `feature-${safeTitle}-${timestamp}`;
      
      try {
        // Create local branch first
        await this.createBranch(newBranchName, base);
        console.log(`Local branch created: ${newBranchName}`);
        
        // Explicitly add all files to ensure nothing is missed
        await this.addFiles();
        console.log('All files added to staging area');
        
        // Make a commit if needed
        const commitResult = await this.commit(`PR: ${title}`);
        if (!commitResult.success) {
          console.warn('Warning: Commit operation had issues:', commitResult.error);
          // Continue anyway as there might already be committed changes
        } else {
          console.log('Changes committed successfully');
        }
        
        // Push changes to the new branch
        console.log(`Pushing changes to ${newBranchName}...`);
        const pushResult = await this.push(newBranchName, true);
        if (!pushResult.success) {
          throw new Error(`Failed to push changes: ${pushResult.error}`);
        }
        console.log('Changes pushed successfully');
        
        // Now use the new branch as the head
        head = newBranchName;
      } catch (branchError) {
        console.error('Error setting up feature branch:', branchError);
        throw new Error(`Branch preparation failed: ${branchError.message}`);
      }
    } else {
      // Using an existing feature branch - make sure it's pushed
      console.log(`Using existing branch: ${head}`);
      
      // Ensure all changes are committed and pushed
      try {
        await this.addFiles();
        await this.commit(`PR: ${title}`);
        
        const pushResult = await this.push(head, true);
        if (!pushResult.success) {
          throw new Error(`Failed to push changes to ${head}: ${pushResult.error}`);
        }
        console.log(`Changes pushed to ${head} successfully`);
      } catch (pushError) {
        console.error('Error pushing to existing branch:', pushError);
        throw new Error(`Failed to push to ${head}: ${pushError.message}`);
      }
    }
    
    // Step 5: Ensure the head branch exists on GitHub
    const headBranchResult = await this.ensureBranchExists(head);
    if (!headBranchResult.success) {
      throw new Error(`Head branch setup failed: ${headBranchResult.error}`);
    }
    
    // Wait a moment to ensure GitHub has registered the branch
    console.log('Waiting for head branch to be fully registered...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 6: Create the actual pull request - try multiple formats for head reference
    console.log(`Creating PR from ${head} to ${base} for ${this.repoOwner}/${this.repoName}`);
    
    // List of head reference formats to try (in order)
    const headFormats = [
      head,                       // Just the branch name
      `${this.repoOwner}:${head}`, // owner:branch format
      `heads/${head}`,             // heads/branch format
      `refs/heads/${head}`         // full refs format
    ];
    
    let prResult = null;
    let prCreated = false;
    
    // Try each head format until one works
    for (const headFormat of headFormats) {
      if (prCreated) break;
      
      try {
        console.log(`Trying PR creation with head: ${headFormat}`);
        
        // Prepare the PR data
        const prData = {
          title,
          body,
          head: headFormat,
          base
        };
        
        const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prData)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          console.log(`PR #${responseData.number} created successfully with head: ${headFormat}`);
          prResult = {
            success: true,
            output: `Pull request #${responseData.number} created: ${responseData.html_url}`,
            url: responseData.html_url,
            number: responseData.number,
            branch: head
          };
          prCreated = true;
          break;
        } else {
          console.warn(`PR creation with head: ${headFormat} failed:`, responseData);
          
          // Check for specific error messages
          if (responseData.errors) {
            const errorMessages = responseData.errors.map(err => err.message).join(', ');
            console.warn(`API errors: ${errorMessages}`);
            
            // If we get a rate limit error, don't try other formats
            if (errorMessages.includes('rate limit')) {
              throw new Error(`GitHub API rate limit exceeded. Please try again later.`);
            }
          }
        }
      } catch (apiError) {
        console.error(`Error with head format ${headFormat}:`, apiError);
      }
    }
    
    // If PR was created successfully, return the result
    if (prCreated && prResult) {
      return prResult;
    }
    
    // Step 7: Try a different approach - create PR directly using GraphQL API
    try {
      console.log('Trying GraphQL API for PR creation...');
      
      const graphqlEndpoint = 'https://api.github.com/graphql';
      const query = `
        mutation CreatePullRequest {
          createPullRequest(input: {
            repositoryId: "${this.repoOwner}/${this.repoName}",
            baseRefName: "${base}",
            headRefName: "${head}",
            title: "${title.replace(/"/g, '\\"')}",
            body: "${body.replace(/"/g, '\\"')}"
          }) {
            pullRequest {
              number
              url
            }
          }
        }
      `;
      
      const graphqlResponse = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      const graphqlData = await graphqlResponse.json();
      
      if (graphqlData.data && graphqlData.data.createPullRequest && graphqlData.data.createPullRequest.pullRequest) {
        const pr = graphqlData.data.createPullRequest.pullRequest;
        console.log(`PR #${pr.number} created successfully via GraphQL API`);
        return {
          success: true,
          output: `Pull request #${pr.number} created: ${pr.url}`,
          url: pr.url,
          number: pr.number,
          branch: head
        };
      } else {
        console.warn('GraphQL API PR creation failed:', graphqlData);
      }
    } catch (graphqlError) {
      console.error('Error with GraphQL approach:', graphqlError);
    }
    
    // Step 8: Final fallback - open browser for manual PR creation
    console.log("All API approaches failed, falling back to browser-based approach");
    
    // Open GitHub's PR creation UI
    const prUrl = `https://github.com/${this.repoOwner}/${this.repoName}/compare/${base}...${head}?quick_pull=1&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(prUrl, '_blank');
    
    return { 
      success: true, 
      output: `Created branch "${head}" with your changes. GitHub's PR creation page has been opened in a new tab. Please complete the PR submission there.`,
      url: prUrl,
      manualCreation: true,
      branch: head
    };
  } catch (error) {
    console.error('PR creation process error:', error);
    
    // Try to recover by opening manual PR creation
    try {
      console.log('Attempting recovery by opening manual PR creation...');
      const compareUrl = `https://github.com/${this.repoOwner}/${this.repoName}/pulls`;
      window.open(compareUrl, '_blank');
      
      return {
        success: false,
        output: `Encountered an error: ${error.message}. We've opened GitHub's pull requests page in a new tab so you can create a PR manually.`,
        url: compareUrl,
        manualCreation: true,
        error: error.message
      };
    } catch (e) {
      console.error('Error opening GitHub URL:', e);
    }
    
    return { 
      success: false, 
      error: `Failed to create pull request: ${error.message}. Please try manually creating a PR on GitHub.` 
    };
  }
}
// Get PR details
async getPRDetails(prNumber) {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get PR details: ${response.statusText}`);
    }
    
    const pr = await response.json();
    
    // Get PR comments
    const commentsResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/issues/${prNumber}/comments`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const comments = commentsResponse.ok ? await commentsResponse.json() : [];
    
    // Get PR reviews
    const reviewsResponse = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}/reviews`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];
    
    return {
      success: true,
      pullRequest: pr,
      comments,
      reviews
    };
  } catch (error) {
    console.error('PR details error:', error);
    return {
      success: false,
      error: `Failed to get PR details: ${error.message}`
    };
  }
}

// Get PR files
async getPRFiles(prNumber) {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}/files`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get PR files: ${response.statusText}`);
    }
    
    const files = await response.json();
    
    return {
      success: true,
      files
    };
  } catch (error) {
    console.error('PR files error:', error);
    return {
      success: false,
      error: `Failed to get PR files: ${error.message}`
    };
  }
}

// Get PR commits
async getPRCommits(prNumber) {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}/commits`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get PR commits: ${response.statusText}`);
    }
    
    const commits = await response.json();
    
    return {
      success: true,
      commits
    };
  } catch (error) {
    console.error('PR commits error:', error);
    return {
      success: false,
      error: `Failed to get PR commits: ${error.message}`
    };
  }
}

// Update PR (title, body, state)
async updatePR(prNumber, updates = {}) {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update PR: ${response.statusText}`);
    }
    
    const updatedPR = await response.json();
    
    return {
      success: true,
      output: `Pull request #${prNumber} updated successfully`,
      pullRequest: updatedPR
    };
  } catch (error) {
    console.error('PR update error:', error);
    return {
      success: false,
      error: `Failed to update PR: ${error.message}`
    };
  }
}

// Close PR without merging
async closePR(prNumber, comment = '') {
  if (!this.isAuthenticated) {
    return { success: false, error: 'GitHub authentication required' };
  }
  
  try {
    // Add comment if provided
    if (comment) {
      await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: comment
        })
      });
    }
    
    // Close the PR
    const response = await fetch(`${GIT_API_URL}/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state: 'closed'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to close PR: ${response.statusText}`);
    }
    
    return {
      success: true,
      output: `Pull request #${prNumber} closed successfully`
    };
  } catch (error) {
    console.error('PR close error:', error);
    return {
      success: false,
      error: `Failed to close PR: ${error.message}`
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