import React from "react";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";
import Navbar from "./Navbar";

const notifications = [
  {
    id: 1,
    title: "Pull Request Merged",
    message: "Your pull request #102 has been successfully merged.",
    type: "success",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "New Comment",
    message: "Someone commented on your file `main.js`.",
    type: "info",
    time: "4 hours ago",
  },
  {
    id: 3,
    title: "Sync Failed",
    message: "Sync with GitHub failed. Please try again.",
    type: "error",
    time: "1 day ago",
  },
];

const NotificationCard = ({ title, message, time, type }) => {
  const icon =
    type === "success" ? (
      <CheckCircle className="text-green-500" />
    ) : type === "error" ? (
      <AlertTriangle className="text-red-500" />
    ) : (
      <Bell className="text-yellow-500" />
    );

  return (
    <div className="flex items-start gap-4 bg-gray-800 border border-cyan-500 p-4 rounded-2xl shadow-md hover:bg-gray-700 transition">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="text-white font-semibold">{title}</h4>
        <p className="text-gray-300 text-sm">{message}</p>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
};

const NotificationPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar /> 

      {/* Notifications */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 border-b border-cyan-500 pb-2">Notifications</h2>
        <div className="space-y-4">
          {notifications.map((notif) => (
            <NotificationCard key={notif.id} {...notif} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default NotificationPage;
