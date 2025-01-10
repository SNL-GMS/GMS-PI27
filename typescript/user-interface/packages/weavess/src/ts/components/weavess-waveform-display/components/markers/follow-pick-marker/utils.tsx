import React from 'react';

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = React.useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null
  });
  //! useEffect updates local state
  React.useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);
  return mousePosition;
};
