package gms.shared.utilities.bridge.database.converter;

import jakarta.persistence.Converter;
import java.time.Instant;

@Converter
public class NegativeNaJulianDateConverter extends JulianDateConverter {

  public static final int NA_VALUE = -1;

  protected Instant getDefaultValue() {
    return Instant.MIN;
  }

  protected int getNaValue() {
    return NA_VALUE;
  }
}
