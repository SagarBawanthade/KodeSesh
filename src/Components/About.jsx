import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Team from "./Team";
import { Users, Video, Code, RefreshCcw, Layers3 } from "lucide-react";

const features = [
  {
    icon: <Users size={28} className="text-cyan-400" />,
    title: "Real-time Collaboration",
    description: "Work together on code with your team simultaneously.",
  },
  {
    icon: <Video size={28} className="text-cyan-400" />,
    title: "Live Audio/Video Calls",
    description: "Communicate seamlessly while editing code live.",
  },
  {
    icon: <Code size={28} className="text-cyan-400" />,
    title: "Syntax Highlighting",
    description: "Code with clarity using beautiful language-specific themes.",
  },
  {
    icon: <RefreshCcw size={28} className="text-cyan-400" />,
    title: "Real-time Sync",
    description: "All changes appear instantly, no refresh needed.",
  },
  {
    icon: <Layers3 size={28} className="text-cyan-400" />,
    title: "Unified Platform",
    description: "Everything you need — coding, calling, collaborating — in one place.",
  },
];

const AboutPage = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-16">

        <section className="mb-16 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-500 to-white text-transparent bg-clip-text pb-6">
            About Our Platform      
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed mt-8 max-w-3xl mx-auto pb-12 ">
            Our real-time collaborative code editor empowers developers to code,
            communicate, and collaborate seamlessly — all in a single unified platform.
            Whether you're building solo or brainstorming in a team, we offer
            real-time editing, live video/audio communication, and smart coding features
            to make development truly interactive and efficient.
          </p>
        </section>

        <section className="mb-20 text-center">
          <h1 className="text-5xl font-bold pb-8 bg-gradient-to-r from-cyan-500 to-white text-transparent bg-clip-text">
            Key Features
          </h1>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 pb-12 gap-8 justify-items-center">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-cyan-500 rounded-2xl p-6 w-60 h-60 text-left hover:scale-105 transition-all duration-200 shadow-md shadow-cyan-900 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-4">
                  {feature.icon}
                  <h4 className="text-xl font-bold">{feature.title}</h4>
                </div>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <Team />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
