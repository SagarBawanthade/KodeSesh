import { Link } from 'react-router-dom';

const HeroSection = () => {
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
            <span className="bg-gradient-to-r from-cyan-500 to-white bg-clip-text text-transparent">
              symphony
            </span>
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8">
          Write, share, and collaborate on code in real-time.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/code-editor-dashboard"
            className="px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition duration-300 text-sm sm:text-base lg:text-lg text-center"
          >
            Start Building
          </Link>
          <Link
            to="/code-editor-dashboard"
            className="px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 border border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-black transition duration-300 text-sm sm:text-base lg:text-lg text-center"
          >
            Collaborate
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;