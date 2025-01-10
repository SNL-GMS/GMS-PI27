package gms.testtools.simulators.bridgeddatasourcesimulator.application.factory;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class BridgedEntityManagerFactoryProviderTest {

  @Test
  void testInitializeDefault() {
    BridgedEntityManagerFactoryProvider entityManagerFactoryProvider =
        assertDoesNotThrow(BridgedEntityManagerFactoryProvider::new);
    assertNotNull(entityManagerFactoryProvider);
  }
}
