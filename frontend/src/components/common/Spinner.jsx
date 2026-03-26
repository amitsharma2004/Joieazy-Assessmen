import React from 'react';

const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`animate-spin rounded-full border-t-2 border-blue-500 border-r-2 border-gray-200 ${sizes[size]}`} />
    </div>
  );
};

export default Spinner;
