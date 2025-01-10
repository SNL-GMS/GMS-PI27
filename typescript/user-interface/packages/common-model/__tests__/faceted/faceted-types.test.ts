import type { EntityReference, Faceted, VersionReference } from '../../src/ts/faceted';

describe('Faceted types', () => {
  interface Foo extends Faceted {
    otherStuff: 'goes here';
  }

  test('with defaults test', () => {
    const faceted: Foo = {
      name: 'foo',
      effectiveAt: 123,
      otherStuff: 'goes here'
    };
    // tests are here just to make sure we have typed examples that will break if the types are changed
    expect(faceted).toBeDefined();
    expect(faceted.name).toBeDefined();
    expect(faceted.effectiveAt).toBeDefined();

    const entityRef: EntityReference<'name'> = {
      name: 'foo entity'
      // no effectiveAt
      // no otherStuff
    };
    expect(entityRef).toMatchObject<Omit<Foo, 'effectiveAt' | 'otherStuff'>>(entityRef);
    expect(entityRef.name).toBeDefined();
    expect((entityRef as any).effectiveAt).toBeUndefined();
    expect((entityRef as any).otherStuff).toBeUndefined();

    const versionRef: VersionReference<'name'> = {
      name: 'foo version',
      effectiveAt: 123
      // no other stuff can go here
    };
    expect(versionRef).toMatchObject<Omit<Foo, 'otherStuff'>>(versionRef);
  });

  test('with explicit `name: string` identifier', () => {
    // tests are here just to make sure we have typed examples that will break if the types are changed
    const entityRef: EntityReference<'name', Foo> = {
      name: 'foo entity 2'
      // no effectiveAt
      // no otherStuff
    };
    expect(entityRef).toMatchObject<Omit<Foo, 'effectiveAt' | 'otherStuff'>>(entityRef);
    expect(entityRef.name).toBeDefined();
    expect((entityRef as any).effectiveAt).toBeUndefined();
    expect((entityRef as any).otherStuff).toBeUndefined();
    const versionRef: VersionReference<'name', Foo> = {
      name: 'foo entity 2',
      effectiveAt: 1234
      // no otherStuff
    };
    expect(versionRef).toMatchObject<Omit<Foo, 'otherStuff'>>(versionRef);
    expect(versionRef.name).toBeDefined();
    expect((versionRef as any).effectiveAt).toBeDefined();
    expect((versionRef as any).otherStuff).toBeUndefined();
  });

  test('with complex object as identifier', () => {
    interface ComplexId {
      startTime: number;
      thisCouldBeAnyObject: true;
    }

    interface ComplexFaceted extends Faceted<{ id: ComplexId }> {
      name: string;
      id: ComplexId;
      otherStuff: 'goes here';
    }

    const complexObj: ComplexFaceted = {
      name: 'name',
      id: {
        startTime: 1234,
        thisCouldBeAnyObject: true
      },
      effectiveAt: 1234,
      otherStuff: 'goes here'
    };

    const complexEntityReference: EntityReference<'id', ComplexFaceted> = {
      id: {
        startTime: 9876,
        thisCouldBeAnyObject: true
      }
      // no other stuff can go here
    };
    expect(complexObj).toMatchObject<ComplexFaceted>(complexObj);
    expect(complexEntityReference).toMatchObject<
      Omit<ComplexFaceted, 'effectiveAt' | 'otherStuff' | 'name'>
    >(complexEntityReference);

    const complexVersion: VersionReference<'id', ComplexFaceted> = {
      id: {
        startTime: 9876,
        thisCouldBeAnyObject: true
      },
      effectiveAt: 9876
      // no other stuff can go here
    };
    expect(complexVersion).toMatchObject<
      Omit<ComplexFaceted, 'effectiveAt' | 'otherStuff' | 'name'>
    >(complexVersion);
    expect(complexVersion.id).toMatchObject<ComplexId>(complexVersion.id);
  });
});
