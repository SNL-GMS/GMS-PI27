package gms.shared.fk.plugin.algorithms.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.common.coi.types.PhaseType;
import java.io.IOException;
import org.junit.jupiter.api.Test;

class MediumVelocitiesTest {
  private final String mediumVelocitiesEarthModelName = "ak135";
  private final double expectedMediumVelocityP = 10.0;
  private final double expectedMediumVelocityS = 3.46;

  @Test
  void testMediumVelocitiesInitialize() throws IOException {

    MediumVelocities m = new MediumVelocities();
    m.initialize(mediumVelocitiesEarthModelName);

    assertEquals(expectedMediumVelocityP, m.getMediumVelocity(PhaseType.P), 0.0);
    assertEquals(expectedMediumVelocityS, m.getMediumVelocity(PhaseType.S), 0.0);
  }

  @Test
  void testMediumVelocitiesInitializeNullModelNameThrowsNullPointerException() throws IOException {
    MediumVelocities m = new MediumVelocities();
    NullPointerException ex = assertThrows(NullPointerException.class, () -> m.initialize(null));
    assertEquals(
        "modelName parameter cannot be null for MediumVelocities::initialize()", ex.getMessage());
  }

  @Test
  void testMediumVelocitiesGetMediumVelocityNullPhaseTypeThrowsNullPointerException()
      throws IOException {
    MediumVelocities m = new MediumVelocities();
    m.initialize(mediumVelocitiesEarthModelName);

    NullPointerException ex =
        assertThrows(NullPointerException.class, () -> m.getMediumVelocity(null));
    assertEquals(
        "PhaseType parameter cannot be null in MediumVelocities::getMediumVelocity()",
        ex.getMessage());
  }

  @Test
  void testMediumVelocitiesGetMediumVelocityInvalidPhaseTypeThrowsNullPointerException()
      throws IOException {
    MediumVelocities m = new MediumVelocities();
    m.initialize(mediumVelocitiesEarthModelName);

    var ex = assertThrows(IllegalArgumentException.class, () -> m.getMediumVelocity(PhaseType.I));
    assertEquals(
        "Provided phase type \"I\" cannot be mapped into PhaseType \"P\" or \"S\"",
        ex.getMessage());
  }

  @Test
  void testMediumVelocitiesGetMediumVelocityMapPhaseTypeIntoP()
      throws IllegalArgumentException, IOException {
    PhaseType p = PhaseType.PcP;

    MediumVelocities m = new MediumVelocities();
    m.initialize(mediumVelocitiesEarthModelName);

    Double mediumVelocity = m.getMediumVelocity(p);
    assertEquals(mediumVelocity, expectedMediumVelocityP, 0.0);
  }

  @Test
  void testMediumVelocitiesGetMediumVelocityMapPhaseTypeIntoS()
      throws IllegalArgumentException, IOException {
    PhaseType p = PhaseType.PcS;

    MediumVelocities m = new MediumVelocities();
    m.initialize(mediumVelocitiesEarthModelName);

    Double mediumVelocity = m.getMediumVelocity(p);
    assertEquals(mediumVelocity, expectedMediumVelocityS, 0.0);
  }
}
