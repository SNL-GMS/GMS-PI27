/**
 * Converts any properties of Type that match a key in the list of keys to be of the type ReplacementType.
 *
 * For example: given a type Foo { id: number; name: string; }
 * ConvertPropertiesToType<Foo, 'id' | 'string' | 'missing-key', 'Tom' | 'Jerry'>
 * returns { id: 'Tom' | 'Jerry'; name: 'Tom' | 'Jerry'; }
 * Note that it ignores the key 'missing-key' because it was not a match for any keys within T.
 *
 * @param Type the type on which to operate
 * @param Keys a list of keys that should be replaced if they are found in @param Type
 * @param ReplacementType the type that any parameters matching the @param Keys should be replaced with.
 */
export type ConvertPropertiesToType<Type, Keys, ReplacementType> = {
  [Property in keyof Type]: Property extends Keys ? ReplacementType : Type[Property];
};

/**
 * Makes a readonly type writable. Useful for building objects of readonly types piece by piece.
 * See {@link https://stackoverflow.com/questions/46634876/how-can-i-change-a-readonly-property-in-typescript}
 */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Returns the values of strings in a Set as a type that consists of a union of all of the strings in the.
 */
export type SetKeys<T extends Set<string>> = T extends Set<infer I> ? I : never;

/**
 * A type util that takes in a type, and a union of string keys, and requires that only
 * one of the keys will present.
 *
 * @see {@link https://stackoverflow.com/questions/49562622/typed-generic-key-value-interface-in-typescript StackOverflow post }
 * for details on how this works.
 *
 * @example
 * ```
 * interface Foo {
 *   keyNum: number;
 *   keyStr: string;
 *   keyBool?: boolean;
 * }
 * const withNum: RequireOnlyOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyNum: 1 }; // valid
 * const withStr: RequireOnlyOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyStr: 'bar' }; // valid
 * const withBool: RequireOnlyOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyBool: true }; // valid
 * const invalidTooMany: RequireOnlyOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyNum: 0, keyBool: false }; // invalid
 * const invalidEmpty: RequireAtLeastOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { }; // invalid
 * ```
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * A type util that takes in a type, and a union of string keys, and requires that at least
 * one of the keys will present.
 *
 * @see {@link https://stackoverflow.com/questions/49562622/typed-generic-key-value-interface-in-typescript StackOverflow post }
 * for details on how this works.
 *
 * @example
 * ```
 * interface Foo {
 *   keyNum: number;
 *   keyStr: string;
 *   keyBool?: boolean;
 * }
 * const withNum: RequireAtLeastOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyNum: 1 }; // valid
 * const withStr: RequireAtLeastOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyStr: 'bar' }; // valid
 * const withBool: RequireAtLeastOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyBool: true }; // valid
 * const validMultiples: RequireAtLeastOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { keyNum: 0, keyBool: false }; // valid
 * const invalidEmpty: RequireAtLeastOne<Foo, 'keyNum' | 'keyStr' | 'keyBool'> = { }; // invalid
 * ```
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Takes in a type and a series of properties to modify
 */
export type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Inverse of built-in <NonNullable> type
 * Appends `| null` to all properties
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Make the specified properties in T required.
 * See: {@link Required}
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Make the specified properties in T all required together, or none required
 */
export type AllOrNone<T> = T | { [K in keyof T]?: never };

/**
 * Make the specified properties in T to be included and the properties in U to not be included.
 */
export type Only<T, U> = {
  [P in keyof T]: T[P];
} & {
  [P in keyof U]?: never;
};

/**
 * Either T or U.
 *
 * ! Use with caution when the types have common fields
 */
export type Either<T, U> = Only<T, U> | Only<U, T>;
