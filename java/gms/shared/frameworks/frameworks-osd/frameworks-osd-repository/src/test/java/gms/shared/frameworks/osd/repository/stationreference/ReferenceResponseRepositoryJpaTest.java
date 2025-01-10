package gms.shared.frameworks.osd.repository.stationreference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceResponse;
import gms.shared.frameworks.osd.repository.util.TestFixtures;
import jakarta.persistence.EntityManagerFactory;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class ReferenceResponseRepositoryJpaTest {

  private static ReferenceResponseRepositoryJpa referenceResponseRepositoryJpa;
  private static EntityManagerFactory entityManagerFactory;

  @BeforeAll
  static void testSuiteSetup() {
    referenceResponseRepositoryJpa = new ReferenceResponseRepositoryJpa(entityManagerFactory);

    // Load some initial objects.
    referenceResponseRepositoryJpa.storeReferenceResponses(TestFixtures.ALL_REFERENCE_RESPONSES);
  }

  @Test
  void testRetrieval() {
    List<String> channelNames =
        TestFixtures.ALL_REFERENCE_RESPONSES.stream()
            .map(ReferenceResponse::getChannelName)
            .collect(Collectors.toList());
    List<ReferenceResponse> responses =
        referenceResponseRepositoryJpa.retrieveReferenceResponses(channelNames);

    assertEquals(3, responses.size());
  }

  @Test
  void testStoreExistingResponse() {
    // Storing a channel that already exists should throw an exception
    assertThrows(
        DataExistsException.class,
        () -> {
          referenceResponseRepositoryJpa.storeReferenceResponses(
              TestFixtures.ALL_REFERENCE_RESPONSES);
        });
  }
}
