import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const blogs = [
  {
    id: 1,
    title: "Leveraging Cloud Computing for Enhanced Cybersecurity",
    description: "Cloud-based security solutions have come a long way since their inception. Initially, these solutions focused primarily on basic firewall and antivirus protection.",
    imageUrl: "https://via.placeholder.com/350x220", 
  },
  {
    id: 2,
    title: "Futuristic Global Trading Network: A Cyberpunk Financial Hub",
    description: "An imaginative look into futuristic financial ecosystems powered by blockchain and AI.",
    imageUrl: "https://via.placeholder.com/350x220", 
  },
  {
    id: 3,
    title: "Hydration Matters",
    description: "Learn why staying hydrated is key for your health and how to do it right.",
    imageUrl: "https://via.placeholder.com/350x220",
  },
  {
    id: 4,
    title: "Meal Prep 101",
    description: "A beginner’s guide to prepping healthy, budget-friendly meals.",
    imageUrl: "https://via.placeholder.com/350x220",
  },
  {
    id: 5,
    title: "Understanding Nutritional Labels",
    description: "Decode the nutritional facts on packaging for smarter choices.",
    imageUrl: "https://via.placeholder.com/350x220",
  },
];

const BlogList = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white min-h-screen">
      <header className="w-full">
        <Navbar />
      </header>

      <main className="px-6 md:px-20 pt-12 pb-16">
        {blogs.map((blog, index) => (
          <div
            key={blog.id}
            onClick={() => navigate(`/blog/${blog.id}`)}
            className={`flex flex-col md:flex-row items-center md:items-start border-b border-cyan-400 pb-8 cursor-pointer hover:bg-gray-900 transition duration-300 rounded-lg ${
              index === 0 ? 'mt-10' : 'mt-6'
            } ${index === blogs.length - 1 ? 'mb-16' : ''}`}
          >
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full md:w-[380px] h-[240px] object-cover rounded-md shadow-lg mb-6 md:mb-0 md:mr-10"
            />
            <div className="text-white max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">{blog.title}</h2>
              <p className="text-gray-300 text-lg">{blog.description}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default BlogList;
