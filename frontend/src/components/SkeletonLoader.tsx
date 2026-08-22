import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-800 rounded-xl" />
          <div className="h-5 w-20 bg-slate-800 rounded" />
          <div className="h-5 w-28 bg-slate-800 rounded font-mono" />
        </div>
        <div className="h-6 w-16 bg-slate-800 rounded" />
      </div>

      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-800 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-32 bg-slate-800 rounded-lg" />
          <div className="h-6 w-24 bg-slate-800 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 h-14 bg-slate-950/60 rounded-xl" />

      <div className="space-y-2">
        <div className="h-12 bg-slate-800/40 rounded-xl" />
        <div className="h-12 bg-slate-800/40 rounded-xl" />
      </div>
    </div>
  );
};

export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
