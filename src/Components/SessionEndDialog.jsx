import React, { useState, useEffect } from 'react';
import {
  Github,
  GitPullRequest,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  Loader,
  RefreshCw,
  GitBranch,

} from 'lucide-react';
import prService from '../service/PRService';

const SessionEndDialog = ({ 
  isOpen, 
  onClose, 
  sessionId, 
  userName, 
  code,
  language,
  addToTerminal,
  isGitAuthenticated = false,
  setIsGitAuthenticated,
  gitOperations,
  githubUser,
    prCommandHandler // Add this prop
}) => {
  const [authenticating, setAuthenticating] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const ensurePRBroadcast = (prData) => {
  // Make sure we have a socket
  const socket = window.socket || window.socketConnection;
  
  if (socket && socket.connected && prData && prData.sessionId) {
    console.log('Ensuring PR is broadcast:', prData.id);
    
    // Manual broadcast in addition to the PRService broadcast
    socket.emit("prSync", {
      sessionId: prData.sessionId,
      eventType: 'pr-added',
      prData: prData
    });
    
    // Also make a direct request to all participants to sync PRs
    socket.emit("requestPRSync", {
      sessionId: prData.sessionId,
      userId: localStorage.getItem("userId") || 'unknown'
    });
    
    return true;
  }
  
  return false;
};
  
  // Debug log when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log("Session End Dialog opened, auth status:", isGitAuthenticated);
      if (isGitAuthenticated && githubUser) {
        console.log("User is already authenticated:", githubUser);
      }
    }
  }, [isOpen, isGitAuthenticated, githubUser]);
  
  // Effect to handle authentication status changes
  useEffect(() => {
    if (isGitAuthenticated && authenticating) {
      setAuthenticating(false);
      
      // Show success message
      setMessage({
        type: 'success',
        text: 'GitHub authentication successful!'
      });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  }, [isGitAuthenticated, authenticating]);
  
  // Handle ending session without PR
  const handleEndWithoutPR = () => {
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'output',
        content: 'Session ended. No pull request was created.'
      });
      
      addToTerminal({
        type: 'output',
        content: `Files have been saved locally. Language: ${language}, Session ID: ${sessionId}`
      });
      
      addToTerminal({
        type: 'output',
        content: `Session ended by: ${userName || 'Anonymous'}`
      });
    }
    onClose();
  };
  
  // Handle GitHub authentication
  const handleAuth = () => {
    setAuthenticating(true);
    
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'input',
        content: 'git auth'
      });
    }
    
    if (gitOperations && typeof gitOperations.authenticate === 'function') {
      try {
        const authPromise = gitOperations.authenticate();
        
        if (authPromise && typeof authPromise.then === 'function') {
          authPromise
            .then(result => {
              if (typeof addToTerminal === 'function') {
                addToTerminal({
                  type: result.success ? 'output' : 'error',
                  content: result.success ? result.output : result.error
                });
              }
              
              if (!result.success) {
                setAuthenticating(false);
                setMessage({
                  type: 'error',
                  text: result.error || 'Authentication failed'
                });
                setShowMessage(true);
                setTimeout(() => setShowMessage(false), 3000);
              }
            })
            .catch(error => {
              console.error("Authentication error:", error);
              setAuthenticating(false);
              
              if (typeof addToTerminal === 'function') {
                addToTerminal({
                  type: 'error',
                  content: `Authentication error: ${error.message}`
                });
              }
              
              setMessage({
                type: 'error',
                text: `Authentication error: ${error.message}`
              });
              setShowMessage(true);
              setTimeout(() => setShowMessage(false), 3000);
            });
        } else {
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: 'output',
              content: 'Authentication process initiated...'
            });
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthenticating(false);
        
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'error',
            content: `Authentication error: ${error.message}`
          });
        }
        
        setMessage({
          type: 'error',
          text: `Authentication error: ${error.message}`
        });
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } else {
      console.error("Git operations authenticate method not available");
      setAuthenticating(false);
      
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'error',
          content: 'Git operations not available. Please refresh the page and try again.'
        });
      }
      
      setMessage({
        type: 'error',
        text: 'Git operations not available'
      });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };
  
  // Handle PR creation
  const handleCreatePR = async () => {
    setCreatingPR(true);
    
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'input',
        content: 'pr create'
      });
      
      addToTerminal({
        type: 'output',
        content: 'Creating pull request... This might take a few moments.'
      });
    }
    
    // Make sure everything is committed and pushed before creating PR
    if (gitOperations) {
      try {
        // Add all files
        if (typeof gitOperations.add === 'function') {
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: 'output',
              content: 'Adding files to staging area...'
            });
          }
          
          const addResult = await gitOperations.add();
          
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: addResult.success ? 'output' : 'error',
              content: addResult.success ? addResult.output : addResult.error
            });
          }
          
          if (!addResult.success) {
            throw new Error(addResult.error || 'Failed to add files');
          }
        }
        
        // Commit changes
        if (typeof gitOperations.commit === 'function') {
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: 'output',
              content: 'Committing changes...'
            });
          }
          
          const commitResult = await gitOperations.commit();
          
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: commitResult.success ? 'output' : 'error',
              content: commitResult.success ? commitResult.output : commitResult.error
            });
          }
          
          if (!commitResult.success) {
            throw new Error(commitResult.error || 'Failed to commit changes');
          }
        }
        
        // Push changes
        if (typeof gitOperations.push === 'function') {
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: 'output',
              content: 'Pushing changes to remote repository...'
            });
          }
          
          const pushResult = await gitOperations.push();
          
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: pushResult.success ? 'output' : 'error',
              content: pushResult.success ? pushResult.output : pushResult.error
            });
          }
          
          if (!pushResult.success) {
            throw new Error(pushResult.error || 'Failed to push changes');
          }
        }
      } catch (error) {
        console.error("Error preparing for PR:", error);
        
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'error',
            content: `Error preparing for PR: ${error.message}`
          });
        }
      }
    }
    
    if (gitOperations && typeof gitOperations.createPullRequest === 'function') {
      try {
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'output',
            content: 'Creating pull request on GitHub...'
          });
        }
        
        gitOperations.createPullRequest()
          .then(result => {
            setCreatingPR(false);
            
            if (typeof addToTerminal === 'function') {
              addToTerminal({
                type: result.success ? 'output' : 'error',
                content: result.success ? result.output : result.error
              });
              
              if (result.success && result.url) {
                addToTerminal({
                  type: 'output',
                  content: `PR URL: ${result.url}`
                });
              }
            }
            
            if (result.success) {
              setMessage({
                type: 'success',
                text: result.output || 'Pull request created successfully!'
              });
              setShowMessage(true);
              setTimeout(() => {
                setShowMessage(false);
                onClose();
              }, 2000);
            } else {
              setMessage({
                type: 'error',
                text: result.error || 'Failed to create pull request'
              });
              setShowMessage(true);
              setTimeout(() => setShowMessage(false), 3000);
            }
          })
          .catch(error => {
            console.error("PR creation error:", error);
            setCreatingPR(false);
            
            if (typeof addToTerminal === 'function') {
              addToTerminal({
                type: 'error',
                content: `Error creating PR: ${error.message}`
              });
            }
            
            setMessage({
              type: 'error',
              text: `Error creating PR: ${error.message}`
            });
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
          });
      } catch (error) {
        console.error("PR creation error:", error);
        setCreatingPR(false);
        
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'error',
            content: `Error creating PR: ${error.message}`
          });
        }
        
        setMessage({
          type: 'error',
          text: `Error creating PR: ${error.message}`
        });
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } else {
      console.error("Git operations createPullRequest method not available");
      setCreatingPR(false);
      
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'error',
          content: 'Git operations not available. Please refresh the page and try again.'
        });
      }
      
      setMessage({
        type: 'error',
        text: 'Git operations not available'
      });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };
  
  // Render status message toast
  const renderMessage = () => {
    if (!showMessage) return null;
    
    let bgColor, textColor, Icon;
    
    switch (message.type) {
      case 'error':
        bgColor = 'bg-red-900/40 border-red-500/40';
        textColor = 'text-red-400';
        Icon = AlertCircle;
        break;
      case 'info':
        bgColor = 'bg-blue-900/40 border-blue-500/40';
        textColor = 'text-blue-400';
        Icon = Info;
        break;
      case 'success':
      default:
        bgColor = 'bg-green-900/40 border-green-500/40';
        textColor = 'text-green-400';
        Icon = CheckCircle;
    }
    
    return (
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-sm ${bgColor} border shadow-lg rounded-lg p-3 z-50 animate-slideIn backdrop-blur-md`}>
        <div className="flex items-start space-x-3">
          <Icon size={18} className={textColor} />
          <div className="flex-1">
            <p className={`${textColor} text-sm font-medium`}>{message.text}</p>
          </div>
        </div>
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50" style={{ pointerEvents: 'auto' }}>
      {/* Main dialog container - centered with fixed positioning */}
      <div className="bg-gray-900 border border-cyan-500/20 rounded-2xl shadow-2xl p-6 max-w-md w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden z-50">
        {/* Glowing backdrop effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-cyan-900/20 opacity-50"></div>
        
        {/* Animated glow lines */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 blur opacity-30 animate-pulse"></div>
        
        {/* Close button */}
    
        
        {/* Content container with z-index to appear above effects */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6 flex items-center bg-gradient-to-r from-gray-900/90 via-indigo-900/30 to-cyan-900/20 py-3 px-4 -mx-4 -mt-3 rounded-t-xl border-b border-cyan-800/30">
            <div className="bg-cyan-900/30 p-2 rounded-md mr-3 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <GitPullRequest size={16} className="text-cyan-400" />
            </div>
            <span className="text-cyan-300 tracking-wider uppercase font-bold text-sm">SESSION ENDING</span>
          </div>
          
          {/* Content */}
          <div className="space-y-5">
            <p className="text-gray-300">
              The session is now ending. To Persist your changes, you can create a pull request on GitHub.
            </p>
            
            {/* Info box with futuristic design */}
            <div className="p-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/20 rounded-lg text-xs backdrop-blur-sm">
              <div className="flex">
                <Info size={16} className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-medium">Important</p>
                  <p className="text-gray-300 mt-1">Please login to GitHub first to save your changes as a pull request.</p>
                </div>
              </div>
            </div>
            
            {/* GitHub Status with futuristic design */}
            <div className="flex items-center py-2 px-3 text-gray-300 text-sm bg-gradient-to-r from-indigo-900/30 to-cyan-900/20 rounded-lg border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              <div className="bg-cyan-900/40 p-1.5 rounded-md mr-2 flex items-center justify-center">
                <GitBranch size={14} className="text-cyan-400" />
              </div>
              <span className="text-xs">GitHub Status: </span>
              <span className={`text-xs ml-1 font-medium ${isGitAuthenticated ? 'text-green-400' : 'text-yellow-400'}`}>
                {isGitAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
              
            </div>
          </div>
          
          {/* Actions with futuristic design */}
          <div className="mt-6">
            {isGitAuthenticated ? (
              // Show PR button when authenticated
              <div className="flex justify-end space-x-4">
                <button 
                  className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300"
                  onClick={handleEndWithoutPR}
                >
                  End Without PR
                </button>
                
                {/* PR button with futuristic design */}
                {/* <button 
                  className="flex items-center py-2 px-4 bg-gradient-to-r from-indigo-600/50 to-cyan-600/50 hover:from-indigo-600/70 hover:to-cyan-600/70 rounded-lg text-gray-100 text-xs border border-cyan-500/30 transition-all duration-300 shadow-lg shadow-cyan-500/20"
                  onClick={handleCreatePR}
                  disabled={creatingPR}
                >
                  {creatingPR ? (
                    <>
                      <Loader size={14} className="mr-2 animate-spin" />
                      <span>Creating PR...</span>
                    </>
                  ) : (
                    <>
                      <GitPullRequest size={14} className="mr-2 text-cyan-300" />
                      <span>Create Pull Request</span>
                    </>
                  )}
                </button> */}
                {/* Add this button for PR creation */}
  {/* <button 
  className="flex items-center py-2 px-4 bg-gradient-to-r from-indigo-600/50 to-cyan-600/50 hover:from-indigo-600/70 hover:to-cyan-600/70 rounded-lg text-gray-100 text-xs border border-cyan-500/30 transition-all duration-300 shadow-lg shadow-cyan-500/20"
  onClick={() => {
    // Prompt user for a custom PR title
    const userTitle = prompt("Enter a title for your pull request:", "Session End Changes");
    
    // If user cancels the prompt, don't proceed
    if (userTitle === null) {
      return;
    }

    // Generate a timestamp suffix to ensure uniqueness
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    
    // Combine user title with timestamp for uniqueness
    const uniqueTitle = `${userTitle} - ${timestamp}`;
    
    // Create a PR through terminal command
    if (typeof addToTerminal === 'function') {
      addToTerminal({
        type: 'input',
        content: `pr create ${uniqueTitle}`
      });
      
      // Call PR command handler if available via parent component
      if (prCommandHandler?.current) {
        prCommandHandler.current.handleCommand('create', [uniqueTitle]);
      } else {
        // Fallback if PR command handler is not available
        addToTerminal({
          type: 'output',
          content: 'PR command handler not available. Session ended without creating PR.'
        });
      }
    }
    
    onClose();
  }}
>
  <GitPullRequest size={14} className="mr-2 text-cyan-300" />
  <span>Create Pull Request</span>
</button> */}



<button 
  className="flex items-center py-2 px-4 bg-gradient-to-r from-indigo-600/50 to-cyan-600/50 hover:from-indigo-600/70 hover:to-cyan-600/70 rounded-lg text-gray-100 text-xs border border-cyan-500/30 transition-all duration-300 shadow-lg shadow-cyan-500/20"
  onClick={async () => {
    // Set creating state
    setCreatingPR(true);
    
    try {
      // Generate a timestamp for uniqueness
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
      
      // Create default PR title with session info
      const defaultTitle = `Session ${sessionId || ''} - ${timestamp}`;
      
      // Prompt user for a custom PR title with the default
      const userTitle = prompt("Enter a title for your pull request:", defaultTitle);
      
      // If user cancels the prompt, don't proceed
      if (userTitle === null) {
        setCreatingPR(false);
        return;
      }
      
      // Log to terminal
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'input',
          content: `Creating pull request: "${userTitle}"`
        });
        
        addToTerminal({
          type: 'output',
          content: 'Starting PR creation process...'
        });
      }
      
      // Create PR description
      const prDescription = `
Pull request from KodeSesh session: ${sessionId || 'unknown'}
Author: ${userName || 'Anonymous'}
Language: ${language || 'Unknown'}
Created: ${new Date().toISOString()}
      `.trim();
      
      // IMPORTANT: Create local PR record FIRST to ensure it's visible to all users
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'output',
          content: 'Creating local PR record...'
        });
      }
      
      // Create a unique branch name for this PR
      const safeTitlePart = userTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 20);
      const branchName = `pr-${safeTitlePart}-${timestamp}`;
      
      // Create local PR record using PRService
      const localPR = prService.createPR({
        title: userTitle,
        description: prDescription,
        sessionId: sessionId,
        author: userName || 'Anonymous',
        authorId: localStorage.getItem("userId"),
        sourceBranch: branchName,
        targetBranch: 'main',
        code: code,
        language: language,
        files: [`main.${language === 'python' ? 'py' : 'js'}`]
      });
      
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'output',
          content: `Local PR record created with ID: ${localPR.id}`
        });
      }
      
      // Now try to create the PR on GitHub if authenticated
      if (gitOperations && typeof gitOperations.createPullRequest === 'function' && isGitAuthenticated) {
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'output',
            content: 'Attempting to create GitHub PR...'
          });
        }
        
        try {
          // Step 1: Make sure the code file exists with session code
          try {
            const fileContent = code || `// Session ${sessionId || ''} code\n// Created by ${userName || 'Anonymous'}\n// Language: ${language || 'javascript'}\n`;
            const filePath = `main.${language === 'python' ? 'py' : 'js'}`;
            
            if (typeof addToTerminal === 'function') {
              addToTerminal({
                type: 'output',
                content: `Preparing code file: ${filePath}...`
              });
            }
            
            // Write the file to the local filesystem
            await gitOperations.fs.promises.writeFile(`${gitOperations.dir}/${filePath}`, fileContent);
          } catch (fileError) {
            console.warn('File preparation warning:', fileError);
            
            if (typeof addToTerminal === 'function') {
              addToTerminal({
                type: 'warning',
                content: `File preparation note: ${fileError.message}`
              });
            }
          }
          
          // Step 2: Prepare for GitHub PR creation
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: 'output',
              content: 'Preparing to push changes...'
            });
          }
          
          // Add all files
          await gitOperations.add();
          
          // Commit changes
          await gitOperations.commit(`PR: ${userTitle}`);
          
          // Push changes
          const pushResult = await gitOperations.push(branchName, true);
          
          if (!pushResult.success) {
            throw new Error(pushResult.error || 'Failed to push changes to GitHub');
          }
          
          // Create GitHub PR
          const prResult = await gitOperations.createPullRequest(
            userTitle,
            prDescription,
            branchName,
            'main'
          );
          
          if (prResult.success) {
            // Update local PR with GitHub details
            localPR.prUrl = prResult.url;
            localPR.prNumber = prResult.number;
            prService.savePRs();
            
            if (typeof addToTerminal === 'function') {
              addToTerminal({
                type: 'output',
                content: prResult.output
              });
              
              if (prResult.url) {
                addToTerminal({
                  type: 'output',
                  content: `PR URL: ${prResult.url}`
                });
              }
            }
            
            // Show success message
            setMessage({
              type: 'success',
              text: 'Pull request created successfully on GitHub!'
            });
          } else {
            throw new Error(prResult.error || 'Unknown GitHub PR creation error');
          }
        } catch (githubError) {
          console.error('GitHub PR creation error:', githubError);
          
          if (typeof addToTerminal === 'function') {
            addToTerminal({
              type: 'error',
              content: `GitHub PR error: ${githubError.message}`
            });
            
            addToTerminal({
              type: 'output',
              content: 'Local PR record was created successfully. The host can still review it.'
            });
          }
          
          // Show partial success message
          setMessage({
            type: 'info',
            text: 'PR created locally, but GitHub PR failed'
          });
        }
      } else {
        // Not authenticated with GitHub or no GitHub service
        if (typeof addToTerminal === 'function') {
          addToTerminal({
            type: 'output',
            content: 'Local PR record created. GitHub PR was skipped (not authenticated).'
          });
          
          addToTerminal({
            type: 'output',
            content: 'The host can still review your PR in the session.'
          });
        }
        
        // Show success message for local PR only
        setMessage({
          type: 'success',
          text: 'Pull request created for host review!'
        });
      }
      
      // Alternative PR creation using command handler (if needed)
      if (prCommandHandler && typeof prCommandHandler.handleCommand === 'function') {
        try {
          // This can be used as a supplementary method if needed
          // prCommandHandler.handleCommand('create', [userTitle]);
        } catch (cmdError) {
          console.error('PR command handler error:', cmdError);
        }
      }
      
      // Set success message and close dialog after delay
      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Overall PR process error:', error);
      
      if (typeof addToTerminal === 'function') {
        addToTerminal({
          type: 'error',
          content: `PR creation error: ${error.message}`
        });
      }
      
      // Show error message
      setMessage({
        type: 'error',
        text: `Error: ${error.message}`
      });
      setShowMessage(true);
      
      // Close dialog after longer delay
      setTimeout(() => {
        setShowMessage(false);
        onClose();
      }, 5000);
    } finally {
      // Always end creating state
      setCreatingPR(false);
    }
  }}
  disabled={creatingPR}
>
  {creatingPR ? (
    <>
      <Loader size={14} className="mr-2 animate-spin" />
      <span>Creating PR...</span>
    </>
  ) : (
    <>
      <GitPullRequest size={14} className="mr-2 text-cyan-300" />
      <span>Create Pull Request</span>
    </>
  )}
</button>
              </div>
            ) : (
              // Show GitHub Login button when not authenticated
              <div className="flex justify-between items-center">
                <button 
                  className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300"
                  onClick={handleEndWithoutPR}
                >
                  End Without PR
                </button>
                
                {/* GitHub login button with futuristic design */}
                <button 
                  className="flex items-center py-2 px-4 bg-gradient-to-r from-indigo-600/50 to-cyan-600/50 hover:from-indigo-600/70 hover:to-cyan-600/70 rounded-lg text-gray-100 text-xs border border-cyan-500/30 transition-all duration-300 shadow-lg shadow-cyan-500/20"
                  onClick={handleAuth}
                  disabled={authenticating}
                >
                  {authenticating ? (
                    <>
                      <Loader size={14} className="mr-2 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Github size={14} className="mr-2 text-white" />
                      <span>GitHub Login</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {renderMessage()}
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .transform-gpu {
          transform: translate3d(0, 0, 0);
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default SessionEndDialog;