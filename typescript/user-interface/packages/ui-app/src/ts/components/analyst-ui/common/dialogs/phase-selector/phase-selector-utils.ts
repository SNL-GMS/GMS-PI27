import React from 'react';

export function useHasScrolled(ref: React.MutableRefObject<HTMLElement | null>) {
  const [hasScrolled, setHasScrolled] = React.useState(false);

  const { current } = ref ?? {};
  //! useEffect updates local state
  React.useEffect(() => {
    const updatePosition = () => {
      if (current && current.scrollTop > 0 && !hasScrolled) {
        setHasScrolled(true);
      } else if (current?.scrollTop === 0 && hasScrolled) {
        setHasScrolled(false);
      }
    };
    current?.addEventListener('scroll', updatePosition);
    updatePosition();
    return () => window.removeEventListener('scroll', updatePosition);
  }, [current, hasScrolled]);

  return hasScrolled;
}
