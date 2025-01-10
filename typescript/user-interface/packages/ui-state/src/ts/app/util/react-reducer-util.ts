/**
 * Utils for React.useReducer
 */

/**
 * With this we can infer a string literal type from an arg passed into a function.
 * Either the string literal, or never.
 */
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

/**
 * @example ```ts
 * createPayloadAction<Foo>()('setFoo'); // Creates an action with type equal to the string literal 'setFoo' and a payload of type Foo
 * ```
 *
 * @returns An action with a payload of type Payload
 */
export function createPayloadAction<Payload>() {
  return function createAction<Type>(type: StringLiteral<Type>) {
    return function rotationDialogAction(payload: Payload): {
      type: StringLiteral<Type>;
      payload: Payload;
    } {
      return {
        type,
        payload
      } as {
        type: StringLiteral<Type>;
        payload: Payload;
      };
    };
  };
}

/**
 * @example ```ts
 * createNonPayloadAction()('setFoo'); // Creates an action with type equal to the string literal 'setFoo'
 * ```
 *
 * @returns An action with a type matching the string passed in
 */
export function createNonPayloadAction() {
  return function createAction<Type>(type: StringLiteral<Type>) {
    return function rotationDialogAction(): { type: StringLiteral<Type> } {
      return {
        type
      } as {
        type: StringLiteral<Type>;
      };
    };
  };
}
