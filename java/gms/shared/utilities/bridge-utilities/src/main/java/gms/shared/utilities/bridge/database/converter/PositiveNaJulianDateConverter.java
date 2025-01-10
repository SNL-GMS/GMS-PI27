package gms.shared.utilities.bridge.database.converter;

import jakarta.persistence.Converter;
import java.time.Instant;

@Converter
public class PositiveNaJulianDateConverter extends JulianDateConverter {

  public static final int NA_VALUE = 2_286_324;

  protected Instant getDefaultValue() {
    return Instant.MAX;
  }

  protected int getNaValue() {
    return NA_VALUE;
  }
}
