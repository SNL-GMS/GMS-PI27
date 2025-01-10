package gms.shared.spring.persistence;

import static java.util.stream.Collectors.toSet;

import jakarta.persistence.EntityManager;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Small Collection class for managing the mappings between Account names and EntityManagers.
 * Designed with Spring Bean creation and and Autowiring in mind.
 */
public class EntityManagersByAccount {

  private final Map<String, EntityManager> delegate;

  public EntityManagersByAccount(Map<String, EntityManager> delegate) {
    this.delegate = Map.copyOf(delegate);
  }

  public Optional<EntityManager> get(String account) {
    return Optional.ofNullable(delegate.get(account));
  }

  public Stream<String> accounts() {
    return getAccounts().stream();
  }

  public Set<String> getAccounts() {
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

  public boolean containsAccount(String account) {
    return delegate.containsKey(account);
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
