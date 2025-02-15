import React from "react";
import { motion } from "framer-motion";
import unifiedImage from "/src/assets/images/UniImg.jpg"; // Import the image

const UnifiedPlatformSection = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Heading */}
      <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-white bg-clip-text text-transparent text-center py-12">
        Unified Platform for Seamless Collaboration
      </h2>

      {/* Content Section */}
      <div className="bg-slate-950 flex justify-center items-center p-4">
        <div className="w-full max-w-7xl flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
          {/* Left Side: Image with Slide-Up Transition */}
          <motion.div
            className="w-full md:w-1/2 h-full flex items-center"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ amount: 0.5 }} // Trigger when 50% of the section is visible
          >
            <img
              src={unifiedImage}
              alt="Unified Platform"
              className="rounded-lg shadow-lg w-full h-[70vh] object-cover"
            />
          </motion.div>

          {/* Right Side: Text Content */}
          <div className="w-full md:w-1/2 space-y-6 px-4 md:px-8">
            {/* Subheading */}
            <p className="text-xl text-gray-300">
              Everything you need to collaborate effectively—audio calls, video calls, and real-time collaboration—all in one place.
            </p>

            {/* Key Points */}
            <ul className="space-y-6 text-gray-300 py-8">
              <li className="flex items-start space-x-4">
                <span className="text-cyan-500 text-2xl">✔</span>
                <span className="flex-1">
                  <strong>Audio Calls</strong>: Communicate effortlessly with crystal-clear audio.
                </span>
              </li>
              <li className="flex items-start space-x-4">
                <span className="text-cyan-500 text-2xl">✔</span>
                <span className="flex-1">
                  <strong>Video Calls</strong>: See your team and share ideas face-to-face.
                </span>
              </li>
              <li className="flex items-start space-x-4">
                <span className="text-cyan-500 text-2xl">✔</span>
                <span className="flex-1">
                  <strong>Real-Time Collaboration</strong>: Work together on the same codebase.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPlatformSection;