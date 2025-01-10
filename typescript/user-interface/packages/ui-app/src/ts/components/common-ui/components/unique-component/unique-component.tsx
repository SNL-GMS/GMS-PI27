import type GoldenLayout from '@gms/golden-layout';
import { nonIdealStateWithNoSpinner } from '@gms/ui-core-components';
import { commonActions, useAppDispatch, useAppSelector } from '@gms/ui-state';
import type { FunctionComponent, PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef } from 'react';

interface UniqueComponentProps {
  name: string;
  glContainer?: GoldenLayout.Container;
}
/**
 * Checks to see if there is already an instance of this component running, if there is
 * this component will return a non ideal state component instead.
 *
 * @param props unique id and children
 * @returns children or non ideal state
 */
export const UniqueComponent: FunctionComponent<
  PropsWithChildren<UniqueComponentProps>
> = props => {
  const { children, name, glContainer } = props;
  const id = useRef(Date.now());
  const uniqueComponents = useAppSelector(state => state.app.common.uniqueComponent);

  const dispatch = useAppDispatch();

  // Confirm if this component is unique across tabs
  const isUnique = useMemo(() => {
    if (!uniqueComponents[name]) return true;
    return id.current >= uniqueComponents[name];
  }, [uniqueComponents, name]);

  // Use effect without required array should run AFTER render
  useEffect(() => {
    let timer;
    if (!isUnique) {
      // Timeout prevents an error with synchronously unmounting the component
      timer = setTimeout(() => {
        if (glContainer) {
          glContainer.close();
        }
      });
    }

    // Store the name and id in the cache
    dispatch(commonActions.setUniqueComponent({ name, id: id.current }));

    return () => {
      clearTimeout(timer);
    };
  });

  // If unique render children, otherwise show a non ideal state
  return useMemo(() => {
    return isUnique
      ? children
      : nonIdealStateWithNoSpinner('Error', 'This display is already open in another tab.');
  }, [children, isUnique]);
};
