import React from 'react';
export const TooltipProvider = ({ children }: any) => children;
export const Tooltip = ({ children }: any) => children;
export const TooltipTrigger = ({ children }: any) => children;
export const TooltipContent = ({ children }: any) => (
  <span className="absolute mt-1 text-xs bg-gray-800 text-white px-2 py-1 rounded">{children}</span>
);
