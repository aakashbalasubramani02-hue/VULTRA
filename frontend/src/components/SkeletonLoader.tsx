import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-[#11141B] border border-[#1E2530] p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#191c20]" />
          <div className="h-5 w-20 bg-[#191c20]" />
          <div className="h-5 w-28 bg-[#191c20] font-mono" />
        </div>
        <div className="h-6 w-16 bg-[#191c20]" />
      </div>

      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-[#191c20]" />
        <div className="flex gap-2">
          <div className="h-5 w-32 bg-[#191c20]" />
          <div className="h-5 w-24 bg-[#191c20]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 h-12 bg-[#0c0e12] border border-[#1E2530]" />

      <div className="space-y-2">
        <div className="h-10 bg-[#0c0e12]" />
        <div className="h-10 bg-[#0c0e12]" />
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
