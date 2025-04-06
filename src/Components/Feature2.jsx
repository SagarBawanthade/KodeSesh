import { motion } from "framer-motion";
import unifiedImage from "/images/UniImg.jpg";

const UnifiedPlatformSection = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Heading */}
      <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 to-white bg-clip-text text-transparent text-center py-8 md:py-12">
        Unified Platform for Seamless Collaboration
      </h2>

      {/* Content Section */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
        {/* Image Section */}
        <motion.div
          className="w-full md:w-1/2 flex justify-center items-center"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ amount: 0.5 }}
        >
          <img
            src={unifiedImage}
            alt="Unified Platform"
            className="rounded-lg shadow-lg w-[300px] h-[150px] md:w-full md:h-[70vh] object-cover"
          />
        </motion.div>

        {/* Text Section */}
        <div className="w-full md:w-1/2 space-y-4 md:space-y-6 px-4 md:px-8 text-center md:text-left">
          <p className="text-base md:text-xl text-gray-300">
            Everything you need to collaborate effectively—audio calls, video
            calls, and real-time collaboration—all in one place.
          </p>

          <ul className="space-y-4 md:space-y-6 text-gray-300 py-4 md:py-8">
            <li className="flex items-start space-x-4">
              <span className="text-cyan-500 text-2xl">✔</span>
              <span className="flex-1 text-sm md:text-base">
                <strong>Audio Calls</strong>: Communicate effortlessly with
                crystal-clear audio.
              </span>
            </li>
            <li className="flex items-start space-x-4">
              <span className="text-cyan-500 text-2xl">✔</span>
              <span className="flex-1 text-sm md:text-base">
                <strong>Video Calls</strong>: See your team and share ideas
                face-to-face.
              </span>
            </li>
            <li className="flex items-start space-x-4">
              <span className="text-cyan-500 text-2xl">✔</span>
              <span className="flex-1 text-sm md:text-base">
                <strong>Real-Time Collaboration</strong>: Work together on the
                same codebase.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPlatformSection;