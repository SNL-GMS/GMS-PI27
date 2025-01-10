package gms.shared.spring.utilities.framework;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class AliveCheckTest {

  @Test
  void testAliveJSONValid() {
    var instantStr = Instant.now().toString();
    var aliveBuilder = AliveCheck.builder().setAliveAt(instantStr);
    assertEquals(instantStr, aliveBuilder.build().getAliveAt());
  }

  @Test
  void testAliveJSONNull() {
    var aliveCheckBuilder = AliveCheck.builder();
    assertThrows(NullPointerException.class, () -> aliveCheckBuilder.setAliveAt(null));
  }

  @Test
  void testAliveJSONEmptyString() {
    var aliveBuilder = AliveCheck.builder().setAliveAt("");
    assertThrows(IllegalStateException.class, aliveBuilder::build);
  }

  @Test
  void testAliveJSONWhitespaceString() {
    var aliveBuilder = AliveCheck.builder().setAliveAt("         ");
    assertThrows(IllegalStateException.class, aliveBuilder::build);
  }

  @Test
  void testAliveJSONMissingProperties() {
    assertThrows(IllegalStateException.class, AliveCheck.builder()::autobuild);
  }
}
