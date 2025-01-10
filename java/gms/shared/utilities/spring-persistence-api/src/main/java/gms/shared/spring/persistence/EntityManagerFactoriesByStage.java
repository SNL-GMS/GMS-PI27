package gms.shared.spring.persistence;

import static java.util.stream.Collectors.toMap;
import static java.util.stream.Collectors.toSet;

import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Small Collection class for managing the mappings between Stage names and EntityManagerFactories.
 * Designed with Spring Bean creation and and Autowiring in mind.
 */
public class EntityManagerFactoriesByStage {

  private final Map<String, EntityManagerFactory> delegate;

  public EntityManagerFactoriesByStage(Map<String, EntityManagerFactory> delegate) {
    this.delegate = Map.copyOf(delegate);
  }

  public Optional<EntityManagerFactory> get(String stage) {
    return Optional.ofNullable(delegate.get(stage));
  }

  public Stream<String> stages() {
    return getStages().stream();
  }

  public Set<String> getStages() {
    return delegate.keySet();
  }

  public Stream<EntityManagerFactory> entityManagerFactories() {
    return getEntityManagerFactories().stream();
  }

  public Set<EntityManagerFactory> getEntityManagerFactories() {
    return delegate.values().stream().collect(toSet());
  }

  public Stream<Map.Entry<String, EntityManagerFactory>> entries() {
    return delegate.entrySet().stream();
  }

  public Set<Map.Entry<String, EntityManagerFactory>> entrySet() {
    return delegate.entrySet();
  }

  public EntityManagersByStage createEntityManagers() {
    return new EntityManagersByStage(
        entries()
            .collect(toMap(Map.Entry::getKey, entry -> entry.getValue().createEntityManager())));
  }

  public boolean containsStage(String stage) {
    return delegate.containsKey(stage);
  }

  public int size() {
    return delegate.size();
  }

  public boolean isEmpty() {
    return delegate.isEmpty();
  }

  public void close() {
    entityManagerFactories().forEach(EntityManagerFactory::close);
  }
}
