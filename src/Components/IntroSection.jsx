import { useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const HeroSection = () => {
  const [sessionLink, setSessionLink] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("Your Coding Session Name...");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const navigate = useNavigate();

  const openCreateSessionDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const openJoinSessionDialog = () => {
    setIsJoinDialogOpen(true);
  };

  const closeJoinDialog = () => {
    setIsJoinDialogOpen(false);
  };

  const handleCreateSession = async () => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      alert("You must be logged in to create a session!");
      return;
    }
  
    // Trim the input to remove any whitespace
    const trimmedSessionId = sessionId.trim();
  
    setIsLoading(true);
  
    try {
      const response = await fetch("http://localhost:5000/api/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: sessionTitle, session_id: trimmedSessionId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || errorData.error || "Failed to create session");
        setIsLoading(false);
        return;
      }
  
      const data = await response.json();
  
      // Use the session_id from the response to navigate
      setSessionLink(data.session_link);
      setIsLoading(false);
      closeCreateDialog();
      navigate(`/code-editor-dashboard/${data.session_id}`);
      toast.success("Session created successfully!");
    } catch (error) {
      toast.error("Error connecting to server. Please check if the server is running.");
      setIsLoading(false);
    }
  };
  

  const handleJoinSession = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      toast.error("You must be logged in to join a session!");
      return;
    }
  
    if (!sessionId) {
      toast.error("Please enter a valid session ID!");
      return;
    }
  
    // Trim the input to remove any whitespace
    const trimmedSessionId = sessionId.trim();
    
    setJoinLoading(true);
  
    try {
      console.log("Attempting to join session:", trimmedSessionId);
      
      const response = await fetch("http://localhost:5000/api/session/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: trimmedSessionId })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Join session error:", data);
        toast.error(data.message || "Failed to join session");
        setJoinLoading(false);
        return;
      }
  
      toast.success(data.message);
      closeJoinDialog();
      navigate(`/code-editor-dashboard/${trimmedSessionId}`);
    } catch (error) {
      console.error("Join session error:", error);
      toast.error("Error connecting to server. Please check if the server is running.");
    } finally {
      setJoinLoading(false);
    }
  };
  return (
    <div
      className="relative h-[70vh] sm:h-screen bg-black sm:bg-[url('/images/Hero01.jpg')] sm:bg-cover sm:bg-center flex items-center justify-start text-left overflow-hidden"
    >
      {/* Gradient Background for Small Screens */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-black to-black sm:hidden"></div> 

      {/* Semicircular Patch for Small Screens */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-#155e75 rounded-full sm:hidden"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-black rounded-full sm:hidden"></div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 sm:bg-opacity-50"></div>

      {/* Content */}
      <div className="relative z-10 text-white max-w-2xl px-4 sm:px-8 lg:px-12 mx-auto lg:ml-12">
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
          Turn solo code{" "}
          <span className="inline-block">
            into{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              symphony
            </span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-12">
          Write, share, and collaborate on code in real-time.
        </p>
        
        <div className="space-x-4 space-y-4 sm:space-y-0 flex flex-col sm:flex-row xs:justify-center">
          <button 
            onClick={openCreateSessionDialog} 
            className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-cyan-600 to-blue-800 text-white rounded-lg hover:from-cyan-500 hover:to-blue-700 transition duration-300 text-lg md:text-xl shadow-lg"
          >
            Start Building
          </button>
          
          {sessionLink && <p>Session Link: <a href={sessionLink}>{sessionLink}</a></p>}
          
          <button
            onClick={openJoinSessionDialog}
            className="px-6 py-3 md:px-8 md:py-4 border border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-gray-900 transition duration-300 text-lg md:text-xl"
          >
            Collaborate
          </button>
        </div>
      </div>

      {/* Session Creation Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeCreateDialog}
          ></div>
          
          <div className="relative z-10 bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Session</h2>
            
            <div className="mb-6">
              <label htmlFor="sessionTitle" className="block text-sm font-medium text-gray-300 mb-2">
                Session Name
              </label>
              <input
                type="text"
                id="sessionTitle"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter session name..."
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeCreateDialog}
                className="px-4 py-2 text-gray-300 hover:text-white transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg hover:from-cyan-500 hover:to-blue-600 transition duration-300 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Dialog */}
      {isJoinDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeJoinDialog}
          ></div>
          
          <div className="relative z-10 bg-gray-900 border border-transparent rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl bg-gradient-to-b from-gray-900 to-gray-800" style={{borderImage: 'linear-gradient(to bottom right, #0ea5e9, #1e40af) 1'}}>
            <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-cyan-500 to-blue-700 blur-md"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-white">Join Existing Session</h2>
              
              <div className="mb-6">
                <label htmlFor="sessionId" className="block text-sm font-medium text-gray-300 mb-2">
                  Session ID
                </label>
                <input
                  type="text"
                  id="sessionId"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter session ID..."
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeJoinDialog}
                  className="px-4 py-2 text-gray-300 hover:text-white transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinSession}
                  disabled={joinLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg hover:from-cyan-500 hover:to-blue-600 transition duration-300 disabled:opacity-50 shadow-lg"
                >
                  {joinLoading ? "Joining..." : "Join Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSection;