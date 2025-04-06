const Features1 = () => {
  return (
    <div className="min-h-screen bg-black flex justify-center items-center p-4">
      <div className="w-full h-screen flex flex-col lg:flex-row justify-center items-center space-y-8 lg:space-y-0 lg:space-x-8 p-4 lg:p-8 perspective">
        
        {/* First Container */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-3/4 bg-slate-950/50 rounded-lg flex flex-col items-center justify-center text-white transition-all duration-500 transform-style-preserve-3d hover:rotate-y-20 hover:translate-z-50 backdrop-blur-lg backdrop-filter relative overflow-visible group">
          
          <div className="absolute inset-0 rounded-lg border-2 border-cyan-500 bg-slate-950" />
          
          <div
            className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: `
                linear-gradient(to right, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%),
                linear-gradient(to left, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%),
                linear-gradient(to bottom, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%),
                linear-gradient(to top, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%)
              `,
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
              pointerEvents: 'none',
              zIndex: -1
            }}
          />

          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-6 bg-gradient-to-r from-cyan-700 via-cyan-300 to-white bg-clip-text text-transparent z-10">
            Real-time Collaboration
          </h2>

          <div className="flex flex-col lg:flex-row items-center justify-between w-full z-10 px-2 md:px-4 lg:px-8">
            <p className="text-sm md:text-lg lg:text-xl text-gray-300 w-full lg:w-1/2 lg:pr-4 leading-relaxed font-normal mb-4 lg:mb-0 text-center lg:text-left">
              Collaborate in real-time with your team, Speed Up Your Workflow with Real-Time Edits.
            </p>

            <div className="w-full lg:w-1/2 flex justify-center">
              <img
                src="/images/realtime.png"
                alt="Realtime collaboration"
                className="rounded-lg shadow-lg w-full h-36 md:h-48 md:w-72 lg:h-87 lg:w-78 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Second Container */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-3/4 bg-slate-950/50 rounded-lg flex flex-col items-center justify-center text-white transition-all duration-500 transform-style-preserve-3d hover:-rotate-y-20 hover:translate-z-50 p-4 lg:p-8 backdrop-blur-lg backdrop-filter relative overflow-visible group">
          
          <div className="absolute inset-0 rounded-lg border-2 border-cyan-500 bg-slate-950" />
          
          <div
            className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: `
                linear-gradient(to right, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%),
                linear-gradient(to left, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%),
                linear-gradient(to bottom, black, rgba(0, 188, 212, 0.5) 10%, rgba(0, 188, 212, 0.2) 50%, transparent 100%),
                linear-gradient(to top, black, rgba(0, 188, 212, 0.2) 50%, rgba(0, 188, 212, 0.5) 10%, transparent 100%)
              `,
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
              pointerEvents: 'none',
              zIndex: -1
            }}
          />

          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-cyan-700 via-cyan-300 to-white bg-clip-text text-transparent z-10">
            Syntax Highlighting
          </h2>

          <div className="flex flex-col lg:flex-row items-center justify-between w-full z-10 px-2 md:px-4 lg:px-8">
            <p className="text-sm md:text-lg lg:text-xl text-gray-300 w-full lg:w-1/2 lg:pr-4 leading-relaxed mb-4 lg:mb-0 text-center lg:text-left">
              Write and debug code faster with syntax highlighting that supports multiple programming languages.
            </p>

            <div className="w-full lg:w-1/2 flex justify-center">
              <img
                src="/images/SH.jpeg"
                alt="Syntax Highlighting"
                className="rounded-lg shadow-lg w-full h-36 md:h-48 md:w-72 lg:h-78 lg:w-84 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features1;
