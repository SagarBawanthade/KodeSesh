import React, { useState, useEffect } from 'react';

const colorOptions = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-teal-500', 'bg-rose-500',
];

const AccountInfoPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileBg, setProfileBg] = useState('');
  const [user, setUser] = useState({
    name: 'John Doe',
    username: 'johndoe123',
    email: 'johndoe@example.com',
    github: 'https://github.com/johndoe',
    monthlyUsage: 22,
  });

  useEffect(() => {
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setProfileBg(randomColor);
  }, []);

  const handleEditToggle = () => setIsEditing(!isEditing);
  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
  const handleSignOut = () => console.log('Signing out...');

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <div className="relative max-w-3xl w-full">

        {/* Glow Aura + Border */}
        <div className="absolute inset-0 rounded-3xl z-0">
          {/* Glow Layer */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 blur-3xl opacity-40"></div>
          {/* Gradient Border Layer */}
          <div className="absolute inset-0 rounded-3xl p-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600"></div>
        </div>

        {/* Gradient border container */}
        <div className="relative rounded-3xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 p-[1px]">
          {/* Main Card - Everything inside remains exactly the same */}
          <div className="relative z-10 bg-slate-950 rounded-3xl p-8 backdrop-blur-md shadow-xl border border-transparent">
            
            {/* Header */}
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${profileBg}`}>
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{user.username}</h2>
                <p className="text-gray-400">{user.email}</p>
                <a
                  href={user.github}
                  className="text-cyan-400 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Profile
                </a>
              </div>
            </div>

            {/* Editable Info */}
            <div className="space-y-4 mt-8">
              {['name', 'username', 'email', 'github'].map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
                  <input
                    name={field}
                    type={field === 'email' ? 'email' : field === 'github' ? 'url' : 'text'}
                    value={user[field]}
                    disabled={!isEditing}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg bg-gray-700 text-white ${
                      isEditing
                        ? 'focus:outline-none focus:ring-2 focus:ring-cyan-500'
                        : 'opacity-70 cursor-not-allowed'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Usage Bar */}
            <div className="space-y-2 pt-6">
              <label className="block text-sm text-gray-400">Monthly Editor Usage</label>
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full text-xs flex items-center justify-end pr-2"
                  style={{ width: `${(user.monthlyUsage / 30) * 100}%` }}
                >
                  {user.monthlyUsage} / 30 days
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-8 flex justify-between items-center">
              <button
                onClick={handleEditToggle}
                className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
              >
                {isEditing ? 'Save Changes' : 'Edit Info'}
              </button>

              <button
                onClick={handleSignOut}
                className="bg-black border border-cyan-500 hover:bg-cyan-700 hover:text-black px-4 py-2 rounded-xl font-semibold transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoPage;