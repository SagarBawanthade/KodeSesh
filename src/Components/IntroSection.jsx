
import { Code2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const IntroSection = () => {
  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Abstract Tech Graphics */}
      <div className="absolute inset-0">
        {/* Gradient Orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500 to-cyan-700/30 rounded-full blur-3xl" />
        
        {/* Animated Code Lines */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              style={{
                top: `${30 + i * 15}%`,
                left: '0',
                right: '0',
                animation: `slide ${3 + i}s linear infinite`,
                opacity: 0.4
              }}
            />
          ))}
        </div>

        {/* Floating Tech Symbols */}
        {['</', '{;}', '/>', '()', '[]', '<>', '{}'].map((symbol, index) => (
          <div
            key={index}
            className="absolute text-cyan-400/40 text-xl font-mono"
            style={{
              top: `${Math.random() * 70 + 10}%`,
              left: `${Math.random() * 70 + 20}%`,
              animation: `float ${3 + Math.random() * 0.7}s infinite ease-in-out`
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Main Content Container - Positioned absolutely to cover full page */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Tagline */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Turn Solo Code into Symphony
          </h1>

          {/* Description */}
          <p className="text-gray-300 text-lg mb-8">
            Write, share, and collaborate on code in real-time. 
          </p>

          {/* Buttons Container */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/code-editor-dashboard">
            <button className="flex items-center px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 
                             text-black font-medium rounded-lg transition-colors 
                             duration-300">
              <Code2 className="mr-2" size={20} />
              Create Session
            </button>
            </Link>

            <Link to="/code-editor-dashboard">
            <button className="flex items-center px-6 py-2.5 border border-cyan-500 
                             text-white hover:bg-cyan-500/10 font-medium rounded-lg 
                             transition-colors duration-300">
              <Users className="mr-2" size={20} />
              Join Session
            </button>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default IntroSection;
