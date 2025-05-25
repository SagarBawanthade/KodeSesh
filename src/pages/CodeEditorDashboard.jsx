import { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import FileExplorer from '../Components/FileExplorer';
import EditorHeader from '../Components/EditorHeader';
import CodeEditor from '../Components/CodeEditor';
import CallPanel from '../Components/CallPanel';
import TerminalPanel from '../Components/TerminalPanel';
import { Link, useParams } from 'react-router-dom';
import { Buffer as BufferPolyfill } from 'buffer';
window.Buffer = BufferPolyfill;
import * as git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
const fs = new FS('kodeSeshFS');
const dir = '/working-dir';
const GIT_API_URL = 'https://api.github.com'; 
import { useSelector } from 'react-redux';
import SessionEndDialog from '../Components/SessionEndDialog';
import GitAuthDialog from '../Components/GitAuthDialog';
import PRCommandHandler from '../handlers/PRCommandHandler.js';
import GitHubService from '../service/GitHubService.js';
import PRReviewPanel from '../Components/PRReviewPanel';
import { showNotification, requestNotificationPermission } from '../utils/notification.js';


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
  const [gitAuthToken, setGitAuthToken] = useState(localStorage.getItem('githubToken') || '');
  const [gitRepoOwner, setGitRepoOwner] = useState(localStorage.getItem('gitRepoOwner') || '');
  const [gitRepoName, setGitRepoName] = useState(localStorage.getItem('gitRepoName') || '');
  const [isGitAuthenticated, setIsGitAuthenticated] = useState(!!localStorage.getItem('githubToken'));
  const { sessionId } = useParams();
  const activeSessionId = sessionId || "demo-session";
  const [activeTypist, setActiveTypist] = useState(null);
  const [typingTimerId, setTypingTimerId] = useState(null);
  const [lastEditPosition, setLastEditPosition] = useState({ lineNumber: 0, column: 0 });
  const [userColors, setUserColors] = useState({});
  const { user } = useSelector((state) => state.user);
  const userId = user?._id || user?.id;
  const [typingParticipants, setTypingParticipants] = useState({});
  const [lastActivity, setLastActivity] = useState({});
  const [showSessionEndDialog, setShowSessionEndDialog] = useState(false);
  const [showPRReviewPanel, setShowPRReviewPanel] = useState(false);
  const [showGitAuthDialog, setShowGitAuthDialog] = useState(false);
  const prCommandHandler = useRef(null);
  const [isUserHost, setIsUserHost] = useState(false);
  const [githubUser, setGithubUser] = useState(null);
  
  
  


  useEffect(() => {
  requestNotificationPermission();
}, []);

useEffect(() => {
  const checkGitHubAuth = async () => {
    // Get current authentication status
    const { isAuthenticated } = GitHubService.getUserInfo();
    setIsGitAuthenticated(isAuthenticated);
    
    // If authenticated, fetch user info
    if (isAuthenticated) {
      const userInfo = await GitHubService.fetchUserInfo();
      setGithubUser(userInfo);
    }
  };
  
  checkGitHubAuth();
}, []);


// Add this effect to fetch session data and check host status
useEffect(() => {
 // In your CodeEditorDashboard component, modify the fetchSessionData function:

const fetchSessionData = async () => {
  try {
    // Get user information
    const userId = user?._id || user?.id;
    const localStorageId = localStorage.getItem("userId");
    
    console.log("Redux User ID:", userId);
    console.log("LocalStorage User ID:", localStorageId);
    
    if (!activeSessionId) return;
    
    // Fetch session data from your API
    const response = await fetch(`http://localhost:5000/api/session/${activeSessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch session data: ${response.status}`);
    }
    
    const sessionData = await response.json();
    console.log("Session Data:", sessionData);
    
    // Check both Redux and localStorage IDs against participants
    const currentUserParticipant = sessionData.participants.find(p => {
      const participantId = p.user_id?._id || p.user_id;
      return (
        participantId === userId || 
        participantId === localStorageId ||
        participantId?.toString() === userId?.toString() ||
        participantId?.toString() === localStorageId?.toString()
      );
    });
   
    
    // Set host status based on role field
    const isHost = currentUserParticipant?.role === "host";
    setIsUserHost(isHost);
    
    console.log("User host status:", isHost);
  } catch (error) {
    console.error("Error fetching session data:", error);
  }
};
  
  fetchSessionData();
}, [activeSessionId, user]);


// Initialize PR command handler
useEffect(() => {
  prCommandHandler.current = new PRCommandHandler(
    // Add to terminal function
    (entry) => setTerminalOutput(prev => [...prev, entry]),
    // Show PR panel function
    setShowPRReviewPanel,
    // Get session data function
    () => ({
      sessionId: activeSessionId,
      userName: user?.name || localStorage.getItem("userName") || "Anonymous",
      code,
      language: currentLanguage,
      isHost: isUserHost
    })
  );
}, [activeSessionId, code, currentLanguage, isUserHost, user]);


// End session function
const handleEndSession = () => {
  // 
    // If host, notify all participants
   
    const isHost = activeParticipants.find(p => p.id === userId)?.isHost || false;
    
    if (isHost && socket && socket.connected) {
      socket.emit("sessionEnding", {
        sessionId: activeSessionId
      });
    }
    
    // Show session end dialog
    setShowSessionEndDialog(true);
 
};

// Handle git auth command
const handleGitAuth = () => {
  setShowGitAuthDialog(true);
};


  
  // Helper function to generate consistent colors for users
const generateUserColor = (userId) => {
  // If user already has a color assigned, return it
  if (userColors[userId]) return userColors[userId];
  
  // List of bright, distinct colors good for indicators
  const colorPalette = [
    '#FF5733', // Coral red
    '#33FF57', // Bright green
    '#3357FF', // Bright blue
    '#FF33A8', // Pink
    '#33FFF5', // Cyan
    '#F5FF33', // Yellow
    '#FF8C33', // Orange
    '#8C33FF', // Purple
    '#33FFB8', // Mint
    '#FF33FF'  // Magenta
  ];
  
  // Assign a color based on how many users already have colors
  const colorIndex = Object.keys(userColors).length % colorPalette.length;
  const newColor = colorPalette[colorIndex];
  
  // Save the color assignment
  setUserColors(prev => ({
    ...prev,
    [userId]: newColor
  }));
  
  return newColor;
};

  const authenticateGitHub = async () => {
    const token = prompt('Enter your GitHub Personal Access Token (needs repo scope):');
    const owner = prompt('Enter the repository owner (username):');
    const repo = prompt('Enter the repository name:');
    
    if (token && owner && repo) {
      const result = await GitHubService.authenticate(token, owner, repo);
      
      if (result.success) {
        // Update state
        setIsGitAuthenticated(true);
        setGithubUser(result.user);
        setGitRepoOwner(owner);
        setGitRepoName(repo);
        
        // Add success message to terminal
        const successEntry = { 
          type: 'output', 
          content: result.output
        };
        setTerminalOutput(prev => [...prev, successEntry]);
        
        return { success: true, output: result.output };
      } else {
        // Add error message to terminal
        const errorEntry = { 
          type: 'error', 
          content: `GitHub authentication error: ${result.error}`
        };
        setTerminalOutput(prev => [...prev, errorEntry]);
        
        return { success: false, error: result.error };
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

    window.socket = newSocket;
    window.socketConnection = newSocket; 


    // Set up event listeners once socket is created
    newSocket.on("connect", () => {
      console.log("Connected to server with ID:", newSocket.id);

       setTimeout(() => {
    if (window.PRService) {
      window.PRService.requestPRSync(activeSessionId);
    }
  }, 1000);
      
      // Join the session
      newSocket.emit("joinSession", activeSessionId);
      
      // Join as a participant
      const userId = localStorage.getItem("userId") || Date.now().toString();
      localStorage.setItem("userId", userId); // Ensure userId is saved
     // Use Redux user name if available
const userName = user?.name || localStorage.getItem("userName") || "Anonymous";

// Also save Redux name to localStorage for consistency
if (user?.name) {
  localStorage.setItem("userName", user.name);
}
      
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

    newSocket.on("userTyping", (data) => {
      if (data.sessionId === activeSessionId) {
        if (data.isTyping) {
          setActiveTypist({
            userId: data.userId,
            userName: data.userName,
            position: data.position
          });
          
          // Add to typing participants
          setTypingParticipants(prev => ({
            ...prev,
            [data.userId]: true
          }));
          
          // Track activity
          trackActivity(data.userId);
          
        } else if (activeTypist && activeTypist.userId === data.userId) {
          // Clear typing status
          setActiveTypist(null);
          
          // Remove from typing participants
          setTypingParticipants(prev => {
            const updated = {...prev};
            delete updated[data.userId];
            return updated;
          });
        }
      }
    });

    newSocket.on("sessionEnding", (data) => {
      if (data.sessionId === activeSessionId) {
        // Show notification in terminal
        const entry = {
          type: 'output',
          content: 'The session host is ending this session. You can create a pull request with your changes.'
        };
        setTerminalOutput(prev => [...prev, entry]);
        
        // Show session end dialog
        setShowSessionEndDialog(true);
      }
    });
    
    
    
  
  newSocket.on("codeUpdate", (updatedData) => {
    try {
      // Only update if we're not currently typing
      const userId = localStorage.getItem("userId");
      
      // Extract code and metadata
      const updatedCode = typeof updatedData === 'object' && updatedData.code ? updatedData.code : updatedData;
      const typist = updatedData?.typist;
      const editPosition = updatedData?.editPosition;
      
      console.log("Received code update:", updatedCode);
      
      // Validate received data to prevent white screens
      if (typeof updatedCode !== 'string' || !updatedCode) {
        console.error("Received invalid code update:", updatedCode);
        return; // Don't update with invalid data
      }
      
      // Update active typist info if provided
      if (typist && typist.userId !== userId) {
        setActiveTypist({
          userId: typist.userId,
          userName: typist.userName || "Anonymous",
          position: editPosition || { lineNumber: 1, column: 1 }
        });
        
        // Auto-clear the typist after 1.5 seconds
        const timerId = setTimeout(() => {
          setActiveTypist(prev => 
            prev && prev.userId === typist.userId ? null : prev
          );
        }, 1500);
        
        setTypingTimerId(timerId);
      }
      
      // Update code if not typing or if update is from another user
      if (!typingTimerId || (typist && typist.userId !== userId)) {
        // Always save to localStorage before updating state
        const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
        localStorage.setItem(`code_${activeSessionId}_${fileName}`, updatedCode);
        
        // Then update state
        setCode(updatedCode);
      }
    } catch (error) {
      console.error("Error handling code update:", error);
      // Recover from localStorage if possible
      const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
      const savedCode = localStorage.getItem(`code_${activeSessionId}_${fileName}`);
      if (savedCode) {
        setCode(savedCode);
      }
    }
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


    // ADD THIS PROPERLY - Fix the prSync handler
  newSocket.on("prSync", (data) => {
    console.log("📥 Frontend received PR sync event:", data);
    
    if (data && data.sessionId === activeSessionId) {
      console.log("PR sync event matches current session:", data.eventType, data.prData?.id);
      
      // Ensure PRService handles the sync
      if (window.PRService) {
        window.PRService.handlePRSync(data.sessionId, data.eventType, data.prData);
        
        // Special handling for hosts - show notifications
        if (data.eventType === 'pr-added' && isUserHost) {
          console.log("Host received new PR notification");
          
          // Add terminal notification
          const entry = {
            type: 'output',
            content: `🔔 New pull request received: "${data.prData.title}" from ${data.prData.author}`
          };
          setTerminalOutput(prev => [...prev, entry]);
          
          // Force update notifications
          forceUpdateNotifications();
          
          // Show browser notification
          showNotification(`New PR: ${data.prData.title}`, 'info');
        }
      }
    }
  });


  // Debug: Log all PR-related events
  newSocket.onAny((eventName, ...args) => {
    if (eventName.includes('pr') || eventName.includes('PR')) {
      console.log(`🔍 Socket Event: ${eventName}`, args);
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
 
// Enhanced prSync handler that works with NATS
newSocket.on("prSync", (data) => {
  console.log("📥 Frontend received PR sync event:", data);
  
  if (data && data.sessionId === activeSessionId) {
    console.log("PR sync event matches current session:", data.eventType, data.prData?.id);
    
    // Ensure PRService handles the sync
    if (window.PRService) {
      window.PRService.handlePRSync(data.sessionId, data.eventType, data.prData);
      
      // Handle different event types
      if (data.eventType === 'pr-added' && isUserHost) {
        // Host notification for new PR
        const entry = {
          type: 'output',
          content: `🔔 New pull request received: "${data.prData.title}" from ${data.prData.author}`
        };
        setTerminalOutput(prev => [...prev, entry]);
        
        showNotification(`New PR: ${data.prData.title}`, 'info');
        forceUpdateNotifications();
      }
      
      // NEW: Handle review notifications for PR authors
      const currentUserId = localStorage.getItem("userId");
      const currentUserName = user?.name || localStorage.getItem("userName") || "Anonymous";
      
      // Check if this is a review action and the current user is the PR author
      if (['pr-approved', 'pr-rejected', 'pr-changes-requested'].includes(data.eventType) && 
          (data.prData.authorId === currentUserId || data.prData.author === currentUserName)) {
        
        let notificationMessage = '';
        let notificationType = 'info';
        
        switch (data.eventType) {
          case 'pr-approved':
            notificationMessage = `✅ Your PR "${data.prData.title}" has been approved by ${data.prData.reviewedBy}!`;
            notificationType = 'success';
            break;
          case 'pr-rejected':
            notificationMessage = `❌ Your PR "${data.prData.title}" has been rejected by ${data.prData.reviewedBy}.`;
            notificationType = 'error';
            break;
          case 'pr-changes-requested':
            notificationMessage = `📝 Changes requested for your PR "${data.prData.title}" by ${data.prData.reviewedBy}.`;
            notificationType = 'warning';
            break;
        }
        
        if (notificationMessage) {
          // Add to terminal
          const entry = {
            type: notificationType === 'error' ? 'error' : 'output',
            content: notificationMessage
          };
          setTerminalOutput(prev => [...prev, entry]);
          
          // Show browser notification
          showNotification(notificationMessage, notificationType);
          
          // If there are review comments, show them too
          if (data.prData.comments) {
            const commentEntry = {
              type: 'output',
              content: `Review comments: ${data.prData.comments}`
            };
            setTerminalOutput(prev => [...prev, commentEntry]);
          }
          
          // Force update notifications
          forceUpdateNotifications();
        }
      }
    }
  }
});
  // Immediately request PR sync when joining
  // This should happen after socket connection is established
  newSocket.emit("requestPRSync", {
    sessionId: activeSessionId,
    userId: localStorage.getItem("userId") || 'unknown'
  });
  
  console.log("Sent initial PR sync request for session:", activeSessionId);

    
    return () => {
      try {
        if (typingTimerId) {
          clearTimeout(typingTimerId);
        }
        
        if (newSocket) {
      newSocket.disconnect();
      if (window.socket === newSocket) {
        window.socket = null;
        window.socketConnection = null;
      }
    }
      } catch (error) {
        console.error("Error cleaning up socket connection:", error);
      }
    };
  }, [activeSessionId, user]); 
  
  const addToTerminal = (entry) => {
  setTerminalOutput(prev => [...prev, entry]);
  
  // If socket is connected, broadcast terminal update to other participants
  if (socket && socket.connected) {
    socket.emit("terminalUpdate", {
      sessionId: activeSessionId,
      entry: entry
    });
  }
}


const forceUpdateNotifications = () => {
  // This forces PRNotificationBadge components to update
  // by changing a key or counter that's passed to them
  setNotificationRefreshCounter(prev => prev + 1);
};
;
  

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



  // Add this useEffect to your component
useEffect(() => {
  if (user?.name) {
    localStorage.setItem("userName", user.name);
  }
}, [user]);


useEffect(() => {
  try {
    // Get the filename based on current language
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    
    // Try to load code from localStorage with error handling
    let savedCode = null;
    try {
      savedCode = localStorage.getItem(`code_${activeSessionId}_${fileName}`);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
    
    // If saved code exists, use it
    if (savedCode) {
      setCode(savedCode);
      
      // Notify other participants if socket is connected
      if (socket && socket.connected) {
        try {
          socket.emit("codeUpdate", { 
            sessionId: activeSessionId, 
            code: savedCode 
          });
        } catch (error) {
          console.error("Error emitting code update on initial load:", error);
        }
      }
    } else {
      // If no saved code, use the template
      setCode(codeTemplates[currentLanguage]);
    }
  } catch (error) {
    console.error("Error loading initial code:", error);
    // Fallback to default code template
    setCode(codeTemplates[currentLanguage] || "// Start writing your code here!");
  }
}, [activeSessionId, socket]);// Only run when sessionId changes

  // This effect runs when currentLanguage changes from any source
  // Update language change logic to persist code for each language
useEffect(() => {
  if (socket && socket.connected) {
    console.log("Language changed to:", currentLanguage);
    
    // Update file extension
    updateFileExtension(currentLanguage);
    
    // Check if we have saved code for this language
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    const savedCode = localStorage.getItem(`code_${activeSessionId}_${fileName}`);
    
    // If saved code exists for this language, load it
    if (savedCode) {
      setCode(savedCode);
    } else {
      // If no saved code, use the template
      setCode(codeTemplates[currentLanguage]);
    }
    
    // Broadcast language change to other participants
    socket.emit("languageUpdate", {
      sessionId: activeSessionId,
      language: currentLanguage
    });
    
    // After language change, also broadcast updated code
    socket.emit("codeUpdate", { 
      sessionId: activeSessionId, 
      code: savedCode || codeTemplates[currentLanguage]
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

  // Function to clear saved code (can be used for "New Session" feature)
const clearSavedCode = () => {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Filter for code-related keys for this session
  const codeKeys = keys.filter(key => 
    key.startsWith(`code_${activeSessionId}`)
  );
  
  // Remove all code keys for this session
  codeKeys.forEach(key => localStorage.removeItem(key));
  
  // Reset to default template
  setCode(codeTemplates[currentLanguage]);
};


// Helper function to clean up old sessions (optional)
const cleanupOldSessions = () => {
  const MAX_SESSIONS = 5; // Keep at most 5 recent sessions
  
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Get all unique session IDs
  const sessionIds = keys
    .filter(key => key.startsWith('code_'))
    .map(key => key.split('_')[1])
    .filter((value, index, self) => self.indexOf(value) === index);
  
  // If we have more than MAX_SESSIONS, remove oldest ones
  if (sessionIds.length > MAX_SESSIONS) {
    // Sort sessions by timestamp if your sessions use timestamp-based IDs
    // Or implement another way to determine which are oldest
    const sessionsToRemove = sessionIds.slice(0, sessionIds.length - MAX_SESSIONS);
    
    sessionsToRemove.forEach(sessionId => {
      keys.filter(key => key.includes(`_${sessionId}_`))
        .forEach(key => localStorage.removeItem(key));
    });
  }
};

// Call on component mount
useEffect(() => {
  cleanupOldSessions();
}, []);


const handleCodeChange = (newCode, event) => {
  // Get user info - prioritize Redux store user over localStorage
  const userId = localStorage.getItem("userId");
  
  // Use the name from Redux user state if available
  const userName = user?.name || localStorage.getItem("userName") || "Anonymous";
  
  // Save the code BEFORE changing the state to prevent race conditions
  const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
  localStorage.setItem(`code_${activeSessionId}_${fileName}`, newCode);
  
  // Update edit position if we have the event details
  if (event && event.changes && event.changes.length > 0) {
    const change = event.changes[0];
    setLastEditPosition({
      lineNumber: change.range.startLineNumber,
      column: change.range.startColumn
    });
  }
  
  // Only then update the local state
  setCode(newCode);
  
  // Clear any existing timer
  if (typingTimerId) {
    clearTimeout(typingTimerId);
  }
  
  // Set this user as active typist with the correct name
  if (socket && socket.connected) {
    // First send typing indicator
    socket.emit("userTyping", {
      sessionId: activeSessionId,
      userId,
      userName,
      isTyping: true,
      position: lastEditPosition
    });
    
    // Then broadcast code update with proper error handling
    try {
      socket.emit("codeUpdate", { 
        sessionId: activeSessionId, 
        code: newCode,
        editPosition: lastEditPosition,
        typist: { userId, userName }
      });
    } catch (error) {
      console.error("Error emitting code update:", error);
      // If emit fails, at least we've saved to localStorage
    }
    
    // Set timer to clear typing status after 1.5 seconds of inactivity
    const timerId = setTimeout(() => {
      try {
        socket.emit("userTyping", {
          sessionId: activeSessionId,
          userId,
          userName,
          isTyping: false
        });
      } catch (error) {
        console.error("Error clearing typing status:", error);
      }
    }, 1500);
    
    setTypingTimerId(timerId);
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

      if (command.startsWith('pr ')) {
        const [_, prCommand, ...args] = command.trim().split(' ');
        prCommandHandler.current.handleCommand(prCommand, args);
        return;
      }
      
      // Handle git auth command
      if (command === 'git auth') {
        handleGitAuth();
        return;
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

// Add this outside of any useEffect, at the component level
const isRecentlyActive = (userId) => {
  const lastActiveTime = lastActivity[userId];
  if (!lastActiveTime) return false;
  
  // Consider active if activity within last 30 seconds
  return (Date.now() - lastActiveTime) < 30000;
};

// Function to track activity
const trackActivity = (userId) => {
  if (!userId) return;
  
  setLastActivity(prev => ({
    ...prev,
    [userId]: Date.now()
  }));
};


const enhancedParticipants = activeParticipants.map(p => ({
  ...p,
  isTyping: typingParticipants[p.id] || false,
  isActive: isRecentlyActive(p.id)
}));


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

// 1. Fix pullChanges function to properly decode base64 content from GitHub
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
    
    // Properly decode GitHub's base64 content
    // GitHub's base64 may contain newlines that need to be removed first
    const base64Content = data.content.replace(/\s/g, '');
    // Then decode the base64 content properly for multi-line text
    const content = decodeURIComponent(escape(atob(base64Content)));
    
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

// 2. Fix pushChanges function to use the custom commit message
const pushChanges = async (branch = 'main') => {
  try {
    if (!isGitAuthenticated || !gitAuthToken) {
      throw new Error('GitHub authentication required. Use "git auth" to authenticate.');
    }
    
    // First make sure changes are committed
    // Use the stored commit message instead of hardcoding it
    const message = commitMessage || 'Update from KodeSesh';
    await commitChanges(message);
    
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
      // Use the same commit message here that was used in commitChanges
      const response = await fetch(`https://api.github.com/repos/${gitRepoOwner}/${gitRepoName}/contents/${fileName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${gitAuthToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message, // Use the custom message here
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
        output: `Successfully pushed to ${gitRepoOwner}/${gitRepoName}:${branch} with message: "${message}"`
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
 // Update Git operations with GitHub service
 const gitOperations = {
  status: async () => {
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    
    // First, make sure the file exists in the git repo
    try {
      // Create the dir if it doesn't exist
      await fs.promises.mkdir(dir).catch(() => {/* ignore if exists */});
      
      // Write current code to file
      await fs.promises.writeFile(`${dir}/${fileName}`, code);
    } catch (error) {
      console.error('Error writing file:', error);
    }
    
    const result = await GitHubService.checkStatus(fileName);
    
    // Add terminal output
    const entry = { 
      type: result.success ? 'output' : 'error', 
      content: result.success ? result.output : result.error
    };
    setTerminalOutput(prev => [...prev, entry]);
    
    // Update git status and branch if available
    if (result.success) {
      if (result.status) setGitStatus(result.status);
      if (result.branch) setCurrentBranch(result.branch);
    }
    
    return result;
  },
  
  add: async () => {
    const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
    
    // First, make sure the file exists in the git repo
    try {
      // Create the dir if it doesn't exist
      await fs.promises.mkdir(dir).catch(() => {/* ignore if exists */});
      
      // Write current code to file
      await fs.promises.writeFile(`${dir}/${fileName}`, code);
    } catch (error) {
      console.error('Error writing file:', error);
    }
    
    const result = await GitHubService.addFiles(fileName);
    
    // Add terminal output
    const entry = { 
      type: result.success ? 'output' : 'error', 
      content: result.success ? result.output : result.error
    };
    setTerminalOutput(prev => [...prev, entry]);
    
    return result;
  },
  
  commit: async () => {
    const message = prompt('Enter commit message:', commitMessage || 'Update from KodeSesh');
    if (message !== null) {
      setCommitMessage(message);
      
      // First add all changes
      await gitOperations.add();
      
      const result = await GitHubService.commit(message);
      
      // Add terminal output
      const entry = { 
        type: result.success ? 'output' : 'error', 
        content: result.success ? result.output : result.error
      };
      setTerminalOutput(prev => [...prev, entry]);
      
      return result;
    }
    return { success: false, error: 'Commit cancelled' };
  },
  
  push: async () => {
    const result = await GitHubService.push(currentBranch);
    
    // Add terminal output
    const entry = { 
      type: result.success ? 'output' : 'error', 
      content: result.success ? result.output : result.error
    };
    setTerminalOutput(prev => [...prev, entry]);
    
    return result;
  },
  
  pull: async () => {
    const result = await GitHubService.pull(currentBranch);
    
    // Add terminal output
    const entry = { 
      type: result.success ? 'output' : 'error', 
      content: result.success ? result.output : result.error
    };
    setTerminalOutput(prev => [...prev, entry]);
    
    // If successful, update the code editor
    if (result.success) {
      try {
        const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
        const fileContent = await fs.promises.readFile(`${dir}/${fileName}`, { encoding: 'utf8' });
        
        if (fileContent) {
          setCode(fileContent);
          
          // Notify other users
          if (socket && socket.connected) {
            socket.emit("codeUpdate", { 
              sessionId: activeSessionId, 
              code: fileContent 
            });
          }
        }
      } catch (error) {
        console.error('Error reading file after pull:', error);
      }
    }
    
    return result;
  },
  
  merge: async () => {
    const branchToMerge = prompt('Enter branch to merge from:', 'develop');
    if (branchToMerge !== null) {
      const result = await GitHubService.merge(branchToMerge, currentBranch);
      
      // Add terminal output
      const entry = { 
        type: result.success ? 'output' : 'error', 
        content: result.success ? result.output : result.error
      };
      setTerminalOutput(prev => [...prev, entry]);
      
      return result;
    }
    return { success: false, error: 'Merge cancelled' };
  },
  
  authenticate: () => authenticateGitHub(),
  
  createPullRequest: async () => {
    if (!isGitAuthenticated) {
      const authResult = await authenticateGitHub();
      if (!authResult.success) {
        return authResult;
      }
    }
    
    const title = prompt('Enter pull request title:', `Changes from KodeSesh session ${activeSessionId}`);
    if (!title) return { success: false, error: 'PR creation cancelled' };
    
    const body = prompt('Enter pull request description:', 'This pull request contains changes made during a KodeSesh collaborative coding session.');
    if (body === null) return { success: false, error: 'PR creation cancelled' };
    
    const sourceBranch = prompt('Enter source branch:', currentBranch);
    if (!sourceBranch) return { success: false, error: 'PR creation cancelled' };
    
    const targetBranch = prompt('Enter target branch:', 'main');
    if (targetBranch === null) return { success: false, error: 'PR creation cancelled' };
    
    // First make sure all changes are committed and pushed
    await gitOperations.add();
    await gitOperations.commit(`PR: ${title}`);
    await gitOperations.push();
    
    const result = await GitHubService.createPullRequest(title, body, sourceBranch, targetBranch);
    
    // Add terminal output
    const entry = { 
      type: result.success ? 'output' : 'error', 
      content: result.success ? result.output : result.error
    };
    setTerminalOutput(prev => [...prev, entry]);
    
    return result;
  },
  
  logOut: () => {
    const result = GitHubService.logout();
    setIsGitAuthenticated(false);
    setGithubUser(null);
    
    // Add terminal output
    const entry = { 
      type: 'output', 
      content: 'Logged out from GitHub'
    };
    setTerminalOutput(prev => [...prev, entry]);
    
    return result;
  },
  
  toggleGitPanel: () => setIsShowingGitPanel(!isShowingGitPanel),
  isShowingGitPanel: isShowingGitPanel
};

// 7. Add a window event handler to save code before unload
useEffect(() => {
  const handleBeforeUnload = () => {
    // Save current code state before page close/refresh
    try {
      const fileName = `main.${currentLanguage === 'javascript' ? 'js' : 'py'}`;
      localStorage.setItem(`code_${activeSessionId}_${fileName}`, code);
    } catch (error) {
      console.error("Error saving code before unload:", error);
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [code, currentLanguage, activeSessionId]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0f172a] to-[#0c0f1d] text-gray-100 overflow-hidden font-sans">
    {/* Ambient background effect */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiMyMDM1NWEiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-20 z-0 pointer-events-none"></div>
    
    {/* Main layout container - adjusted to account for status bar */}
    <div className="flex flex-1 overflow-hidden z-10 relative min-h-0">
      {/* Sidebar / File Explorer */}
      <div 
        className={`h-full backdrop-blur-md bg-[#0a101f]/80 border-r border-indigo-900/40 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0'}`}
      >
        {/* App Logo and Controls */}
        <div className="flex items-center justify-between p-3 border-b border-indigo-900/30 bg-gradient-to-r from-indigo-900/40 to-blue-900/30">
          <Link className="text-sm font-bold text-cyan-400 tracking-widest uppercase hover:text-cyan-300 transition-colors flex items-center space-x-2">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">KodeSesh</span>
          </Link>
          <FileExplorer.Controls toggleGitPanel={gitOperations.toggleGitPanel} />
        </div>
        
        {/* File Tree - with proper overflow handling */}
        <div className="flex-1 overflow-y-auto py-2 px-1 min-h-0">
          <FileExplorer 
            fileStructure={fileStructure} 
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            currentLanguage={currentLanguage}  
            gitOperations={gitOperations}
            currentBranch={currentBranch}
            isHost={isUserHost} 
            participants={enhancedParticipants}
            isGitAuthenticated={isGitAuthenticated}
            githubUser={githubUser} 
            sessionId={activeSessionId}
            onViewPR={(prId) => {
              if (prCommandHandler.current) {
                prCommandHandler.current.handleCommand('status', [prId]);
              }
            }}
            onReviewPR={(prId) => {
              setShowPRReviewPanel(true);
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Editor Header */}
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
          isHost={isUserHost}
          onEndSession={handleEndSession}
          onOpenPRReviewPanel={() => setShowPRReviewPanel(true)}
        />

        {/* Main Content with Editor and Call Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Editor and Terminal Container */}
          <div className={`flex flex-col transition-all duration-300 min-h-0 ${isCallPanelOpen ? 'w-8/12' : 'w-full'}`}>
            {/* Code Editor */}
            <div className={`flex-1 bg-[#0b111d]/90 backdrop-blur-md relative min-h-0 ${isTerminalOpen ? '' : 'h-full'}`}>
              {/* Line Numbers Decoration */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-b from-blue-900/20 to-indigo-900/20 border-r border-indigo-900/30 z-0 hidden md:block">
                <div className="h-full flex flex-col items-end pr-2 pt-1 text-cyan-500/50 text-xs">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                  ))}
                </div>
              </div>
              
              {/* Editor Content */}
              <div className={`h-full ${isTerminalOpen ? 'border-b border-indigo-900/30' : ''}`}>
                {(() => {
                  try {
                    return (
                      <CodeEditor 
                        code={code || "// Start writing your code here!"} 
                        onChange={handleCodeChange} 
                        language={currentLanguage}
                        gitStatus={gitStatus}
                        activeTypist={activeTypist}
                      />
                    );
                  } catch (error) {
                    console.error("Error rendering CodeEditor:", error);
                    return (
                      <div className="h-full flex items-center justify-center flex-col text-red-400">
                        <div className="mb-4">Error loading editor. Attempting to recover...</div>
                        <button 
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => window.location.reload()}
                        >
                          Reload Page
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Terminal Panel - with proper height constraints */}
            {isTerminalOpen && (
              <div 
                className="border-t border-cyan-900/30 bg-[#0a1121]/90 backdrop-blur-md flex-shrink-0" 
                style={{ height: `${Math.min(terminalHeight, 400)}px` }}
              >
                <TerminalPanel 
                  isOpen={isTerminalOpen}
                  onClose={toggleTerminal}
                  height={Math.min(terminalHeight, 400)}
                  onHeightChange={(height) => setTerminalHeight(Math.min(height, 400))}
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
            <div className="w-4/12 border-l border-indigo-900/40 bg-gradient-to-b from-[#0c1529]/90 to-[#0a101f]/90 backdrop-blur-md min-h-0">
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
    
    {/* Status Bar - now properly positioned */}
    {/* Status Bar - Enhanced Futuristic Design */}
<div className="h-10 bg-gradient-to-r from-slate-900/95 via-gray-900/95 to-slate-950/95 backdrop-blur-xl text-cyan-300 text-xs flex items-center px-6 justify-between border-t border-cyan-500/10 shadow-[0_-20px_40px_rgba(6,182,212,0.1)] z-10 flex-shrink-0 relative overflow-hidden">
  {/* Animated background effect */}
  <div className="absolute inset-0 opacity-30">
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
  </div>
  
  {/* Glowing top border */}
  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
  
  {/* Left side items */}
  <div className="flex items-center space-x-8 relative z-10">
    {/* Session Status */}
    <div className="flex items-center space-x-3 group cursor-pointer hover:scale-105 transition-transform">
      <div className="relative">
        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-lg shadow-emerald-400/50"></div>
        <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-400 animate-ping"></div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider">SESSION</span>
        <span className="text-cyan-400 font-mono bg-gradient-to-r from-gray-800/60 to-gray-900/60 px-3 py-1 rounded-md border border-cyan-500/20 shadow-inner">
          #{activeSessionId.slice(0, 6)}
        </span>
      </div>
    </div>
    
    {/* File Info with icon animation */}
    <div className="flex items-center space-x-2 group cursor-pointer">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
        <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-gray-300 font-medium group-hover:text-cyan-300 transition-colors">{selectedFile}</span>
    </div>
    
    {/* Connection Status with better animation */}
    <div className="flex items-center space-x-2">
      <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg ${
        socket?.connected 
          ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
          : 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
      }`}>
        <svg className={`w-4 h-4 ${socket?.connected ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        {socket?.connected && (
          <div className="absolute inset-0 rounded-lg bg-green-400/20 animate-pulse"></div>
        )}
      </div>
      <div className="flex flex-col">
        <span className={`text-[10px] uppercase tracking-wider ${socket?.connected ? 'text-green-400' : 'text-red-400'}`}>
          {socket?.connected ? 'CONNECTED' : 'OFFLINE'}
        </span>
        <span className="text-[9px] text-gray-500">Stable</span>
      </div>
    </div>
  </div>
  
  {/* Center decorative element */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-10">
    <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 blur-3xl"></div>
  </div>
  
  {/* Right side items */}
  <div className="flex items-center space-x-8 relative z-10">
    {/* Participants with animated badge */}
    <div className="flex items-center space-x-3">
      <div className="flex -space-x-2">
        {activeParticipants.slice(0, 3).map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-gray-900 flex items-center justify-center text-[8px] font-bold text-white">
            {i + 1}
          </div>
        ))}
        {activeParticipants.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-gray-900 flex items-center justify-center text-[8px] font-bold text-white">
            +{activeParticipants.length - 3}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">ACTIVE</span>
        <span className="text-cyan-400 font-bold text-sm">{activeParticipants.length} Users</span>
      </div>
    </div>
    
    {/* Language Badge with gradient */}
    <div className="relative group cursor-pointer">
      <div className={`
        px-4 py-1.5 rounded-lg flex items-center space-x-2
        bg-gradient-to-r ${currentLanguage === 'javascript' 
          ? 'from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
          : 'from-blue-500/20 to-indigo-500/20 border border-blue-500/30'}
        hover:scale-105 transition-all duration-300
      `}>
        <div className={`w-2.5 h-2.5 rounded-full ${
          currentLanguage === 'javascript' ? 'bg-yellow-400' : 'bg-blue-400'
        } shadow-lg`}></div>
        <span className={`font-bold text-sm ${
          currentLanguage === 'javascript' ? 'text-yellow-300' : 'text-blue-300'
        }`}>
          {currentLanguage === 'javascript' ? 'JavaScript' : 'Python'}
        </span>
      </div>
    </div>
    
    {/* Modern Clock */}
    <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-800/40 to-gray-900/40 px-3 py-1.5 rounded-lg border border-gray-700/30">
      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-cyan-300 font-mono font-medium">
        {new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}
      </span>
    </div>
  </div>
  
  {/* Bottom glow effect */}
  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent blur-sm"></div>
</div>

{/* Add this CSS to your global styles or in a style tag */}
<style jsx global>{`
  @keyframes gradient-x {
    0%, 100% {
      transform: translateX(0%);
    }
    50% {
      transform: translateX(-100%);
    }
  }
  .animate-gradient-x {
    animation: gradient-x 15s ease infinite;
    background-size: 200% 200%;
  }
`}</style>

    {/* Dialogs */}
    {showSessionEndDialog && (
      <SessionEndDialog 
        isOpen={showSessionEndDialog}
        onClose={() => setShowSessionEndDialog(false)}
        sessionId={activeSessionId}
        userName={user?.name || localStorage.getItem("userName") || "Anonymous"}
        code={code}
        language={currentLanguage}
        isGitAuthenticated={isGitAuthenticated}
        setIsGitAuthenticated={setIsGitAuthenticated}
        gitOperations={gitOperations}
        githubUser={githubUser}
        addToTerminal={(entry) => setTerminalOutput(prev => [...prev, entry])}
        prCommandHandler={prCommandHandler}
        onNavigateHome={() => navigate('/')}
      />
    )}
    
    {showPRReviewPanel && (
      <PRReviewPanel 
        isVisible={showPRReviewPanel}
        onClose={() => setShowPRReviewPanel(false)}
        addToTerminal={(entry) => setTerminalOutput(prev => [...prev, entry])}
      />
    )}
    
    {showGitAuthDialog && (
      <GitAuthDialog 
        isOpen={showGitAuthDialog}
        onClose={() => setShowGitAuthDialog(false)}
        addToTerminal={(entry) => setTerminalOutput(prev => [...prev, entry])}
      />
    )}

    {showPRReviewPanel && (
      <PRReviewPanel 
        isVisible={showPRReviewPanel}
        onClose={() => setShowPRReviewPanel(false)}
        addToTerminal={(entry) => setTerminalOutput(prev => [...prev, entry])}
        sessionId={activeSessionId}
        isHost={isUserHost}
      />
    )}
  </div>
);
};

export default CodeEditorDashboard;