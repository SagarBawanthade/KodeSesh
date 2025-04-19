import { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import FileExplorer from '../components/FileExplorer';
import EditorHeader from '../components/EditorHeader';
import CodeEditor from '../components/CodeEditor';
import CallPanel from '../components/CallPanel';
import TerminalPanel from '../components/TerminalPanel';
import { Link, useNavigate, useParams } from 'react-router-dom';
// Add these new imports
import { Buffer as BufferPolyfill } from 'buffer';
window.Buffer = BufferPolyfill;
// Then import isomorphic-git
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';

// Initialize file system (outside the component)
const fs = new FS('kodeSeshFS');
const dir = '/working-dir';
const GIT_API_URL = 'https://api.github.com'; 

const CodeEditorDashboard = () => {
  // State management
  const [code, setCode] = useState("// Start writing your code here!");
  const [selectedFile, setSelectedFile] = useState("main.js");
  const [currentLanguage, setCurrentLanguage] = useState("javascript"); // Default language
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCallPanelOpen, setIsCallPanelOpen] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState([
    { id: 1, name: "You", isHost: true, isMuted: false, isVideoOff: false },
  ]);
  const [socket, setSocket] = useState(null);
  const [gitStatus, setGitStatus] = useState([]);
const [currentBranch, setCurrentBranch] = useState('main');
const [commitMessage, setCommitMessage] = useState('');
const [isShowingGitPanel, setIsShowingGitPanel] = useState(false);
const [gitOperationInProgress, setGitOperationInProgress] = useState(false);

// Add these to your CodeEditorDashboard component state
const [gitAuthToken, setGitAuthToken] = useState(localStorage.getItem('githubToken') || '');
const [gitRepoOwner, setGitRepoOwner] = useState(localStorage.getItem('gitRepoOwner') || '');
const [gitRepoName, setGitRepoName] = useState(localStorage.getItem('gitRepoName') || '');
const [isGitAuthenticated, setIsGitAuthenticated] = useState(!!localStorage.getItem('githubToken'));



  const navigate = useNavigate();
  const { sessionId } = useParams();
  const activeSessionId = sessionId || "demo-session";


  // GitHub authentication function
// GitHub authentication function
// GitHub authentication function
const authenticateGitHub = async () => {
  const token = prompt('Enter your GitHub Personal Access Token (needs repo scope):');
  const owner = prompt('Enter the repository owner (username):');
  const repo = prompt('Enter the repository name:');
  
  if (token && owner && repo) {
    // Verify the token works before saving
    try {
      const testResponse = await fetch(`https://api.github.com/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!testResponse.ok) {
        throw new Error(`Token validation failed: ${testResponse.status} ${testResponse.statusText}`);
      }
      
      // Verify repo access
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
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
      
      // If we get here, both token and repo are valid
      localStorage.setItem('githubToken', token);
      localStorage.setItem('gitRepoOwner', owner);
      localStorage.setItem('gitRepoName', repo);
      
      setGitAuthToken(token);
      setGitRepoOwner(owner);
      setGitRepoName(repo);
      setIsGitAuthenticated(true);
      
      // Add success message to terminal
      const successEntry = { 
        type: 'output', 
        content: `Successfully authenticated with GitHub for repository ${owner}/${repo}`
      };
      setTerminalOutput(prev => [...prev, successEntry]);
      
      return { success: true, output: `Authentication successful for ${owner}/${repo}` };
      
    } catch (error) {
      // Add error message to terminal
      const errorEntry = { 
        type: 'error', 
        content: `GitHub authentication error: ${error.message}`
      };
      setTerminalOutput(prev => [...prev, errorEntry]);
      
      return { success: false, error: error.message };
    }
  } else {
    const errorEntry = { 
      type: 'error', 
      content: 'Authentication cancelled or incomplete information provided.'
    };
    setTerminalOutput(prev => [...prev, errorEntry]);
    
    return { 
      success: false, 
      error: 'Authentication cancelled or incomplete information provided.'
    };
  }
};

// Add a function to verify GitHub credentials
const verifyGitCredentials = async (token, owner, repo) => {
  try {
    const response = await fetch(`${GIT_API_URL}/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const repoData = await response.json();
      // Add success message to terminal
      const successEntry = { 
        type: 'output', 
        content: `Successfully connected to GitHub repository: ${repoData.full_name}`
      };
      setTerminalOutput(prev => [...prev, successEntry]);
    } else {
      throw new Error(`Failed to access repository: ${response.statusText}`);
    }
  } catch (error) {
    // Add error message to terminal
    const errorEntry = { 
      type: 'error', 
      content: `GitHub authentication error: ${error.message}`
    };
    setTerminalOutput(prev => [...prev, errorEntry]);
    
    // Clear stored credentials
    localStorage.removeItem('githubToken');
    localStorage.removeItem('gitRepoOwner');
    localStorage.removeItem('gitRepoName');
    setIsGitAuthenticated(false);
  }
};



  
  // Set default code templates based on language
  const codeTemplates = {
    javascript: `console.log("Hello World");
`,
    python: `print("Hello World")

`
  };

  // Socket connection
  useEffect(() => {
    // Create socket connection
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      upgrade: true,
      forceNew: true,
    });
    
    setSocket(newSocket);
    
    // Set up event listeners once socket is created
    newSocket.on("connect", () => {
      console.log("Connected to server with ID:", newSocket.id);
      
      // Join the session
      newSocket.emit("joinSession", activeSessionId);
      
      // Join as a participant
      const userId = localStorage.getItem("userId") || Date.now().toString();
      localStorage.setItem("userId", userId); // Ensure userId is saved
      const userName = localStorage.getItem("userName") || "Anonymous";
      
      newSocket.emit("userJoined", {
        userId,
        name: userName,
        isHost: !sessionId, // If no sessionId in URL, treat as host
        sessionId: activeSessionId
      });
      
      // Request current participants
      newSocket.emit("getParticipants", activeSessionId);

      // Request current language state from server/host
      newSocket.emit("getLanguageState", activeSessionId);
      
      // Request current terminal history from the host
      newSocket.emit("getTerminalHistory", activeSessionId);
    });
    
    // Listen for code updates
    newSocket.on("codeUpdate", (updatedCode) => {
      console.log("Received code update:", updatedCode);
      setCode(updatedCode);
    });
    
    // Listen for language updates (enhanced)
    newSocket.on("languageUpdate", (data) => {
      const updatedLanguage = typeof data === 'object' ? data.language : data;
      console.log("Received language update:", updatedLanguage);
      
      if (updatedLanguage && supportedLanguages.includes(updatedLanguage)) {
        setCurrentLanguage(updatedLanguage);
        
        // Update the code to match the language template if it's empty or just has the default
        const isDefaultJsCode = code === codeTemplates.javascript || code === "// Start writing your code here!";
        const isDefaultPyCode = code === codeTemplates.python;
        
        if (isDefaultJsCode || isDefaultPyCode) {
          setCode(codeTemplates[updatedLanguage]);
        }
        
        // Update file extension
        updateFileExtension(updatedLanguage);
      }
    });
    
    // Listen for code execution results from other users
    newSocket.on("executionResult", (result) => {
      console.log("Received execution result:", result);
      if (result.terminalEntries) {
        // Handle full terminal entries
        setTerminalOutput(prev => [...prev, ...result.terminalEntries]);
      } else {
        // Handle basic output format
        setTerminalOutput(prev => [...prev, 
          { type: 'output', content: result.output }
        ]);
      }
      
      // Ensure terminal is open to show the results
      if (!isTerminalOpen) {
        setIsTerminalOpen(true);
      }
    });
    
    // Listen for participants updates
    newSocket.on("participantsList", (participants) => {
      console.log("Received participants list:", participants);
      
      // Add our own participant if not already included
      const userId = localStorage.getItem("userId");
      const ownParticipant = participants.find(p => p.id.toString() === userId);
      
      if (!ownParticipant) {
        const myParticipant = {
          id: userId,
          name: localStorage.getItem("userName") || "You",
          isHost: !sessionId,
          isMuted: !isAudioOn,
          isVideoOff: !isVideoOn
        };
        setActiveParticipants([myParticipant, ...participants]);
      } else {
        setActiveParticipants(participants);
      }
    });
    
    // Listen for participant join
    newSocket.on("participantJoined", (participant) => {
      console.log("Participant joined:", participant);
      setActiveParticipants(prev => {
        // Check if participant already exists
        const exists = prev.some(p => p.id.toString() === participant.id.toString());
        if (exists) {
          return prev.map(p => p.id.toString() === participant.id.toString() ? participant : p);
        }
        // Add new participant
        return [...prev, participant];
      });
      
      // If this is a new participant and we're the host, initiate WebRTC
      if (participant.id.toString() !== localStorage.getItem("userId")) {
        newSocket.emit("rtcNewParticipant", {
          sessionId: activeSessionId,
          participantId: participant.id
        });
      }
    });

    // Listen for terminal updates from other participants
    newSocket.on("terminalUpdate", (data) => {
      console.log("Received terminal update:", data);
      if (data.sessionId === activeSessionId) {
        if (Array.isArray(data.entries)) {
          // Handle multiple entries (like when syncing full history)
          setTerminalOutput(prev => [...prev, ...data.entries]);
        } else if (data.entry) {
          // Handle single entry update
          setTerminalOutput(prev => [...prev, data.entry]);
        }
        
        // Ensure terminal is open if we're getting real-time updates
        if (!isTerminalOpen && data.entry?.type !== 'clear') {
          setIsTerminalOpen(true);
        }
        
        // Handle special commands
        if (data.entry?.type === 'clear') {
          setTerminalOutput([]);
        }
      }
    });
    
    // Listen for terminal history sync (when joining a session)
    newSocket.on("terminalHistory", (data) => {
      console.log("Received terminal history:", data);
      if (data.sessionId === activeSessionId && Array.isArray(data.history)) {
        setTerminalOutput(data.history);
      }
    });
    
    // Listen for participant leave
    newSocket.on("participantLeft", (participantId) => {
      console.log("Participant left:", participantId);
      setActiveParticipants(prev => prev.filter(p => p.id !== participantId));
    });
    
    // Listen for audio toggle events
    newSocket.on("audioToggled", ({ userId, isMuted }) => {
      console.log(`Participant ${userId} audio toggled, muted: ${isMuted}`);
      setActiveParticipants(prev => 
        prev.map(p => p.id.toString() === userId.toString() ? {...p, isMuted} : p)
      );
    });
    
    // Listen for video toggle events
    newSocket.on("videoToggled", ({ userId, isVideoOff }) => {
      console.log(`Participant ${userId} video toggled, off: ${isVideoOff}`);
      setActiveParticipants(prev => 
        prev.map(p => p.id.toString() === userId.toString() ? {...p, isVideoOff} : p)
      );
    });
    
    // Listen for screen sharing events
    newSocket.on("screenSharingStarted", ({ userId }) => {
      console.log(`Participant ${userId} started screen sharing`);
      setActiveParticipants(prev => 
        prev.map(p => p.id.toString() === userId.toString() ? {...p, isScreenSharing: true} : p)
      );
    });
    
    newSocket.on("screenSharingEnded", ({ userId }) => {
      console.log(`Participant ${userId} ended screen sharing`);
      setActiveParticipants(prev => 
        prev.map(p => p.id.toString() === userId.toString() ? {...p, isScreenSharing: false} : p)
      );
    });
    
    // Clean up on unmount
    return () => {
      console.log("Disconnecting socket");
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [activeSessionId]);

  // List of supported languages
  const supportedLanguages = ["javascript", "python"];

  // Initialize code based on selected language
  useEffect(() => {
    // Set initial code based on language
    setCode(codeTemplates[currentLanguage]);
    
    // Update file extension
    updateFileExtension(currentLanguage);
    
    // Initialize user info
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", Date.now().toString());
    }
    
    if (!localStorage.getItem("userName")) {
      localStorage.setItem("userName", "Anonymous");
    }
  }, []);

  // Update file extension based on language
  const updateFileExtension = (language) => {
    const extensions = {
      javascript: "js",
      python: "py"
    };
    
    setSelectedFile(`main.${extensions[language]}`);
  };

  // This effect runs when currentLanguage changes from any source
  useEffect(() => {
    if (socket && socket.connected) {
      console.log("Language changed to:", currentLanguage);
      
      // Update file extension
      updateFileExtension(currentLanguage);
      
      // Broadcast language change to other participants
      socket.emit("languageUpdate", {
        sessionId: activeSessionId,
        language: currentLanguage
      });
    }
  }, [currentLanguage]);

  // Simulated file structure
  const fileStructure = {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
         
        ]
      },
      { name: `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`, type: "file" },
    
    ]
  };

  // Event handlers
  const toggleTerminal = () => {
    setIsTerminalOpen(!isTerminalOpen);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket && socket.connected) {
      console.log("Sending code update for session:", activeSessionId);
      socket.emit("codeUpdate", { sessionId: activeSessionId, code: newCode });
    }
  };

  const toggleAudio = () => {
    const newAudioState = !isAudioOn;
    setIsAudioOn(newAudioState);
    
    // Update local participant state
    const userId = localStorage.getItem("userId");
    setActiveParticipants(prev => 
      prev.map(p => p.id.toString() === userId ? {...p, isMuted: !newAudioState} : p)
    );
    
    // Notify other participants via socket if connected
    if (socket && socket.connected) {
      socket.emit("audioToggled", {
        sessionId: activeSessionId,
        userId,
        isMuted: !newAudioState
      });
    }
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    // Update local participant state
    const userId = localStorage.getItem("userId");
    setActiveParticipants(prev => 
      prev.map(p => p.id.toString() === userId ? {...p, isVideoOff: !newVideoState} : p)
    );
    
    // Notify other participants via socket if connected
    if (socket && socket.connected) {
      socket.emit("videoToggled", {
        sessionId: activeSessionId,
        userId,
        isVideoOff: !newVideoState
      });
    }
  };
  
  // Terminal specific handlers
  const handleTerminalCommand = (command) => {
    // Handle terminal commands locally
    if (command.trim().toLowerCase() === 'clear') {
      // Clear the terminal
      setTerminalOutput([]);
      
      // Notify other participants
      if (socket && socket.connected) {
        socket.emit("terminalUpdate", {
          sessionId: activeSessionId,
          entry: { type: 'clear', content: 'clear' }
        });
      }
    } else {
      // Add command to terminal history
      const commandEntry = { type: 'input', content: command };
      setTerminalOutput(prev => [...prev, commandEntry]);
      
      // Broadcast command to other participants
      if (socket && socket.connected) {
        socket.emit("terminalUpdate", {
          sessionId: activeSessionId,
          entry: commandEntry
        });
      }

      if (command.startsWith('git ')) {
        const gitCommand = command.substring(4).trim();
        const [operation, ...args] = gitCommand.split(' ');
        
        switch (operation) {
          case 'auth':
            // Handle GitHub authentication
            authenticateGitHub();
            break;
          case 'status':
            performGitOperation('status');
            break;
          case 'branch':
            if (args.length >= 1) {
              const newBranch = args[0];
              const startPoint = args.length >= 2 ? args[1] : currentBranch;
              performGitOperation('branch', { name: newBranch, startPoint });
            } else {
              const errorEntry = { 
                type: 'error', 
                content: `'git branch' requires a branch name` 
              };
              setTerminalOutput(prev => [...prev, errorEntry]);
            }
            break;
          case 'add':
            performGitOperation('add', { args: args.join(' ') || '.' });
            break;
          case 'commit':
            // Handle commit with -m flag
            if (args[0] === '-m' && args.length > 1) {
              const message = args.slice(1).join(' ');
              setCommitMessage(message);
              performGitOperation('commit', { message });
            } else {
              const msg = prompt('Enter commit message:', commitMessage || 'Update from KodeSesh');
              if (msg !== null) {
                setCommitMessage(msg);
                performGitOperation('commit', { message: msg });
              }
            }
            break;
          case 'push':
            performGitOperation('push', { branch: args[0] || currentBranch });
            break;
          case 'pull':
            performGitOperation('pull', { branch: args[0] || currentBranch });
            break;
          case 'merge':
            performGitOperation('merge', { branch: args[0] || 'develop' });
            break;
          case 'init':
            performGitOperation('init');
            break;
          default:
            // Unknown git operation
            const outputEntry = { 
              type: 'error', 
              content: `Unsupported git operation: ${operation}` 
            };
            setTerminalOutput(prev => [...prev, outputEntry]);
            
            // Broadcast output to other participants
            if (socket && socket.connected) {
              socket.emit("terminalUpdate", {
                sessionId: activeSessionId,
                entry: outputEntry
              });
            }
        }
        return; // Exit function early since we handled the git command
      }
      // Process command (add your command processing logic here)
      if (command.startsWith('run')) {
        executeCode();
      } else {
        // Basic command processor for demo purposes
        const outputEntry = { 
          type: 'output', 
          content: `Command '${command}' executed. Add your command processing logic here.` 
        };
        
        setTerminalOutput(prev => [...prev, outputEntry]);
        
        // Broadcast output to other participants
        if (socket && socket.connected) {
          socket.emit("terminalUpdate", {
            sessionId: activeSessionId,
            entry: outputEntry
          });
        }
      }
    }
  };
  
  // Handle clear terminal action
  const clearTerminal = () => {
    setTerminalOutput([]);
    
    // Notify other participants
    if (socket && socket.connected) {
      socket.emit("terminalUpdate", {
        sessionId: activeSessionId,
        entry: { type: 'clear', content: 'clear' }
      });
    }
  };
  
  // External API code execution
  const executeCode = async () => {
    if (isExecuting) return;
    
    // Create a command entry for terminal history
    const commandEntry = { 
      type: 'input', 
      content: `run ${currentLanguage === 'javascript' ? 'main.js' : 'main.py'}` 
    };
    
    // Add loading message entry
    const loadingEntry = { 
      type: 'output', 
      content: 'Executing code...' 
    };
    
    // Update local terminal with command and loading message
    const updatedHistory = [...terminalOutput, commandEntry, loadingEntry];
    setTerminalOutput(updatedHistory);
    
    // Broadcast command and loading message to other participants
    if (socket && socket.connected) {
      socket.emit("terminalUpdate", {
        sessionId: activeSessionId,
        entries: [commandEntry, loadingEntry]
      });
    }
    
    // Ensure terminal is open
    if (!isTerminalOpen) {
      setIsTerminalOpen(true);
    }
    
    // Set executing state
    setIsExecuting(true);
    
    try {
      // Map our language identifiers to the API's expected values
      const apiLanguage = {
        'javascript': 'javascript',
        'python': 'python3'
      }[currentLanguage];
      
      // Call the execution API
      const result = await executeCodeWithExternalAPI(code, apiLanguage);
      
      // Parse API response
      let output = '';
      let error = '';
      
      if (result.run) {
        output = result.run.stdout || '';
        error = result.run.stderr || '';
      } else {
        output = result.output || '';
        error = result.error || '';
      }
      
      // Create result entries
      const resultEntries = [];
      
      if (output) {
        resultEntries.push({ type: 'output', content: output });
      }
      
      if (error) {
        resultEntries.push({ type: 'error', content: error });
      }
      
      // Update local terminal by replacing the loading message with actual results
      const finalHistory = [
        ...updatedHistory.slice(0, -1), // Remove the loading message
        ...resultEntries
      ];
      
      setTerminalOutput(finalHistory);
      
      // Share command and results with other users via socket
      if (socket && socket.connected) {
        socket.emit("executionResult", { 
          sessionId: activeSessionId, 
          terminalEntries: resultEntries
        });
      }
    } catch (error) {
      console.error("Code execution error:", error);
      const errorEntry = { 
        type: 'error', 
        content: `Error executing code: ${error.message}` 
      };
      
      // Update local terminal
      const finalHistory = [
        ...updatedHistory.slice(0, -1), // Remove the loading message
        errorEntry
      ];
      
      setTerminalOutput(finalHistory);
      
      // Share error with other users
      if (socket && socket.connected) {
        socket.emit("executionResult", {
          sessionId: activeSessionId,
          terminalEntries: [errorEntry]
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Function to execute code using external API
  const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

  const executeCodeWithExternalAPI = async (code, language) => {
    try {
      console.log(`Executing ${language} code with Piston API`);
      
      const response = await fetch(`${PISTON_API_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: language,
          version: language === 'javascript' ? '18.x' : '3.10.0',
          files: [
            {
              content: code
            }
          ],
          stdin: '',
          args: [],
          compile_timeout: 10000,
          run_timeout: 10000
        })
      });
  
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("API Response:", result);
  
      // Handle the Piston API response structure properly
      return {
        output: result.run?.stdout || '',
        error: result.run?.stderr || '',
        exitCode: result.run?.code || 0
      };
    } catch (error) {
      console.error("Code execution API error:", error);
      return {
        output: '',
        error: `Execution failed: ${error.message}`,
        exitCode: 1
      };
    }
  };



  // Initialize the repository
const initRepo = async () => {
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
    
    // Create initial file if it doesn't exist
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    try {
      await fs.promises.writeFile(`${dir}/${fileName}`, code);
    } catch (e) {
      console.log('File already exists or could not be created');
    }
    
    return { success: true, output: 'Git repository initialized successfully' };
  } catch (error) {
    console.error('Git init error:', error);
    return { success: false, error: `Failed to initialize repository: ${error.message}` };
  }
};

// Configure Git remote (called by auth)
// Configure Git remote (helper function)
const configureRemote = async (owner, repoName, token) => {
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
    
    // Configure auth
    await git.setConfig({
      fs,
      dir,
      path: 'user.name',
      value: localStorage.getItem('userName') || 'KodeSesh User'
    });
    
    await git.setConfig({
      fs,
      dir,
      path: 'user.email',
      value: 'user@kodesesh.com'
    });
    
    // Set up remote with auth
    const url = `https://${token}@github.com/${owner}/${repoName}.git`;
    
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
    
    return { success: true, output: `Remote 'origin' configured for ${owner}/${repoName}` };
  } catch (error) {
    console.error('Git remote config error:', error);
    return { success: false, error: `Failed to configure remote: ${error.message}` };
  }
};

/// Check Git status
const checkGitStatus = async () => {
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
    
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    
    // Update file with current code
    await fs.promises.writeFile(`${dir}/${fileName}`, code);
    
    let status = '';
    try {
      // Get status
      status = await git.status({
        fs,
        dir,
        filepath: fileName
      });
    } catch (e) {
      console.log('Could not get status:', e);
      status = '*modified'; // Assume modified if error
    }
    
    console.log('Git status:', status);
    
    // Create status array for UI indicators
    const fileStatus = [
      { path: fileName, status: status === '*modified' ? 'modified' : status === '*added' ? 'added' : status }
    ];
    
    // Set the status in state for UI
    setGitStatus(fileStatus);
    
    let statusOutput = '';
    
    switch (status) {
      case '*added':
        statusOutput = `added: ${fileName}`;
        break;
      case '*modified':
        statusOutput = `modified: ${fileName}`;
        break;
      case '*deleted':
        statusOutput = `deleted: ${fileName}`;
        break;
      case '':
        statusOutput = `no changes: ${fileName}`;
        break;
      default:
        statusOutput = `${status}: ${fileName}`;
    }
    
    return {
      success: true,
      output: `On branch ${currentBranch}\nChanges:\n${statusOutput}`,
      status: fileStatus,
      branch: currentBranch
    };
  } catch (error) {
    console.error('Git status error:', error);
    return { success: false, error: `Failed to get git status: ${error.message}` };
  }
};

// Add files to staging
// Add files to staging
const addFiles = async (files = '.') => {
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
    
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    
    // Update file with current code
    await fs.promises.writeFile(`${dir}/${fileName}`, code);
    
    // Add file to git index
    await git.add({
      fs,
      dir,
      filepath: fileName
    });
    
    return { success: true, output: `Added ${fileName} to staging area` };
  } catch (error) {
    console.error('Git add error:', error);
    return { success: false, error: `Failed to add files: ${error.message}` };
  }
};

// Commit changes
// Commit changes
const commitChanges = async (message) => {
  try {
    // First add the changes
    const addResult = await addFiles();
    if (!addResult.success) {
      throw new Error(addResult.error);
    }
    
    // Author information
    const author = {
      name: localStorage.getItem('userName') || 'KodeSesh User',
      email: 'user@kodesesh.com'
    };
    
    // Commit changes
    const commitResult = await git.commit({
      fs,
      dir,
      message,
      author
    });
    
    // Check if commitResult and oid exist before using slice
    const commitId = commitResult && commitResult.oid 
      ? commitResult.oid.slice(0, 7) 
      : 'latest';
    
    return {
      success: true,
      output: `[${currentBranch}] ${message}`
    };
  } catch (error) {
    console.error('Git commit error:', error);
    return { success: false, error: `Failed to commit changes: ${error.message}` };
  }
};

// Pull changes from remote using GitHub API (no CORS issues)
const pullChanges = async (branch = 'main') => {
  try {
    if (!isGitAuthenticated || !gitAuthToken) {
      throw new Error('GitHub authentication required. Use "git auth" to authenticate.');
    }
    
    if (!gitRepoOwner || !gitRepoName) {
      throw new Error('Repository information is missing. Please select a repository first.');
    }
    
    // Get the file content directly from GitHub API
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    
    // Add status messages to terminal
    const statusEntry = { 
      type: 'output', 
      content: `Pulling latest changes from ${gitRepoOwner}/${gitRepoName}:${branch}...` 
    };
    setTerminalOutput(prev => [...prev, statusEntry]);
    
    // Fetch file content from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/contents/${fileName}?ref=${branch}`,
      {
        headers: {
          'Authorization': `token ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (response.status === 404) {
      const noFileEntry = { 
        type: 'output', 
        content: `File '${fileName}' doesn't exist in the repository yet. Creating a new file.` 
      };
      setTerminalOutput(prev => [...prev, noFileEntry]);
      
      // Instead of throwing an error, we'll create the file when pushing later
      return {
        success: true,
        output: `Ready to create new file '${fileName}' in repository.`
      };
    }
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // GitHub stores content as base64
    const content = atob(data.content);
    
    // Update the code in editor
    setCode(content);
    
    // Update the local file
    try {
      // Create the directory first, handling any errors
      try {
        await fs.promises.mkdir(dir);
      } catch (dirErr) {
        // Directory might already exist, which is fine
        console.log('Directory might already exist:', dirErr);
      }
      
      // Now write the file
      await fs.promises.writeFile(`${dir}/${fileName}`, content);
    } catch (fsError) {
      console.error('Error writing file to local filesystem:', fsError);
      // This is not critical as we already updated the editor code
    }
    
    // Notify other users
    if (socket && socket.connected) {
      socket.emit("codeUpdate", { 
        sessionId: activeSessionId, 
        code: content 
      });
    }
    
    return {
      success: true,
      output: `Successfully pulled latest version of ${fileName} from ${gitRepoOwner}/${gitRepoName}:${branch}`
    };
  } catch (error) {
    console.error('Git pull error:', error);
    return { success: false, error: `Failed to pull changes: ${error.message}` };
  }
};

// Push changes to remote
const pushChanges = async (branch = 'main') => {
  try {
    if (!isGitAuthenticated || !gitAuthToken) {
      throw new Error('GitHub authentication required. Use "git auth" to authenticate.');
    }
    
    // First make sure changes are committed
    await commitChanges('Push from KodeSesh');
    
    try {
      // 1. Get the current content
      const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
      const fileContent = code;
      
      console.log(`Pushing to GitHub: ${gitRepoOwner}/${gitRepoName}, branch: ${branch}, file: ${fileName}`);
      
      // 2. First check if the file already exists on GitHub
      let sha = null;
      try {
        const checkResponse = await fetch(`https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/contents/${fileName}?ref=${branch}`, {
          headers: {
            'Authorization': `token ${gitAuthToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (checkResponse.status === 401) {
          // Token is invalid - clear auth and prompt for new credentials
          localStorage.removeItem('githubToken');
          setGitAuthToken('');
          setIsGitAuthenticated(false);
          throw new Error('GitHub authentication failed. Please re-authenticate with a valid token.');
        }
        
        if (checkResponse.ok) {
          const fileData = await checkResponse.json();
          sha = fileData.sha;
          console.log(`File exists, sha: ${sha}`);
        }
      } catch (e) {
        if (e.message.includes('authentication failed')) {
          throw e; // Re-throw auth errors
        }
        console.log('File does not exist yet or other error:', e);
      }
      
      // 3. Create or update the file using GitHub API
      const response = await fetch(`https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/contents/${fileName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update from KodeSesh',
          content: btoa(unescape(encodeURIComponent(fileContent))), // Properly encode content to handle Unicode
          branch: branch,
          sha: sha // Include sha if updating an existing file
        })
      });
      
      if (response.status === 401) {
        // Token is invalid
        localStorage.removeItem('githubToken');
        setGitAuthToken('');
        setIsGitAuthenticated(false);
        throw new Error('GitHub authentication failed. Please re-authenticate with a valid token.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `HTTP error ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error ${response.status}: ${errorText}`;
        }
        throw new Error(`GitHub API error: ${errorMessage}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        output: `Successfully pushed to ${gitRepoOwner}/${gitRepoName}:${branch}`
      };
      
    } catch (error) {
      console.error('GitHub API error:', error);
      return { success: false, error: `Failed to push changes: ${error.message}` };
    }
    
  } catch (error) {
    console.error('Git push error:', error);
    return { success: false, error: `Failed to push changes: ${error.message}` };
  }
};


const mergeChanges = async (branch = 'develop') => {
  try {
    if (!isGitAuthenticated || !gitAuthToken) {
      // Authentication check
      const authEntry = { 
        type: 'output', 
        content: 'GitHub authentication required. Initiating OAuth flow...' 
      };
      setTerminalOutput(prev => [...prev, authEntry]);
      handleGitHubAuth();
      return { success: false, error: 'Authentication required. Please complete the GitHub authentication.' };
    }
    
    if (!gitRepoOwner || !gitRepoName) {
      return { success: false, error: 'Repository information is missing. Please select a repository first.' };
    }
    
    // First, check if both branches exist
    const statusEntry = { 
      type: 'output', 
      content: `Checking branches '${currentBranch}' and '${branch}'...` 
    };
    setTerminalOutput(prev => [...prev, statusEntry]);
    
    // Check if the destination branch exists
    const baseBranchResponse = await fetch(
      `https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/branches/${currentBranch}`,
      {
        headers: {
          'Authorization': `Bearer ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (baseBranchResponse.status === 404) {
      const branchErrorEntry = { 
        type: 'error', 
        content: `Branch '${currentBranch}' does not exist in the repository.` 
      };
      setTerminalOutput(prev => [...prev, branchErrorEntry]);
      return { success: false, error: `Branch '${currentBranch}' does not exist.` };
    }
    
    // Check if the source branch exists
    const headBranchResponse = await fetch(
      `https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/branches/${branch}`,
      {
        headers: {
          'Authorization': `Bearer ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (headBranchResponse.status === 404) {
      const branchErrorEntry = { 
        type: 'error', 
        content: `Branch '${branch}' does not exist in the repository.` 
      };
      setTerminalOutput(prev => [...prev, branchErrorEntry]);
      return { success: false, error: `Branch '${branch}' does not exist.` };
    }
    
    // If both branches exist, proceed with merge
    const mergeEntry = { 
      type: 'output', 
      content: `Attempting to merge '${branch}' into '${currentBranch}'...` 
    };
    setTerminalOutput(prev => [...prev, mergeEntry]);
    
    const response = await fetch(`https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/merges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gitAuthToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base: currentBranch,
        head: branch,
        commit_message: `Merge ${branch} into ${currentBranch} via KodeSesh`
      })
    });
    
    if (response.status === 204) {
      // 204 means already merged (nothing to merge)
      const alreadyMergedEntry = { 
        type: 'output', 
        content: `Branch '${branch}' is already merged into '${currentBranch}'` 
      };
      setTerminalOutput(prev => [...prev, alreadyMergedEntry]);
      
      return {
        success: true,
        output: `Branch '${branch}' is already merged into '${currentBranch}'`
      };
    }
    
    if (response.status === 409) {
      // Conflict
      const conflictEntry = { 
        type: 'error', 
        content: `Merge conflict between '${branch}' and '${currentBranch}'` 
      };
      setTerminalOutput(prev => [...prev, conflictEntry]);
      
      return {
        success: false,
        error: `Merge conflict detected. Please resolve conflicts manually.`
      };
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error (${response.status})`);
    }
    
    // Successfully merged
    const mergeData = await response.json();
    
    // Now pull the changes to update local files
    await pullChanges(currentBranch);
    
    const successEntry = { 
      type: 'output', 
      content: `Successfully merged '${branch}' into '${currentBranch}'` 
    };
    setTerminalOutput(prev => [...prev, successEntry]);
    
    return {
      success: true,
      output: `Successfully merged '${branch}' into '${currentBranch}'`
    };
  } catch (error) {
    console.error('Git merge error:', error);
    
    const errorEntry = { 
      type: 'error', 
      content: `Failed to merge changes: ${error.message}` 
    };
    setTerminalOutput(prev => [...prev, errorEntry]);
    
    return { success: false, error: `Failed to merge changes: ${error.message}` };
  }
};


// Add this function to create a branch if it doesn't exist
const createBranch = async (branchName, fromBranch = 'main') => {
  try {
    if (!isGitAuthenticated || !gitAuthToken) {
      return { success: false, error: 'GitHub authentication required.' };
    }
    
    // First get the SHA of the commit to branch from
    const shaResponse = await fetch(
      `https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/git/refs/heads/${fromBranch}`,
      {
        headers: {
          'Authorization': `Bearer ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!shaResponse.ok) {
      if (shaResponse.status === 404) {
        return { success: false, error: `Branch '${fromBranch}' does not exist.` };
      }
      throw new Error(`GitHub API error: ${shaResponse.status} ${shaResponse.statusText}`);
    }
    
    const shaData = await shaResponse.json();
    const sha = shaData.object.sha;
    
    // Create the new branch
    const createResponse = await fetch(
      `https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sha
        })
      }
    );
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || `API error (${createResponse.status})`);
    }
    
    const successEntry = { 
      type: 'output', 
      content: `Successfully created branch '${branchName}' from '${fromBranch}'` 
    };
    setTerminalOutput(prev => [...prev, successEntry]);
    
    return {
      success: true,
      output: `Successfully created branch '${branchName}' from '${fromBranch}'`
    };
  } catch (error) {
    console.error('Git branch creation error:', error);
    
    const errorEntry = { 
      type: 'error', 
      content: `Failed to create branch: ${error.message}` 
    };
    setTerminalOutput(prev => [...prev, errorEntry]);
    
    return { success: false, error: `Failed to create branch: ${error.message}` };
  }
};
// Function to perform Git operations via API
const performGitOperation = async (operation, params = {}) => {
  if (gitOperationInProgress) return;
  
  setGitOperationInProgress(true);
  
  // Create a command entry for terminal history
  const commandEntry = { 
    type: 'input', 
    content: `git ${operation} ${params.args || ''}` 
  };
  
  // Add loading message entry
  const loadingEntry = { 
    type: 'output', 
    content: `Executing git ${operation}...` 
  };
  
  // Update local terminal with command and loading message
  const updatedHistory = [...terminalOutput, commandEntry, loadingEntry];
  setTerminalOutput(updatedHistory);
  
  // Ensure terminal is open
  if (!isTerminalOpen) {
    setIsTerminalOpen(true);
  }
  
  try {
    // Example using GitHub REST API (in real implementation you'd need auth tokens)
    // In a production app, you might use a backend service or WebWorker with isomorphic-git
    let result;
    
    switch (operation) {
      case 'init':
        result = await initRepo();
        break;
        case 'branch':
          result = await createBranch(params.name, params.startPoint);
          break;
      case 'status':
        result = await checkGitStatus();
        break;
      case 'add':
        result = await addFiles(params.files || '.');
        break;
      case 'commit':
        result = await commitChanges(params.message || commitMessage || 'Update from KodeSesh');
        break;
      case 'push':
        result = await pushChanges(params.branch || currentBranch);
        break;
      case 'pull':
        result = await pullChanges(params.branch || currentBranch);
        break;
      case 'merge':
        result = await mergeChanges(params.branch || 'develop');
        break;
      default:
        result = { success: false, message: `Unknown git operation: ${operation}` };
    }
    
    // Create result entries
    const resultEntries = [];
    
    if (result.output) {
      resultEntries.push({ type: 'output', content: result.output });
    }
    
    if (result.error) {
      resultEntries.push({ type: 'error', content: result.error });
    }
    
    // Update local terminal by replacing the loading message with actual results
    const finalHistory = [
      ...updatedHistory.slice(0, -1), // Remove the loading message
      ...resultEntries
    ];
    
    setTerminalOutput(finalHistory);
    
    // Share command and results with other users via socket
    if (socket && socket.connected) {
      socket.emit("terminalUpdate", { 
        sessionId: activeSessionId, 
        entries: resultEntries
      });
    }
    
    // Update Git status if the operation was successful
    if (result.success && operation === 'status') {
      setGitStatus(result.status || []);
    }
    
    // Update current branch if branch info was returned
    if (result.branch) {
      setCurrentBranch(result.branch);
    }
    
  } catch (error) {
    console.error(`Git ${operation} error:`, error);
    const errorEntry = { 
      type: 'error', 
      content: `Error executing git ${operation}: ${error.message}` 
    };
    
    // Update local terminal
    const finalHistory = [
      ...updatedHistory.slice(0, -1), // Remove the loading message
      errorEntry
    ];
    
    setTerminalOutput(finalHistory);
    
    // Share error with other users
    if (socket && socket.connected) {
      socket.emit("terminalUpdate", {
        sessionId: activeSessionId,
        entries: [errorEntry]
      });
    }
  } finally {
    setGitOperationInProgress(false);
  }
};

// Git operations object
const gitOperations = {
  status: () => performGitOperation('status'),
  add: () => performGitOperation('add'),
  commit: () => {
    // Show commit message input dialog
    const message = prompt('Enter commit message:', commitMessage || 'Update from KodeSesh');
    if (message !== null) {
      setCommitMessage(message);
      performGitOperation('commit', { message });
    }
  },
  push: () => performGitOperation('push'),
  pull: () => performGitOperation('pull'),
  merge: () => {
    // Show branch input dialog
    const branch = prompt('Enter branch to merge from:', 'develop');
    if (branch !== null) {
      performGitOperation('merge', { branch });
    }
  },
  authenticate: () => authenticateGitHub(),
  toggleGitPanel: () => setIsShowingGitPanel(!isShowingGitPanel),
  isShowingGitPanel: isShowingGitPanel,
  isAuthenticated: isGitAuthenticated
};

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0f172a] to-[#0c0f1d] text-gray-100 overflow-hidden font-sans">
      {/* Ambient background effect */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiMyMDM1NWEiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-20 z-0 pointer-events-none"></div>
      
      {/* Main layout container */}
      <div className="flex flex-1 overflow-hidden z-10 relative">
        {/* Sidebar / File Explorer */}
        <div 
          className={`h-full backdrop-blur-md bg-[#0a101f]/80 border-r border-indigo-900/40 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0'}`}
        >
          {/* App Logo and Controls */}
          <div className="flex items-center justify-between p-3 border-b border-indigo-900/30 bg-gradient-to-r from-indigo-900/40 to-blue-900/30">
            <Link to="/" className="text-sm font-bold text-cyan-400 tracking-widest uppercase hover:text-cyan-300 transition-colors flex items-center space-x-2">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">KodeSesh</span>
            </Link>
            <FileExplorer.Controls toggleGitPanel={gitOperations.toggleGitPanel} />    </div>
          
          {/* File Tree */}
          <div className="overflow-y-auto h-full py-2 px-1">
            <FileExplorer 
              fileStructure={fileStructure} 
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              currentLanguage={currentLanguage}  
              gitOperations={gitOperations}  // Add this new prop
              currentBranch={currentBranch}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Header */}
          <div className="bg-gradient-to-r from-[#0f172a]/90 to-[#1e293b]/90 backdrop-blur-md border-b border-cyan-900/30 shadow-lg z-20">
          <EditorHeader 
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isTerminalOpen={isTerminalOpen}
            toggleTerminal={toggleTerminal}
            selectedFile={selectedFile}
            isCallPanelOpen={isCallPanelOpen}
            setIsCallPanelOpen={setIsCallPanelOpen}
            participantsCount={activeParticipants.length}
            currentLanguage={currentLanguage}
            setCurrentLanguage={setCurrentLanguage}
            executeCode={executeCode}    
            isExecuting={isExecuting}
            socket={socket}
            activeSessionId={activeSessionId}
          />
          </div>

          {/* Main Content with Editor and Call Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor and Terminal Container */}
            <div className={`flex flex-col transition-all duration-300 ${isCallPanelOpen ? 'w-8/12' : 'w-full'}`}>
              {/* Code Editor */}
              <div className={`flex-1 ${isTerminalOpen ? 'h-3/4' : 'h-full'} bg-[#0b111d]/90 backdrop-blur-md relative`}>
                {/* Line Numbers Decoration (Visual Only) */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-b from-blue-900/20 to-indigo-900/20 border-r border-indigo-900/30 z-0 hidden md:block">
                  <div className="h-full flex flex-col items-end pr-2 pt-1 text-cyan-500/50 text-xs">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="leading-6">{i + 1}</div>
                    ))}
                  </div>
                </div>
                
                {/* Editor Content */}
                <div className={`h-full ${isTerminalOpen ? 'border-b border-indigo-900/30' : ''}`}>
                  <CodeEditor 
                    code={code} 
                    onChange={handleCodeChange} 
                    language={currentLanguage}
                    gitStatus={gitStatus}  // Add this new prop
                  />
                </div>
              </div>

              {/* Terminal Panel */}
              {isTerminalOpen && (
                <div className="border-t border-cyan-900/30 bg-[#0a1121]/90 backdrop-blur-md" style={{ height: `${terminalHeight}px` }}>
                  <TerminalPanel 
                    isOpen={isTerminalOpen}
                    onClose={toggleTerminal}
                    height={terminalHeight}
                    onHeightChange={setTerminalHeight}
                    terminalHistory={terminalOutput}
                    setTerminalHistory={setTerminalOutput}
                    onClear={clearTerminal}
                    onCommand={handleTerminalCommand}
                    socket={socket}
                    sessionId={activeSessionId}
                  />
                </div>
              )}
            </div>

            {/* Call Panel */}
            {isCallPanelOpen && (
              <div className="w-4/12 border-l border-indigo-900/40 bg-gradient-to-b from-[#0c1529]/90 to-[#0a101f]/90 backdrop-blur-md">
                <CallPanel 
                  participants={activeParticipants}
                  isAudioOn={isAudioOn}
                  isVideoOn={isVideoOn}
                  toggleAudio={toggleAudio}
                  toggleVideo={toggleVideo}
                  socket={socket}
                  activeSessionId={activeSessionId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-xs flex items-center px-4 justify-between border-t border-cyan-500/50 shadow-[0_-5px_15px_rgba(6,182,212,0.2)] z-10">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-400 mr-2 shadow-[0_0_5px_#4ade80]"></div>
            <span>Session: {activeSessionId}</span>
          </div>
          <span>{selectedFile}</span>
          <span>Connected: {socket?.connected ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex space-x-4">
          <span>Participants: {activeParticipants.length}</span>
          <span>UTF-8</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-blue-200">
            {currentLanguage === 'javascript' ? 'JavaScript' : 'Python'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorDashboard;