import React from 'react';
import { useFirebase } from '../context/FirebaseContext';

export const LoginView = () => {
  const { signIn } = useFirebase();

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0e0e10] text-[#e8e8f0] font-sans">
      <div className="max-w-md w-full p-8 border border-[#26262e] bg-[#16161a] rounded-xl shadow-2xl">
        <h1 className="text-4xl font-bold mb-2 tracking-tight font-serif italic">Flow</h1>
        <p className="mb-8 text-[#8888a0] font-mono text-sm">
          Focus on what matters.
        </p>
        <button
          onClick={signIn}
          className="w-full py-3 bg-[#7c6af7] text-white font-medium rounded-lg hover:bg-[#a394ff] transition-colors cursor-pointer"
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
};
