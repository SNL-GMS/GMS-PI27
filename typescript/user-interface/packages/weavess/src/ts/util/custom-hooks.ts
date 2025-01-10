import React from 'react';

/**
 * Hook that keeps track of mouse location and initial mouse x
 *
 * @returns mouse information and setter for mouseX
 */
export const useFollowMouse = (
  initial: { x: number; y: number } = { x: 0, y: 0 }
): {
  initialMouseX: number;
  onMouseMove: (event: MouseEvent) => void;
  setMouseX: React.Dispatch<React.SetStateAction<number>>;
  mouseX: number;
  mouseY: number;
} => {
  const initialMouseX = React.useRef<number>(initial.x);
  const [mouseX, setMouseX] = React.useState(initial.x);
  const [mouseY, setMouseY] = React.useState(initial.y);

  //! useEffect updates local state
  React.useEffect(() => {
    setMouseX(initial.x);
    setMouseY(initial.y);
    initialMouseX.current = initial.x;
  }, [initial]);

  const onMouseMove = React.useCallback((event: MouseEvent) => {
    setMouseX(event.clientX);
    setMouseY(event.clientY);
  }, []);

  return {
    initialMouseX: initialMouseX.current,
    onMouseMove,
    setMouseX,
    mouseX,
    mouseY
  };
};
