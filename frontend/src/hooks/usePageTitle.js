import { useEffect } from 'react';

export const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | AFEX` : 'AFEX - Social Media Platform';
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}; 