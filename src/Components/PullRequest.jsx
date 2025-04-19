import React, { useState } from "react";
import { GitPullRequest, XCircle, CheckCircle } from "lucide-react";
import Navbar from "./Navbar";

const PullRequestPage = () => {
  const [pullRequests, setPullRequests] = useState([
    {
      id: 1,
      title: "Add real-time chat support",
      description: "Implements socket.io for chat",
      status: "open",
      author: "Alice",
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Fix bug in editor resize",
      description: "Fixes resizing issue in split view",
      status: "closed",
      author: "Bob",
      time: "1 day ago",
    },
  ]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenPR = () => {
    if (title.trim() === "" || description.trim() === "") return;
    const newPR = {
      id: Date.now(),
      title,
      description,
      status: "open",
      author: "You",
      time: "Just now",
    };
    setPullRequests([newPR, ...pullRequests]);
    setTitle("");
    setDescription("");
  };

  const handleClosePR = (id) => {
    setPullRequests((prev) =>
      prev.map((pr) => (pr.id === id ? { ...pr, status: "closed" } : pr))
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Pull Request Page Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Open New Pull Request */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Open a New Pull Request</h2>
          <div className="bg-gray-800 p-6 rounded-2xl border border-cyan-500 space-y-4">
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white outline-none"
              placeholder="Pull Request Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full p-2 rounded bg-gray-700 text-white outline-none"
              placeholder="Description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              onClick={handleOpenPR}
              className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded hover:bg-cyan-400"
            >
              Submit Pull Request
            </button>
          </div>
        </section>

        {/* Pull Request List */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Existing Pull Requests</h2>
          <div className="space-y-4">
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="flex flex-col md:flex-row justify-between bg-gray-800 p-4 rounded-2xl border border-cyan-500"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GitPullRequest className="text-cyan-400" />
                    <h4 className="text-lg font-semibold">{pr.title}</h4>
                  </div>
                  <p className="text-gray-300">{pr.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    By {pr.author} • {pr.time}
                  </p>
                </div>
                <div className="flex items-center mt-4 md:mt-0 gap-4">
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      pr.status === "open"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {pr.status.toUpperCase()}
                  </span>
                  {pr.status === "open" && (
                    <button
                      onClick={() => handleClosePR(pr.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                    >
                      <XCircle size={16} /> Close
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PullRequestPage;
