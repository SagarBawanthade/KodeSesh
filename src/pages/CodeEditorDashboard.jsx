import { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import FileExplorer from '../components/FileExplorer';
import EditorHeader from '../components/EditorHeader';
import CodeEditor from '../components/CodeEditor';
import CallPanel from '../components/CallPanel';
import TerminalPanel from '../components/TerminalPanel';
import { Link, useNavigate, useParams } from 'react-router-dom';

const CodeEditorDashboard = () => {
  // State management
  const [code, setCode] = useState("// Start writing your code here!");
  const [selectedFile, setSelectedFile] = useState("index.js");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCallPanelOpen, setIsCallPanelOpen] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const activeSessionId = sessionId || "demo-session";  
  const [socket, setSocket] = useState(null);

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
    
  //   if (!token) {
  //     toast.error("Please log in to join this session");
  //     navigate("/login");
  //     return;
  //   };
  
   
  //   socket.auth = { token };
  //   socket.connect();
    
  // }, []);

  // Socket connection
  

 useEffect(() => {
  // Create socket connection
  const newSocket = io("http://localhost:5000", {
    transports: ["websocket", "polling"], // Allow fallback to polling
    upgrade: true, // Attempt to upgrade to WebSocket
    forceNew: true, // Force a new connection
  });
  
  setSocket(newSocket);
  
  // Set up event listeners once socket is created
  newSocket.on("connect", () => {
    console.log("Connected to server with ID:", newSocket.id);
    
    // Join the session
    newSocket.emit("joinSession", activeSessionId);
    
    // Join as a participant
    const userId = localStorage.getItem("userId") || Date.now().toString();
    const userName = localStorage.getItem("userName") || "Anonymous";
    
    newSocket.emit("userJoined", {
      userId,
      name: userName,
      isHost: !sessionId // If no sessionId in URL, treat as host
    });
    
    // Request current participants
    newSocket.emit("getParticipants", activeSessionId);
  });
  
  // Listen for code updates
  newSocket.on("codeUpdate", (updatedCode) => {
    console.log("Received code update:", updatedCode);
    setCode(updatedCode);
  });
  
  // Listen for participants updates
  newSocket.on("participantsList", (participants) => {
    console.log("Received participants list:", participants);
    setActiveParticipants(participants);
  });
  
  newSocket.on("participantJoined", (participant) => {
    console.log("Participant joined:", participant);
    setActiveParticipants(prev => [...prev, participant]);
  });
  
  newSocket.on("participantLeft", (participantId) => {
    console.log("Participant left:", participantId);
    setActiveParticipants(prev => prev.filter(p => p.id !== participantId));
  });
  
  // Clean up on unmount
  return () => {
    console.log("Disconnecting socket");
    if (newSocket) {
      newSocket.disconnect();
    }
  };
}, [activeSessionId]);



  // Participants data
  const [activeParticipants, setActiveParticipants] = useState([
    { id: 1, name: "You", isHost: true, isMuted: false, isVideoOff: false },
    { id: 2, name: "John Doe", isHost: false, isMuted: true, isVideoOff: false },
    { id: 3, name: "Jane Smith", isHost: false, isMuted: false, isVideoOff: true }
  ]);
  
  // Simulated file structure
  const fileStructure = {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "Header.jsx", type: "file" },
          { name: "Sidebar.jsx", type: "file" },
          { name: "Footer.jsx", type: "file" }
        ]
      },
      { name: "index.js", type: "file" },
      { name: "App.jsx", type: "file" },
      { name: "styles.css", type: "file" }
    ]
  };




  // Event handlers
  const toggleTerminal = () => {
    setIsTerminalOpen(!isTerminalOpen);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) {
      console.log("Sending code update for session:", activeSessionId);
      // Make sure this structure matches what the server expects
      socket.emit("codeUpdate", { sessionId: activeSessionId, code: newCode });
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    setActiveParticipants(prev => 
      prev.map(p => p.id === 1 ? {...p, isMuted: !isAudioOn} : p)
    );
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    setActiveParticipants(prev => 
      prev.map(p => p.id === 1 ? {...p, isVideoOff: !isVideoOn} : p)
    );
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-gray-300 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`h-screen flex transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-0' : '-ml-64'}`}
      >
        {/* File Explorer Sidebar */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-[#252526]">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#2d2d2d]">
            <Link to="/" className="text-sm font-semibold uppercase tracking-wide">KodeSesh </Link>
            <FileExplorer.Controls />
          </div>
          <div className="overflow-y-auto flex-1 py-2">
            <FileExplorer 
              fileStructure={fileStructure} 
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
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
        />

        {/* Main Content with Editor and Call Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor and Terminal Container */}
          <div className={`flex flex-col transition-all duration-300 ${isCallPanelOpen ? 'w-8/12' : 'w-full'}`}>
            {/* Monaco Editor */}
            <div className={`flex-1 ${isTerminalOpen ? 'h-3/4' : 'h-full'}`}>
              <CodeEditor 
                code={code} 
                onChange={handleCodeChange} 
              />
            </div>

            
            {/* Terminal Below Editor */}
            {isTerminalOpen && (
              <TerminalPanel 
                isOpen={isTerminalOpen}
                onClose={toggleTerminal}
                height={terminalHeight}
                onHeightChange={setTerminalHeight}
              />
            )}
          </div>

          {/* Call Panel */}
          {isCallPanelOpen && (
            <CallPanel 
              participants={activeParticipants}
              isAudioOn={isAudioOn}
              isVideoOn={isVideoOn}
              toggleAudio={toggleAudio}
              toggleVideo={toggleVideo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorDashboard;