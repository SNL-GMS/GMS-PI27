package gms.shared.user.preferences.repository;

import static gms.shared.user.preferences.testfixtures.UserPreferencesTestFixtures.USER_PREFERENCES_AUDIBLE_DEFAULT;
import static gms.shared.user.preferences.testfixtures.UserPreferencesTestFixtures.USER_PREFERENCES_AUDIBLE_TWO;
import static gms.shared.user.preferences.testfixtures.UserPreferencesTestFixtures.USER_PREFERENCES_AUDIBLE_UPDATE;
import static gms.shared.user.preferences.testfixtures.UserPreferencesTestFixtures.USER_PREFERENCES_DEFAULT;
import static gms.shared.user.preferences.testfixtures.UserPreferencesTestFixtures.USER_PREFERENCES_JSON;
import static gms.shared.user.preferences.testfixtures.UserPreferencesTestFixtures.USER_PREFERENCES_TWO;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.user.preferences.coi.UserPreferences;
import gms.shared.user.preferences.dao.UserPreferencesDao;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.io.IOException;
import java.util.Optional;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class UserPreferencesRepositoryJpaTest {

  private EntityManagerFactory entityManagerFactory;

  @Test
  void testSetUserPreferences() {

    UserPreferencesRepositoryJpa userPreferencesRepository =
        new UserPreferencesRepositoryJpa(entityManagerFactory);
    userPreferencesRepository.setUserPreferences(USER_PREFERENCES_DEFAULT);

    EntityManager entityManager = entityManagerFactory.createEntityManager();
    UserPreferencesDao userPreferencesDao =
        entityManager.find(UserPreferencesDao.class, USER_PREFERENCES_DEFAULT.getUserId());

    assertNotNull(userPreferencesDao);
    assertEquals(USER_PREFERENCES_DEFAULT, userPreferencesDao.toCoi());
    entityManager.close();
  }

  @Test
  void testGetUserPreferencesByUserId() {

    UserPreferencesRepositoryJpa userPreferencesRepository =
        new UserPreferencesRepositoryJpa(entityManagerFactory);
    userPreferencesRepository.setUserPreferences(USER_PREFERENCES_TWO);

    Optional<UserPreferences> actual =
        userPreferencesRepository.getUserPreferencesByUserId(USER_PREFERENCES_TWO.getUserId());
    assertTrue(actual.isPresent());
    assertEquals(USER_PREFERENCES_TWO, actual.get());
  }

  @Test
  void testSetUserPreferencesWithNotifications() {

    UserPreferencesRepositoryJpa userPreferencesRepository =
        new UserPreferencesRepositoryJpa(entityManagerFactory);
    userPreferencesRepository.setUserPreferences(USER_PREFERENCES_AUDIBLE_DEFAULT);

    EntityManager entityManager = entityManagerFactory.createEntityManager();
    UserPreferencesDao userPreferencesDao =
        entityManager.find(UserPreferencesDao.class, USER_PREFERENCES_AUDIBLE_DEFAULT.getUserId());

    assertNotNull(userPreferencesDao);
    assertEquals(USER_PREFERENCES_AUDIBLE_DEFAULT, userPreferencesDao.toCoi());
    entityManager.close();
  }

  @Test
  void testSetUserPreferencesUpdateNotifications() {

    UserPreferencesRepositoryJpa userPreferencesRepository =
        new UserPreferencesRepositoryJpa(entityManagerFactory);
    userPreferencesRepository.setUserPreferences(USER_PREFERENCES_AUDIBLE_DEFAULT);
    userPreferencesRepository.setUserPreferences(USER_PREFERENCES_AUDIBLE_UPDATE);

    EntityManager entityManager = entityManagerFactory.createEntityManager();
    UserPreferencesDao userPreferencesDao =
        entityManager.find(UserPreferencesDao.class, USER_PREFERENCES_AUDIBLE_DEFAULT.getUserId());
    assertNotNull(userPreferencesDao);
    assertEquals(USER_PREFERENCES_AUDIBLE_UPDATE, userPreferencesDao.toCoi());
    entityManager.close();
  }

  @Test
  void testGetUserPreferencesByUserIdWithNotifications() {

    UserPreferencesRepositoryJpa userPreferencesRepository =
        new UserPreferencesRepositoryJpa(entityManagerFactory);
    userPreferencesRepository.setUserPreferences(USER_PREFERENCES_AUDIBLE_TWO);

    Optional<UserPreferences> actual =
        userPreferencesRepository.getUserPreferencesByUserId(
            USER_PREFERENCES_AUDIBLE_TWO.getUserId());
    assertTrue(actual.isPresent());
    assertEquals(USER_PREFERENCES_AUDIBLE_TWO, actual.get());
  }

  @Test
  void testUpdate() throws IOException {

    ObjectReader objectReader = ObjectMappers.jsonReader();
    UserPreferences preferences =
        objectReader.readValue(USER_PREFERENCES_JSON, UserPreferences.class);

    UserPreferencesRepositoryJpa userPreferencesRepository =
        new UserPreferencesRepositoryJpa(entityManagerFactory);
    assertDoesNotThrow(() -> userPreferencesRepository.setUserPreferences(preferences));
  }
}
