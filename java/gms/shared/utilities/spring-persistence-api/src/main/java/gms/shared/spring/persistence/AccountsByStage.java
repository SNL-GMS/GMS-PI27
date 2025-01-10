package gms.shared.spring.persistence;

import static java.util.stream.Collectors.toSet;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Small Collection class for managing the mappings between Stage names and EntityManagerFactories.
 * Designed with Spring Bean creation and and Autowiring in mind.
 */
public class AccountsByStage {

  private final Map<String, String> delegate;

  public AccountsByStage(Map<String, String> delegate) {
    this.delegate = Map.copyOf(delegate);
  }

  public Optional<String> get(String stage) {
    return Optional.ofNullable(delegate.get(stage));
  }

  public Stream<String> stages() {
    return getStages().stream();
  }

  public Set<String> getStages() {
    return delegate.keySet();
  }

  public Stream<String> accounts() {
    return getAccounts().stream();
  }

  public Set<String> getAccounts() {
    return delegate.values().stream().collect(toSet());
  }

  public Stream<Map.Entry<String, String>> entries() {
    return delegate.entrySet().stream();
  }

  public Set<Map.Entry<String, String>> entrySet() {
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
}
