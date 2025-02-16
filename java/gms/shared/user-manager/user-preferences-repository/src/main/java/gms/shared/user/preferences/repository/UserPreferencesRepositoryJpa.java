package gms.shared.user.preferences.repository;

import gms.shared.frameworks.coi.exceptions.RepositoryException;
import gms.shared.metrics.CustomMetric;
import gms.shared.user.preferences.api.UserPreferencesRepository;
import gms.shared.user.preferences.coi.UserPreferences;
import gms.shared.user.preferences.dao.AudibleNotificationDao;
import gms.shared.user.preferences.dao.UserPreferencesDao;
import gms.shared.user.preferences.dao.WorkspaceLayoutDao;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import jakarta.persistence.EntityManagerFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserPreferencesRepositoryJpa implements UserPreferencesRepository {

  private static final CustomMetric<UserPreferencesRepositoryJpa, Long>
      userPreferencesRepositoryGetUserPreferencesByUserId =
          CustomMetric.create(
              CustomMetric::incrementer,
              "userPreferencesRepositoryGetUserPreferencesByUserId_hits:type=Counter",
              0L);

  private static final CustomMetric<UserPreferencesRepositoryJpa, Long>
      userPreferencesRepositorySetUserPreferences =
          CustomMetric.create(
              CustomMetric::incrementer,
              "userPreferencesRepositorySetUserPreferences_hits:type=Counter",
              0L);

  private static final CustomMetric<Long, Long>
      userPreferencesRepositoryGetUserPreferencesByUserIdDuration =
          CustomMetric.create(
              CustomMetric::updateTimingData,
              "userPreferencesRepositoryGetUserPreferencesByUserId_duration:type=Value",
              0L);

  private static final CustomMetric<Long, Long>
      userPreferencesRepositorySetUserPreferencesDuration =
          CustomMetric.create(
              CustomMetric::updateTimingData,
              "userPreferencesRepositorySetUserPreferences_duration:type=Value",
              0L);

  private final EntityManagerFactory entityManagerFactory;
  private static final Logger logger = LoggerFactory.getLogger(UserPreferencesRepositoryJpa.class);

  @Autowired
  public UserPreferencesRepositoryJpa(@Autowired EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
  }

  @Override
  public Optional<UserPreferences> getUserPreferencesByUserId(String userId) {
    Objects.requireNonNull(userId, "Cannot retrieve user preference for null user");
    Validate.isTrue(!userId.isEmpty(), "Cannot retrieve user preference for undefined user");
    var entityManager = entityManagerFactory.createEntityManager();

    userPreferencesRepositoryGetUserPreferencesByUserId.updateMetric(this);
    var start = Instant.now();

    try {
      logger.error("Looking for user profile with id: {}", userId);
      UserPreferencesDao userPreferencesDao = entityManager.find(UserPreferencesDao.class, userId);
      return userPreferencesDao == null
          ? Optional.empty()
          : Optional.of(userPreferencesDao.toCoi());
    } finally {
      entityManager.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      userPreferencesRepositoryGetUserPreferencesByUserIdDuration.updateMetric(timeElapsed);
    }
  }

  @Override
  public void setUserPreferences(UserPreferences userPreferences) {
    Objects.requireNonNull(userPreferences, "Cannot store a null user preferences");
    var entityManager = entityManagerFactory.createEntityManager();

    userPreferencesRepositorySetUserPreferences.updateMetric(this);
    var start = Instant.now();

    try {
      entityManager.getTransaction().begin();
      UserPreferencesDao dao =
          entityManager.find(UserPreferencesDao.class, userPreferences.getUserId());
      if (dao != null) {
        dao.setDefaultAnalystLayoutName(userPreferences.getDefaultAnalystLayoutName());
        dao.getWorkspaceLayouts().clear();
        dao.getWorkspaceLayouts()
            .addAll(
                userPreferences.getWorkspaceLayouts().stream()
                    .map(WorkspaceLayoutDao::new)
                    .map(
                        (WorkspaceLayoutDao wlDao) -> {
                          wlDao.setUserPreferences(dao);
                          return wlDao;
                        })
                    .toList());
        dao.getAudibleNotifications().clear();
        dao.getAudibleNotifications()
            .addAll(
                userPreferences.getAudibleNotifications().stream()
                    .map(AudibleNotificationDao::new)
                    .map(
                        (AudibleNotificationDao anDao) -> {
                          anDao.setUserPreferences(dao);
                          return anDao;
                        })
                    .toList());
        dao.setPreferences(
            ObjectMappers.jsonMapper().valueToTree(userPreferences.getPreferences()));
      } else {
        entityManager.persist(new UserPreferencesDao(userPreferences));
      }
      entityManager.getTransaction().commit();
    } catch (RepositoryException e) {
      entityManager.getTransaction().rollback();
      throw new RepositoryException("Error storing user preferences: " + e);
    } finally {
      entityManager.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      userPreferencesRepositorySetUserPreferencesDuration.updateMetric(timeElapsed);
    }
  }
}
