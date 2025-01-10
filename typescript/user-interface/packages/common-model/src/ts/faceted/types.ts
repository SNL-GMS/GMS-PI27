import type { RequireAtLeastOne } from '../type-util/type-util';

/**
 * An interface with the optional effectiveAt field that is a component of the
 * {@link Faceted} type (the {@link EntityReference} util will exclude this field)
 */
interface MaybeWithEffectiveAt {
  effectiveAt?: number;
}

/**
 * The set of all keys that are allowed as faceting identifiers.
 *
 * ! Add any new identifier keys to this list
 */
export type FacetedIDKeys = 'name' | 'id';

/**
 * A type with at least one of the keys in {@link FacetedIDKeys}.
 * This is a required component of the {@link Faceted} type.
 */
export type WithFacetedIdentifier<T extends Partial<{ [Identifier in FacetedIDKeys]: unknown }>> =
  RequireAtLeastOne<
    {
      [Identifier in FacetedIDKeys]: T[Identifier];
    },
    FacetedIDKeys
  >;

/**
 * A type describing a faceted object which may be narrowed to an entity reference or a version reference.
 *
 * Faceted objects must contain an identifier and an `effectiveAt` time.
 * The identifier generally is something like `name: string`, but could be a complex object with an
 * arbitrary string for a key.
 * Faceted identifiers must exist in the {@link FacetedIDKeys} type.
 *
 * By default, uses `name: string` as the identifier.
 *
 * @param effectiveAt is a number representing the time in epoch seconds.
 *
 *
 * Faceted objects are fully populated by default, and may be processed with the {@link EntityReference} and {@link VersionReference} utils
 * in order to generate the narrower types.
 *
 * @example interface Foo extends Faceted { name: string; effectiveAt: number; isExample: true; }
 */
export type Faceted<
  T extends WithFacetedIdentifier<T> = {
    name: string;
  }
> = {
  [K in keyof T]: T[K];
} & MaybeWithEffectiveAt;

/**
 * Creates an entity reference type from a faceted type
 *
 * ### Examples
 *
 * @example
 * ```
 * ? Simple example with default values
 * interface Foo extends Faceted {
 *   otherStuff: 'goes here';
 * }
 *
 * const faceted: Foo = {
 *   name: 'foo',
 *   effectiveAt: 123,
 *   otherStuff: 'goes here'
 * };
 *
 * const entityRef: EntityReference<'name'> = {
 *   name: 'foo entity'
 *   // no effectiveAt
 *   // no otherStuff
 * };
 * ```
 *
 * @example
 * ```
 * ?Example with complex object as identifier
 * interface ComplexId {
 *   startTime: number;
 *   thisCouldBeAnyObject: true;
 * }
 *
 * interface ComplexFaceted extends Faceted<{ id: ComplexId }> {
 *   id: ComplexId;
 *   otherStuff: 'goes here';
 * }
 *
 * const complexObj: ComplexFaceted = {
 *   id: {
 *     startTime: 1234,
 *     thisCouldBeAnyObject: true
 *   },
 *   otherStuff: 'goes here'
 * };
 *
 * const complexEntityReference: EntityReference<'id', ComplexFaceted> = {
 *   id: {
 *     startTime: 9876,
 *     thisCouldBeAnyObject: true
 *   }
 *   // no other stuff can go here
 * };
 * ```
 */
export type EntityReference<
  K extends keyof T,
  T extends WithFacetedIdentifier<T> = { name: string }
> = Pick<T, K>;

/**
 * Creates a version reference type from a faceted object.
 *
 * @example
 * ```
 * // simple example with defaults
 * const versionRef: VersionReference<'name'> = {
 *    name: 'foo version',
 *    effectiveAt: 123
 *    // no other stuff can go here
 *  };
 * ```
 *
 * @example
 * ```
 * // Example with complex object
 * interface ComplexId {
 *    startTime: number;
 *    thisCouldBeAnyObject: true;
 *  }
 * interface ComplexFaceted extends Faceted<{ id: ComplexId }> {
 *   id: ComplexId;
 *   otherStuff: 'goes here';
 * }
 * const complexVersion: VersionReference<'id', ComplexFaceted> = {
 *    id: {
 *      startTime: 9876,
 *      thisCouldBeAnyObject: true
 *    },
 *    effectiveAt: 9876
 *    // no other stuff can go here
 *  };
 * ```
 */
export type VersionReference<
  K extends keyof Omit<T, 'effectiveAt'>,
  T extends MaybeWithEffectiveAt & Faceted = { name: string; effectiveAt: number }
> = Pick<T, K | 'effectiveAt'>;
