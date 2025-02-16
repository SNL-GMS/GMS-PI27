package gms.shared.frameworks.osd.coi.provenance;

import java.time.Instant;

/** Defines testing objects */
public class ProvenanceTestFixtures {
  // InformationSource
  public static final InformationSource informationSource =
      InformationSource.from("Source", Instant.now(), "Unit Test");

  private ProvenanceTestFixtures() {
    // Hide implicit public constructor since this is a utility class
  }
}
