package gms.shared.signaldetection.repository.utils;

import com.google.auto.value.AutoValue;
import java.util.Comparator;

@AutoValue
public abstract class AccountValue<T extends Comparable<T>> implements Comparable<AccountValue<T>> {

  public abstract String getAccount();

  public abstract T getValue();

  public static <T extends Comparable<T>> AccountValue<T> create(
      String legacyDatabaseAccountId, T value) {
    return new AutoValue_AccountValue<>(legacyDatabaseAccountId, value);
  }

  @Override
  public int compareTo(AccountValue<T> accountValue) {
    return Comparator.<AccountValue<T>, String>comparing(AccountValue::getAccount)
        .thenComparing(AccountValue::getValue)
        .compare(this, accountValue);
  }
}
