

const TeamSection = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Bhumika Chandwani',
      role: 'FrontEnd developer',
      bio: 'Android application & Web Developer, Front-End Designer, React, Tailwind CSS, HTML, CSS, JavaScript.',
      image: '/images/Bhumika1.jpg', 
    },
    {
  id: 2,
  name: 'Sagar Bawanthade',
  role: 'DevOps & Backend Developer',
  bio: 'Backend Developer | Node.js, MongoDB | Cloud & DevOps Enthusiast | AWS, Docker, Kubernetes, CI/CD Pipelines, and Real-time App Integration',
  image: '/images/Sagar.jpeg',
}
,
    {
      id: 3,
      name: 'Shreya Jadhav',
      role: 'Cloud deployment',
      bio: 'Cloud computing in AWS , With beginner in Azure , also knowledgeable in Java ,Python and Linux. ',
      image: '/images/Shreya.jpeg', 
    },
  ];

  return (
    <section className="hidden md:flex bg-black min-h-screen flex-col items-center justify-start p-8">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent mb-4">
        Meet our team
      </h1>

      <p className="text-gray-400 text-lg mb-20"> {/* Added more space after paragraph */}
        We’re a group of creative minds, tech enthusiasts, and problem-solvers dedicated to delivering exceptional results for our clients.
      </p>

      <div className="flex items-end justify-center gap-8 relative">
        <div
          className="w-80 bg-slate-950 p-8 shadow-2xl transform translate-y-8 border-2 border-cyan-400 hover:scale-105 transition-all duration-300 rounded-tl-3xl rounded-br-3xl" 
        >
          <img
            src={teamMembers[0].image}
            alt={teamMembers[0].name}
            className="w-28 h-28 rounded-full mx-auto mb-6" 
          />
          <h2 className="text-lg font-semibold justify-self-center text-white mb-4">{teamMembers[0].name}</h2>
          <p className="text-[#37a9dd] text-lg mb-4">{teamMembers[0].role}</p>
          <p className="text-gray-300 text-sm">{teamMembers[0].bio}</p>
        </div>

        <div
          className="w-80 bg-slate-950 p-8 shadow-2xl z-10 transform -translate-y-8 border-2 border-gray-500 hover:border-cyan-400 hover:scale-105 transition-all duration-300 rounded-tr-3xl rounded-bl-3xl" 
        >
          <img
            src={teamMembers[1].image}
            alt={teamMembers[1].name}
            className="w-28 h-28 rounded-full mx-auto mb-6"
          />
          <h2 className="text-lg font-semibold justify-self-center text-white mb-4">{teamMembers[1].name}</h2>
          <p className="text-[#37a9dd]  text-lg mb-4">{teamMembers[1].role}</p>
          <p className="text-gray-300 text-sm">{teamMembers[1].bio}</p>
        </div>

        {/* Right Card */}
        <div
          className="w-80 bg-slate-950 p-8 shadow-2xl transform translate-y-8 border-2 border-cyan-400 hover:scale-105 transition-all duration-300 rounded-tl-3xl rounded-br-3xl" 
        >
          <img
            src={teamMembers[2].image}
            alt={teamMembers[2].name}
            className="w-28 h-28 rounded-full mx-auto mb-6" // Increased image size
          />
          <h2 className="text-lg font-semibold justify-self-center text-white mb-4">{teamMembers[2].name}</h2>
          <p className="text-[#37a9dd]  text-lg mb-4">{teamMembers[2].role}</p>
          <p className="text-gray-300 text-sm">{teamMembers[2].bio}</p>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;