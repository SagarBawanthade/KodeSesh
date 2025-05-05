import React from 'react';

const EndSessionButton = ({ isHost, onClick }) => {
  if (!isHost) return null;
  
  return (
    <button
      className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
      </svg>
      End Session
    </button>
  );
};

export default EndSessionButton;