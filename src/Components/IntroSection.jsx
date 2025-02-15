import React from 'react';
import { Code2, Users } from 'lucide-react';

const HeroSection = () => {
  return (
    <div
      className="relative h-screen bg-cover bg-center flex items-center justify-start text-left"
      style={{
        backgroundImage: `url('/src/assets/images/Hero1.jpg')`, 
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 text-white max-w-2xl px-8 ml-12">
        <h1 className="text-6xl font-bold mb-6">
          Turn solo code{" "}
          <span className="inline-block">
            into{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-white bg-clip-text text-transparent">
              symphony
            </span>
          </span>
        </h1>

        <p className="text-2xl mb-12">
          Write, share, and collaborate on code in real-time.
        </p>

        <div className="space-x-4  ">
        <button className="px-8 py-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition duration-300 text-xl">
            Start Building 
          </button>
          <button className="px-8 py-4 border border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-black transition duration-300 text-xl">
            Collaborate 
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default HeroSection;