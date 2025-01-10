package gms.shared.spring.utilities.framework;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class GmsFrameworksConfigurationTest {

  @Test
  void testGmsApplicationNamerParser() {

    final String DEFAULT = "GMS Default Service Name API";
    final String WAVEFORM_NAME = "GMS Waveform Manager API";

    String name = GmsFrameworksConfiguration.gmsApplicationNameParser("");
    assertEquals(DEFAULT, name);
    name = GmsFrameworksConfiguration.gmsApplicationNameParser(null);
    assertEquals(DEFAULT, name);
    name = GmsFrameworksConfiguration.gmsApplicationNameParser("waveform-manager");
    assertEquals(WAVEFORM_NAME, name);
  }
}
