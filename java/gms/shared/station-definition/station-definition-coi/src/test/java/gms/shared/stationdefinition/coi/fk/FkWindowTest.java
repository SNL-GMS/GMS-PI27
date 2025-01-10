package gms.shared.stationdefinition.coi.fk;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class FkWindowTest {

  private static Duration durationOfOneDay;
  private static Duration durationOfNegativeDay;

  @BeforeAll
  static void init() {
    durationOfOneDay = Duration.ofDays(1);
    durationOfNegativeDay = Duration.ofDays(-1);
  }

  @Test
  void testDuration() {

    assertThrows(
        IllegalArgumentException.class, () -> new FkWindow(Duration.ZERO, durationOfOneDay));

    assertThrows(
        IllegalArgumentException.class,
        () -> new FkWindow(durationOfNegativeDay, durationOfOneDay));
  }

  @Test
  void testLead() {
    var durationOfOneDay = Duration.ofDays(1);
    assertThrows(
        IllegalArgumentException.class,
        () -> new FkWindow(durationOfOneDay, durationOfNegativeDay));
  }
}
