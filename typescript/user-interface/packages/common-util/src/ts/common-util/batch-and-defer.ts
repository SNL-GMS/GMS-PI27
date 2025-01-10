import debounce from 'lodash/debounce';
import defer from 'lodash/defer';

/**
 * Will return a version of the input function that will batch all given parameters into
 * fewer calls.
 *
 * @param fn the function to batch and defer
 * @param wait how long to wait for more params (default 150)
 * @returns the batched function
 */
export const batchAndDefer = <T>(fn, wait = 150) => {
  const batchedArguments: unknown[] = [];

  const runFn = () => {
    // Clone of the batched arguments so defer will still have access within this scope
    const args = [...batchedArguments];
    // empty batched arguments
    batchedArguments.length = 0;

    defer(fn, args);
  };

  const debounced = debounce(runFn, wait);

  return (incomingArgs: T) => {
    if (Array.isArray(incomingArgs)) {
      batchedArguments.push(...incomingArgs);
    } else {
      batchedArguments.push(incomingArgs);
    }

    debounced.cancel();
    debounced();
  };
};
