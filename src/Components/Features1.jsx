import React from "react";

const Features1 = () => {
  return (
    <div className="min-h-screen bg-black flex justify-center items-center p-4">
      {/* Main div covering the entire page */}
      <div className="w-full h-screen flex justify-center items-center space-x-8 p-8 perspective">
        
        {/* First inner div */}
        <div
          className="w-1/2 h-3/4 bg-slate-950/50 rounded-lg flex flex-col items-center justify-center text-white text-2xl font-bold transition-all duration-500 transform-style-preserve-3d hover:rotate-y-20 hover:translate-z-50 backdrop-blur-lg backdrop-filter relative overflow-visible group"
        >
          {/* Base border */}
          <div className="absolute inset-0 rounded-lg border-2 border-cyan-500 bg-slate-950" />
          
          {/* Outward radiating glow effect */}
          <div
            className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: `
                linear-gradient(to right, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                ),
                linear-gradient(to left, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                ),
                linear-gradient(to bottom, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                ),
                linear-gradient(to top, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                )
              `,
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
              pointerEvents: 'none',
              zIndex: -1
            }}
          />

          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-700 via-cyan-300 to-white bg-clip-text text-transparent z-10">
            Real-time Collaboration
          </h2>

          {/* Paragraph and Image Container */}
          <div className="flex items-center justify-between w-full z-10 px-8">
            <p className="text-xl text-gray-300 w-1/2 pr-4 leading-relaxed font-normal">
              Collaborate in real-time with your team, Speed Up Your Workflow with Real-Time Edits.
            </p>

            <div className="w-1/2 flex justify-center">
              <img
                src="/src/assets/images/realtime.png"
                alt="Realtime collaboration"
                className="rounded-lg shadow-lg w-78 h-87 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Second inner div */}
        <div
          className="w-1/2 h-3/4 bg-slate-950/50 rounded-lg flex flex-col items-center justify-center text-white transition-all duration-500 transform-style-preserve-3d hover:-rotate-y-20 hover:translate-z-50 p-8 backdrop-blur-lg backdrop-filter relative overflow-visible group"
        >
          {/* Base border */}
          <div className="absolute inset-0 rounded-lg border-2 border-cyan-500 bg-slate-950" />
          
          {/* Outward radiating glow effect */}
          <div
            className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: `
                linear-gradient(to right, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                ),
                linear-gradient(to left, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                ),
                linear-gradient(to bottom, 
                  black,
                  rgba(0, 188, 212, 0.5) 10%,
                  rgba(0, 188, 212, 0.2) 50%,
                  transparent 100%
                ),
                linear-gradient(to top, 
                  black,
                  rgba(0, 188, 212, 0.2) 50%,
                  rgba(0, 188, 212, 0.5) 10%,
                  transparent 100%
                )
              `,
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
              pointerEvents: 'none',
              zIndex: -1
            }}
          />

          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-700 via-cyan-300 to-white bg-clip-text text-transparent z-10">
            Syntax Highlighting
          </h2>

          <div className="flex items-center justify-between w-full z-10">
            <p className="text-xl text-gray-300 w-1/2 pr-4 leading-relaxed ">
              Write and debug code faster with syntax highlighting that supports multiple programming languages.
            </p>

            <div className="w-1/2 flex justify-center">
              <img
                src="/src/assets/images/SH.jpeg"
                alt="Syntax Highlighting"
                className="rounded-lg shadow-lg w-84 h-78 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features1;