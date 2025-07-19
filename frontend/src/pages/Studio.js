import React from 'react';

const Studio = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12">
      <h1 className="text-3xl font-bold mb-8 text-purple-700 dark:text-purple-400">Flick Studio</h1>
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-10">
        <h2 className="text-xl font-semibold mb-4">Upload a Flick (max 60s)</h2>
        <form>
          <input type="file" accept="video/*" className="mb-4" />
          <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition">Upload</button>
        </form>
      </div>
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Your Flicks</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[120px] flex items-center justify-center text-gray-400">
          {/* Placeholder for user's flicks list */}
          No flicks uploaded yet.
        </div>
      </div>
    </div>
  );
};

export default Studio; 