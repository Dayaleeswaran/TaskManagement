import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading, please wait...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute w-14 h-14 rounded-full border-4 border-violet-500/10 border-t-violet-500 animate-spin"></div>
        {/* Inner reverse spinner */}
        <div className="w-10 h-10 rounded-full border-4 border-fuchsia-500/10 border-t-fuchsia-500 animate-spin animate-reverse opacity-80"></div>
        {/* Center icon */}
        <Loader2 className="h-5 w-5 text-violet-400 animate-pulse absolute" />
      </div>
      <p className="text-slate-400 text-sm font-semibold tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}
