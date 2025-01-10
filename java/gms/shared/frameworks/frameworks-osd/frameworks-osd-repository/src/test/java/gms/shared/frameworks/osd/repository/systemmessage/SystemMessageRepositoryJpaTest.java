package gms.shared.frameworks.osd.repository.systemmessage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import gms.shared.frameworks.osd.dao.systemmessage.SystemMessageDao;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class SystemMessageRepositoryJpaTest {

  private EntityManagerFactory entityManagerFactory;

  @Test
  void testStoreSystemMessagesValidation() {
    var sysMsgRepository = new SystemMessageRepositoryJpa(entityManagerFactory);
    assertThrows(NullPointerException.class, () -> sysMsgRepository.storeSystemMessages(null));
  }

  @Test
  void testStoreSystemMessages() {
    EntityManager entityManager = entityManagerFactory.createEntityManager();

    try {
      SystemMessageRepositoryJpa systemMessageRepositoryJpa =
          new SystemMessageRepositoryJpa(entityManagerFactory);

      systemMessageRepositoryJpa.storeSystemMessages(TestFixtures.msgs);

      for (SystemMessage msg : TestFixtures.msgs) {
        SystemMessageDao actual = entityManager.find(SystemMessageDao.class, msg.getId());
        assertNotNull(actual);

        SystemMessage expected = actual.toCoi();
        assertNotNull(expected);

        assertEquals(expected, actual.toCoi());
      }
    } finally {
      if (entityManager != null) {
        entityManager.close();
      }
    }
  }
}
