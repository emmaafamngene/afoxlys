import React, { useState } from "react";

const dummyComments = [
  {
    id: 1,
    avatar: "/avatars/user1.jpg",
    username: "Daisy7",
    time: "5-21",
    text: "Weti bi this rubbish?",
    likes: 1679,
    replies: 73,
  },
  {
    id: 2,
    avatar: "/avatars/user2.jpg",
    username: "berospam0",
    time: "5-21",
    text: "wtf did I just watch...",
    likes: 5835,
    replies: 23,
  },
  // ...add more comments as needed
];

export default function Fliks() {
  const [commentInput, setCommentInput] = useState("");

  return (
    <div className="flex h-screen bg-black">
      {/* Video Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full flex justify-center">
          <video
            src="/video.mp4"
            className="min-w-[500px] max-w-[640px] h-[800px] rounded-xl object-cover bg-black shadow-2xl"
            autoPlay
            loop
            muted
            controls={false}
          />
        </div>
      </div>

      {/* Comments Panel */}
      <div className="w-[400px] h-screen bg-zinc-900 flex flex-col border-l border-zinc-800">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-white font-bold text-lg">Comments (3397)</span>
        </div>
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {dummyComments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <img src={c.avatar} className="w-8 h-8 rounded-full" alt={c.username} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{c.username}</span>
                  <span className="text-xs text-gray-400">{c.time}</span>
                  <button className="ml-2 text-xs text-blue-400 hover:underline">Reply</button>
                </div>
                <p className="text-sm text-gray-300">{c.text}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <button className="flex items-center gap-1 hover:text-pink-500">
                    <span>❤️</span>
                    <span>{c.likes}</span>
                  </button>
                  <button className="hover:underline">View {c.replies} replies</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800 flex items-center bg-zinc-900 sticky bottom-0">
          <input
            className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-white text-sm outline-none"
            placeholder="Add comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          />
          <button className="ml-2 text-blue-500 font-bold">Post</button>
        </div>
      </div>
    </div>
  );
} 