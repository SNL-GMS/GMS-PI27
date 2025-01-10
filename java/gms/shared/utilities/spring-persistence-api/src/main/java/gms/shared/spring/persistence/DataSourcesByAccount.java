package gms.shared.spring.persistence;

import static java.util.stream.Collectors.toSet;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import javax.sql.DataSource;

/**
 * Small Collection class for managing the mappings between Account names and DataSources. Designed
 * with Spring Bean creation and and Autowiring in mind.
 */
public class DataSourcesByAccount {

  private final Map<String, DataSource> delegate;

  public DataSourcesByAccount(Map<String, DataSource> delegate) {
    this.delegate = Map.copyOf(delegate);
  }

  public Optional<DataSource> get(String account) {
    return Optional.ofNullable(delegate.get(account));
  }

  public Stream<String> accounts() {
    return getAccounts().stream();
  }

  public Set<String> getAccounts() {
    return delegate.keySet();
  }

  public Stream<DataSource> dataSources() {
    return getDataSources().stream();
  }

  public Set<DataSource> getDataSources() {
    return delegate.values().stream().collect(toSet());
  }

  public Stream<Map.Entry<String, DataSource>> entries() {
    return delegate.entrySet().stream();
  }

  public Set<Map.Entry<String, DataSource>> entrySet() {
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
}
