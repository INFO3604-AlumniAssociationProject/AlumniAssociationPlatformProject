import React from 'react';
import uwiLogo from '../assets/UWILogo.jpg';

export default function Logo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <img
        src={uwiLogo}
        alt="UWI Logo"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}