package gms.shared.common.connector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

import org.junit.jupiter.api.Test;

/**
 * This test will leverage the Number hierarchy available in Java to prove out its type checking.
 */
class TypedMapTest {

  @Test
  void testKeyEquals() {
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-int-one", Integer.class);
    TypedMap.Key<Integer> testIntOneDuplicateKey =
        new TypedMap.Key<>("test-int-one", Integer.class);
    TypedMap.Key<Integer> testIntTwoKey = new TypedMap.Key<>("test-int-two", Integer.class);
    TypedMap.Key<Double> testDoubleOneBadNameKey = new TypedMap.Key<>("test-int-one", Double.class);

    assertThat(testIntOneKey)
        .isEqualTo(testIntOneKey)
        .isEqualTo(testIntOneDuplicateKey)
        .isNotEqualTo(testIntTwoKey)
        .isNotEqualTo(testDoubleOneBadNameKey);
  }

  @Test
  void testKeyCompareTo() {
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-one", Integer.class);
    TypedMap.Key<Integer> testIntTwoKey = new TypedMap.Key<>("test-two", Integer.class);
    TypedMap.Key<Double> testDoubleOneKey = new TypedMap.Key<>("test-one", Double.class);

    assertThat(testIntOneKey).isLessThan(testIntTwoKey);
    assertThat(testIntTwoKey).isGreaterThan(testIntOneKey);
    assertThat(testDoubleOneKey.compareTo(testIntOneKey)).isNegative();
    assertThat(testIntOneKey.compareTo(testDoubleOneKey)).isPositive();
  }

  @Test
  void testKeyToString() {
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-int-one", Integer.class);
    assertThat(testIntOneKey).hasToString("test-int-one(Integer)");
  }

  @Test
  void testPutGetDuplicateKey() {
    TypedMap<Integer> intMap = new TypedMap<>();
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-int-one", Integer.class);
    TypedMap.Key<Integer> testIntOneDuplicateKey =
        new TypedMap.Key<>("test-int-one", Integer.class);
    Integer intOne = 1;

    assertThatNoException().isThrownBy(() -> intMap.put(testIntOneKey, intOne));
    assertThat(intMap.get(testIntOneDuplicateKey)).contains(intOne);
  }

  @Test
  void testPutAndGetBaseType() {
    TypedMap<Integer> intMap = new TypedMap<>();
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-int-one", Integer.class);
    TypedMap.Key<Integer> testIntTwoKey = new TypedMap.Key<>("test-int-two", Integer.class);
    Integer intOne = 1;
    Integer intTwo = 2;

    assertThatNoException().isThrownBy(() -> intMap.put(testIntOneKey, intOne));
    assertThatNoException().isThrownBy(() -> intMap.put(testIntTwoKey, intTwo));

    assertThat(intMap.get(testIntOneKey)).contains(intOne);
    assertThat(intMap.get(testIntTwoKey)).contains(intTwo);
  }

  @Test
  void testPutAndGetSubTypes() {
    TypedMap<Number> numberMap = new TypedMap<>();
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-one", Integer.class);
    TypedMap.Key<Integer> testIntTwoKey = new TypedMap.Key<>("test-two", Integer.class);
    TypedMap.Key<Double> testDoubleOneKey = new TypedMap.Key<>("test-one", Double.class);
    Integer intOne = 1;
    Integer intTwo = 2;
    Double doubleOne = 1.0;

    assertThatNoException().isThrownBy(() -> numberMap.put(testIntOneKey, intOne));
    assertThatNoException().isThrownBy(() -> numberMap.put(testIntTwoKey, intTwo));
    assertThatNoException().isThrownBy(() -> numberMap.put(testDoubleOneKey, doubleOne));

    assertThat(numberMap.get(testIntOneKey)).contains(intOne);
    assertThat(numberMap.get(testIntTwoKey)).contains(intTwo);
    assertThat(numberMap.get(testDoubleOneKey)).contains(doubleOne);
  }

  @Test
  void testPutAndGetOverrides() {
    TypedMap<Integer> intMap = new TypedMap<>();
    TypedMap.Key<Integer> testIntOneKey = new TypedMap.Key<>("test-int-one", Integer.class);
    Integer intOne = 1;
    Integer intOneOverride = 2;

    assertThatNoException().isThrownBy(() -> intMap.put(testIntOneKey, intOne));
    assertThat(intMap.get(testIntOneKey)).contains(intOne);

    assertThatNoException().isThrownBy(() -> intMap.put(testIntOneKey, intOneOverride));
    assertThat(intMap.get(testIntOneKey)).contains(intOneOverride);
  }

  @Test
  void testPutAndGetSimpleKeys() {
    TypedMap<Number> numberMap = new TypedMap<>();
    Integer intOne = 1;
    Double doubleTwo = 2.0;

    assertThatNoException().isThrownBy(() -> numberMap.put(Integer.class, intOne));
    assertThatNoException().isThrownBy(() -> numberMap.put(Double.class, doubleTwo));

    assertThat(numberMap.get(Integer.class)).contains(intOne);
    assertThat(numberMap.get(Double.class)).contains(doubleTwo);
  }
}
