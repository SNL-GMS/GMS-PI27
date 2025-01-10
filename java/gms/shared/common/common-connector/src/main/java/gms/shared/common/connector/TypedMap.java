package gms.shared.common.connector;

import static com.google.common.base.Preconditions.checkArgument;

import java.util.HashMap;
import java.util.Optional;

/**
 * Generic map class used to manage values of varying subtypes, able to successfully store and
 * retrieve these subtypes while being type safe based on the provided key.
 *
 * <p>Also provides convenience put and get methods when you are only storing one value for any
 * given type. Here it uses the type's canonical name as part of the key rather than a custom name
 * from a user-generated key.
 *
 * @param <V> Base type of the values stored in this map.
 */
public class TypedMap<V> {

  private final HashMap<Key<? extends V>, V> delegate;

  public TypedMap() {
    this.delegate = new HashMap<>();
  }

  public <T extends V> void put(Class<T> type, T value) {
    put(toKey(type), value);
  }

  public <T extends V> void put(Key<T> key, T value) {
    checkArgument(
        key.type().isAssignableFrom(value.getClass()),
        "Mismatch in class types. %s is not assignable from %s",
        key.type(),
        value.getClass());
    delegate.put(key, value);
  }

  public <T extends V> Optional<T> get(Class<T> type) {
    return get(toKey(type));
  }

  public <T extends V> Optional<T> get(Key<T> key) {
    return Optional.ofNullable(key.type().cast(delegate.get(key)));
  }

  private static <T> TypedMap.Key<T> toKey(Class<T> type) {
    return new TypedMap.Key<>(type.getCanonicalName(), type);
  }

  public static record Key<V>(String name, Class<V> type) implements Comparable<Key<?>> {

    @Override
    public String toString() {
      return String.format("%s(%s)", name, type.getSimpleName());
    }

    @Override
    public int compareTo(Key<?> o) {
      int nameComparison = name.compareTo(o.name());
      return nameComparison != 0
          ? nameComparison
          : type.getCanonicalName().compareTo(o.type().getCanonicalName());
    }
  }
}
