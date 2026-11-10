import React from 'react';

interface PowerPointIconProps {
  className?: string;
}

export const PowerPointSlideIcon: React.FC<PowerPointIconProps> = ({
  className = 'w-4 h-4',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="14" rx="2.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 8h4" />
      <path d="M7 12h6" />
      <circle cx="16.5" cy="10" r="2" />
    </svg>
  );
};

export const PowerPointIcon = PowerPointSlideIcon;

