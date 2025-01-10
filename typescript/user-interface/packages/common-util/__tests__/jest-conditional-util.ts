/**
 * Creates a conditional test closure.
 *
 * @param condition if true return {@link it} else {@link it.skip}
 * @returns a test closure.
 */
export const itIf = condition => (condition ? it : it.skip);

/**
 * Creates a conditional test closure.
 *
 * @param condition if true return {@link it} else {@link it.skip}
 * @returns a test closure.
 */
export const testIf = condition => (condition ? test : test.skip);

/**
 * Creates a performance test test closure.
 * !SKIPPED if {@link process.env.DISABLE_PERFORMANCE_TEST} is set to `true`
 *
 * @returns a performance test closure.
 */
export const testPerformance = testIf(process.env.DISABLE_PERFORMANCE_TEST !== 'true');
