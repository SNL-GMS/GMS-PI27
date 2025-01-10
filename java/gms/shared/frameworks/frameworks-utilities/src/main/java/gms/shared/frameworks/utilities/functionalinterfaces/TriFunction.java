package gms.shared.frameworks.utilities.functionalinterfaces;

@FunctionalInterface
public interface TriFunction<T, U, V, R> {

  R apply(T t, U u, V v);
}
