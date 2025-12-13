import React from 'react';

export const CourseCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
    <div className="h-48 bg-gray-200 animate-pulse" />
    <div className="p-5 flex flex-col flex-1 space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
    </div>
  </div>
);

export const LearningCardSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 h-full">
    <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 animate-pulse" />
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
            <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
         <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
         </div>
         <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);