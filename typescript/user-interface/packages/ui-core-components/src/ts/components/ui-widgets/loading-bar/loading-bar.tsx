import classNames from 'classnames';
import React from 'react';

/**
 * For how long should the --transitioning modifier class be applied to the element?
 */
const TRANSITION_DURATION_MS = 300;
type Fade = 'fade-in' | 'fade-out';

/**
 * The type of the props for the {@link LoadingBar} component
 */
export interface LoadingBarProps {
  /**
   * Whether to display the loading indicator. If false, nothing will render.
   */
  isLoading: boolean;
  /**
   * A fraction between 0 and 1, inclusive
   */
  percentage?: number;
}

/**
 * A loading bar that appears at the top of the ancestor element that creates the z-index stacking context
 */
export function LoadingBar({ isLoading, percentage }: LoadingBarProps) {
  const [fade, setFade] = React.useState<Fade>();
  const transitionStyle = React.useMemo(
    () =>
      ({
        '--transition-duration-ms': TRANSITION_DURATION_MS
      }) as React.CSSProperties,
    []
  );
  const style = React.useMemo(
    () => ({
      width: '100%',
      transform:
        percentage != null ? `translateX(-${100 - (percentage ?? 1) * 100}%)` : 'translateX(0)'
    }),
    [percentage]
  );
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  React.useLayoutEffect(() => {
    clearTimeout(timeoutRef.current);
    setFade(isLoading ? 'fade-in' : 'fade-out');
    timeoutRef.current = setTimeout(() => {
      setFade(undefined);
    }, TRANSITION_DURATION_MS);
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [isLoading]);
  return (
    <div
      style={transitionStyle}
      className={classNames([
        'loading-bar__outer-wrapper',
        {
          'loading-bar__outer-wrapper--fade-in': fade === 'fade-in',
          'loading-bar__outer-wrapper--fade-out': fade === 'fade-out',
          'loading-bar__outer-wrapper--visible': isLoading || fade
        }
      ])}
    >
      <div className="loading-bar__inner-wrapper" style={style}>
        <div
          className={classNames('loading-bar__indicator', {
            'loading-bar__indicator--animated ': percentage == null
          })}
        />
      </div>
    </div>
  );
}
