import React, { useState } from "react";
import Typewriter from "typewriter-effect";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const DocumentationPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const docs = [
    { title: "Introduction", desc: "Section overview goes here." },
    { title: "Installation", desc: "Section overview goes here." },
    { title: "APIs", desc: "Section overview goes here." },
    { title: "Integrations", desc: "Section overview goes here." },
    { title: "Utilities", desc: "Section overview goes here." },
    { title: "Web", desc: "Section overview goes here." },
  ];

  const filteredDocs = docs.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="w-full">
        <Navbar />
      </div>
      
      <div className="p-10 space-y-10">
        <section className="text-center my-16">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-700 via-cyan-500 to-white bg-clip-text text-transparent">
            Documentation
          </h2>
          <p className="text-gray-300 mt-4">
            Everything you need to get your software documentation online.
          </p>
          <div className="relative mt-6 w-1/2 mx-auto">
            <input
              type="text"
              className="p-3 w-full rounded-lg text-black placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder=""
            />
            <div className="absolute top-3 left-4 text-gray-400 pointer-events-none">
              {searchTerm === "" && (
                <Typewriter
                  options={{
                    strings: ["How to use"],
                    autoStart: true,
                    loop: true,
                    delay: 50,
                  }}
                />
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocs.map((item, index) => (
            <div
              key={index}
              className="bg-gray-950 p-8 rounded-lg shadow-lg space-y-4 cursor-pointer"
              onClick={() => navigate(`/${item.title.replace(/\s+/g, "").toLowerCase()}`)}
            >
              <h3 className="text-cyan-400 text-xl font-semibold">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
