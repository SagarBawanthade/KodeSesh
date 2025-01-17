import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            Real time code editor Dashboard
          </h1>
          <div className="h-1 w-32 bg-indigo-500 rounded"></div>
        </div>

        {/* Team Members Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Team Members
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Sagar', 'Bhumika', 'Shreya'].map((member) => (
              <li
                key={member}
                className="bg-indigo-50 rounded-lg p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">
                      {member[0]}
                    </span>
                  </div>
                  <span className="text-lg font-medium text-gray-800">
                    {member}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;