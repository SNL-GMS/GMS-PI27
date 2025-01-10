/* eslint-disable react/jsx-props-no-spreading */
import type GoldenLayout from '@gms/golden-layout';
import { useForceGlUpdateOnResizeAndShow } from '@gms/ui-util';
import * as React from 'react';

import type { NonIdealStateDefinition } from './types';

/**
 * Check the list of non ideal states against the props
 *
 * @param props the component's props of type <T> that we should check for non-ideal state conditions
 * @param nonIdealStates the ordered list of non ideal states which could be applied
 */
export function useMaybeGetNonIdealState<T extends { glContainer?: GoldenLayout.Container }, C = T>(
  props: T,
  nonIdealStates: NonIdealStateDefinition<T, C>[]
): NonIdealStateDefinition<T, C> | null {
  return React.useMemo(() => {
    let nonIdealState: NonIdealStateDefinition<T, C> | null = null;
    nonIdealStates.forEach(nis => {
      if (!nonIdealState && nis.condition(props)) {
        nonIdealState = nis;
      }
    });
    return nonIdealState;
    // Manually check Golden Layout because it's not a referentially stable object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonIdealStates, props, props?.glContainer?.isHidden]);
}

/**
 * This function applies the non-ideal-state definition's `converter` function, if one is defined.
 * This can be used to change the props after they have been checked. For example, this may be used
 * in order to strip away unnecessary metadata and return only the `data` object from within a query.
 * This can help preserve referential equality, and therefore can be used to optimize memoized and
 * pure components to reduce unnecessary renders.
 *
 * @param props the props to transform
 * @param nonIdealStates the list of non ideal state definitions for which converter functions should
 * be called on the props.
 */
function useMaybeTransformProps<T, C = T>(
  props: T,
  nonIdealStates: NonIdealStateDefinition<T, C>[]
): React.PropsWithChildren<C> {
  return React.useMemo(
    () =>
      nonIdealStates.reduce((childProps: Partial<T | C>, nis) => {
        if (nis.converter) {
          return nis.converter(childProps as T);
        }
        return childProps;
      }, props) as React.PropsWithChildren<C>,
    [nonIdealStates, props]
  );
}

/**
 * Either renders a non-ideal state (if its condition is true), or render the provided component.
 *
 * @param nonIdealStates A list of NonIdealStateDefinitions.
 * In the order provided, their conditions are checked.
 * If the condition returns true, then return that non-ideal state.
 * If a golden layout container is part of the props, then this component
 * attaches listeners to force the component to update on show and resize.
 * @param WrappedComponent The component that should be rendered if no non-ideal state conditions are true.
 */
export function WithNonIdealStates<PropsType, ChildPropsType = PropsType>(
  nonIdealStates: NonIdealStateDefinition<any, any>[],
  WrappedComponent: React.ComponentClass<ChildPropsType> | React.FunctionComponent<ChildPropsType>,
  nonBlockingIdealStates: NonIdealStateDefinition<any, any>[] = []
) {
  return React.memo(function WrappedWithNonIdealStateChecker(props: PropsType) {
    useForceGlUpdateOnResizeAndShow(
      // cast it because the hook checks for undefined
      (props as Partial<{ glContainer?: GoldenLayout.Container }>).glContainer
    );
    const nonIdealState = useMaybeGetNonIdealState(props, nonIdealStates);

    const nonBlockingStates = useMaybeGetNonIdealState(props, nonBlockingIdealStates);

    const transformedProps = useMaybeTransformProps<PropsType, ChildPropsType>(
      props,
      nonIdealStates
    );

    if (nonIdealState?.element) return nonIdealState?.element;
    return (
      <>
        {nonBlockingStates?.element}
        <div
          className={
            nonBlockingStates?.element
              ? `non-ideal-loading-wrapper-hidden`
              : `non-ideal-loading-wrapper`
          }
        >
          <WrappedComponent {...transformedProps} class="hidden" />
        </div>
      </>
    );
  });
}
