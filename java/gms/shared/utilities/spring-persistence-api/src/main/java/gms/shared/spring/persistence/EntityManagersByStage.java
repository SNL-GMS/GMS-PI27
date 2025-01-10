package gms.shared.spring.persistence;

import static java.util.stream.Collectors.toSet;

import jakarta.persistence.EntityManager;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Small Collection class for managing the mappings between Stage names and EntityManagers. Designed
 * with Spring Bean creation and and Autowiring in mind.
 */
public class EntityManagersByStage {

  private final Map<String, EntityManager> delegate;

  public EntityManagersByStage(Map<String, EntityManager> delegate) {
    this.delegate = Map.copyOf(delegate);
  }

  public Optional<EntityManager> get(String stage) {
    return Optional.ofNullable(delegate.get(stage));
  }

  public Stream<String> stages() {
    return getStages().stream();
  }

  public Set<String> getStages() {
    return delegate.keySet();
  }

  public Stream<EntityManager> entityManagers() {
    return getEntityManagers().stream();
  }

  public Set<EntityManager> getEntityManagers() {
    return delegate.values().stream().collect(toSet());
  }

  public Stream<Map.Entry<String, EntityManager>> entries() {
    return delegate.entrySet().stream();
  }

  public Set<Map.Entry<String, EntityManager>> entrySet() {
    return delegate.entrySet();
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
    entityManagers().forEach(EntityManager::close);
  }
}
