package gms.shared.utilities.bridge.database.connector;

import com.google.common.collect.Lists;
import gms.shared.utilities.bridge.database.enums.EntityErrorMessage;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.NoResultException;
import jakarta.persistence.NonUniqueResultException;
import jakarta.persistence.PersistenceException;
import jakarta.persistence.QueryTimeoutException;
import jakarta.persistence.RollbackException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.Fallback;
import net.jodah.failsafe.RetryPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Persistence database connector which issues queries to the entity manager */
public abstract class DatabaseConnector {

  private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseConnector.class);

  static final ChronoUnit RETRY_DELAY_UNITS = ChronoUnit.SECONDS;
  static final long RETRY_INITIAL_DELAY = 1L;
  static final long RETRY_MAX_DELAY = 10L;
  static final int MAX_RETRY_ATTEMPTS = 3;

  private static final String RETRYING_MESSAGE = "Retrying...";
  private static final String EMPTY_RESULT_MESSAGE = "Returning empty result.";
  private static final String EMPTY_LIST_MESSAGE = "Returning empty list.";

  private final EntityManagerFactory entityManagerFactory;

  protected DatabaseConnector(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Entity manager run method which takes in {@link EntitySingleResultFunction} and returns a given
   * object of type <T>
   *
   * @param <T> - returned object type
   * @param entityManagerFunction - entity manager result function
   * @param queryErrorMessage - entity query failure message
   * @param errorMessageArgs - query error message arguments
   * @return optional of object of type <T>
   */
  protected <T> Optional<T> runWithEntityManagerSingleResultFunction(
      EntitySingleResultFunction<T> entityManagerFunction,
      String queryErrorMessage,
      String errorMessageArgs) {

    // create the retry policy used for re-creating the entity manager on failure
    var retryPolicy = createRetryPolicy(queryErrorMessage, errorMessageArgs);

    // fallback for returning empty when we can't recover
    Fallback<Object> fallback = Fallback.of(Optional.empty());

    // run entity manager function with retry policy
    return Failsafe.with(fallback, retryPolicy)
        .get(
            () -> {
              var entityManager = entityManagerFactory.createEntityManager();

              try {
                return Optional.of(entityManagerFunction.apply(entityManager));
              } catch (IllegalStateException | PersistenceException e) {
                // filter non-recoverable exceptions from recoverable
                if (e instanceof NoResultException
                    || e instanceof NonUniqueResultException
                    || e instanceof QueryTimeoutException
                    || e instanceof IllegalStateException) {
                  // handle entity manager error and return empty
                  handleEntityManagerErrors(
                      e, queryErrorMessage, errorMessageArgs, EMPTY_RESULT_MESSAGE);
                  return Optional.empty();
                } else {
                  // wrap recoverable exception and send to retry policy
                  throw new DatabaseConnectorException(queryErrorMessage, e);
                }
              } finally {
                entityManager.close();
              }
            });
  }

  /**
   * Entity manager run method which takes in {@link EntityResultListFunction} and returns a list of
   * given objects of type <T>
   *
   * @param <T> - returned object type
   * @param entityManagerFunction - entity manager result list function
   * @param queryErrorMessage - entity query failure message
   * @param errorMessageArgs - query error message arguments
   * @return list of objects of type <T>
   */
  protected <T> List<T> runWithEntityManagerResultListFunction(
      EntityResultListFunction<T> entityManagerFunction,
      String queryErrorMessage,
      String errorMessageArgs) {

    // create the retry policy used for re-creating the entity manager on failure
    var retryPolicy = createRetryPolicy(queryErrorMessage, errorMessageArgs);

    // fallback for returning empty when we can't recover
    Fallback<Object> fallback = Fallback.of(List.of());

    return Failsafe.with(fallback, retryPolicy)
        .get(
            () -> {
              var entityManager = entityManagerFactory.createEntityManager();

              try {
                return entityManagerFunction.apply(entityManager);
              } catch (IllegalStateException | PersistenceException e) {
                // filter non-recoverable exceptions from recoverable
                if (e instanceof QueryTimeoutException || e instanceof IllegalStateException) {
                  // handle entity manager error and return empty list
                  handleEntityManagerErrors(
                      e, queryErrorMessage, errorMessageArgs, EMPTY_LIST_MESSAGE);
                  return List.of();
                } else {
                  // wrap recoverable exception and send to retry policy
                  throw new DatabaseConnectorException(queryErrorMessage, e);
                }
              } finally {
                entityManager.close();
              }
            });
  }

  /**
   * Entity manager run method which takes in (@link EntityVoidFunction} and commits the transaction
   * without returning
   *
   * @param entityManagerFunction - entity manager void function
   * @param errorMessage - error message string
   */
  protected void runWithEntityManagerVoidFunction(
      EntityVoidFunction entityManagerFunction, String errorMessage) {

    // create the retry policy with entity manager transaction rollback
    var retryPolicy = createVoidRetryPolicy();
    Fallback<Object> fallback = Fallback.of(Optional.empty());

    // run entity manager function with rollback retry policy
    Failsafe.with(fallback, retryPolicy)
        .run(
            () -> {
              var entityManager = entityManagerFactory.createEntityManager();
              try {
                entityManagerFunction.apply(entityManager);
              } catch (NullPointerException | IllegalStateException | PersistenceException e) {
                // caught by retry
                if (e instanceof NullPointerException
                    || e instanceof IllegalStateException
                    || e instanceof RollbackException) {
                  LOGGER.warn(
                      "Unrecoverable exception for {} Rolling back transaction...", errorMessage);
                  entityManager.getTransaction().rollback();
                } else {
                  throw new DatabaseConnectorException(errorMessage, e);
                }
              } finally {
                entityManager.close();
              }
            });
  }

  /**
   * Breaks the query into partitionSize batches and makes individual Oracle queries for each
   * partition
   *
   * @param <P> input object type
   * @param <T> output object type
   * @param queryParams - query params to partition
   * @param partitionSize - number of params in each partition
   * @param partitionQueryFunction - function to query for each partition
   * @return list of DAOs
   */
  protected <P, T> List<T> runPartitionedQuery(
      Collection<P> queryParams,
      int partitionSize,
      Function<Collection<P>, List<T>> partitionQueryFunction) {
    return Lists.partition(new ArrayList<>(queryParams), partitionSize).stream()
        .map(partitionQueryFunction)
        .flatMap(Collection::stream)
        // deployments fail when this is channged to Stream.toList()
        .collect(Collectors.toList());
  }

  /** Create RetryPolicy with transaction rollback for failed commits */
  private static RetryPolicy<Object> createVoidRetryPolicy() {

    return new RetryPolicy<>()
        .withBackoff(RETRY_INITIAL_DELAY, RETRY_MAX_DELAY, RETRY_DELAY_UNITS)
        .withMaxAttempts(MAX_RETRY_ATTEMPTS)
        .handle(DatabaseConnectorException.class)
        .onFailedAttempt(
            e ->
                LOGGER.warn(
                    "Entity manager query failed with " + "error - {}. " + RETRYING_MESSAGE,
                    e.getLastFailure().getMessage()))
        .onRetry(
            e ->
                LOGGER.warn(
                    "Entity manager query failed attempt #{}. " + RETRYING_MESSAGE,
                    e.getAttemptCount()))
        .onRetriesExceeded(
            e -> LOGGER.error("Entity manager query max retries exceeded", e.getFailure()));
  }

  /**
   * Create the RetryPolicy used for re-creating failed entity managers
   *
   * @param queryErrorMessage entity query error message
   * @param errorMessageArgs message arguments for the failed query
   */
  private static RetryPolicy<Object> createRetryPolicy(
      String queryErrorMessage, String errorMessageArgs) {

    // connection closed/interrupted for handles
    return new RetryPolicy<>()
        .withBackoff(RETRY_INITIAL_DELAY, RETRY_MAX_DELAY, RETRY_DELAY_UNITS)
        .withMaxAttempts(MAX_RETRY_ATTEMPTS)
        .handle(DatabaseConnectorException.class)
        .onFailedAttempt(
            e ->
                handleEntityManagerErrors(
                    e.getLastFailure(), queryErrorMessage, errorMessageArgs, RETRYING_MESSAGE))
        .onRetry(
            e ->
                LOGGER.warn(
                    "Entity manager query failed attempt #{}. " + RETRYING_MESSAGE,
                    e.getAttemptCount()))
        .onRetriesExceeded(
            e -> LOGGER.error("Entity manager query max retries exceeded.", e.getFailure()));
  }

  /**
   * Handle entity manager errors by finding the failure type and constructing a message
   *
   * @param e - throwable error
   * @param queryErrorMessage - main query error message
   * @param errorMessageArgs - query error message arguments
   * @param endMessage - end message for the user
   */
  private static void handleEntityManagerErrors(
      Throwable e, String queryErrorMessage, String errorMessageArgs, String endMessage) {
    // get the error message for the given exception type
    var entityErrorMessage = EntityErrorMessage.get(e.getClass().getSimpleName());
    var mainErrorMessage = e.getMessage();
    String errorTypeMessage =
        entityErrorMessage.getMessage(queryErrorMessage, errorMessageArgs, mainErrorMessage);
    var errorMessage = "Entity manager query failed with " + "error - {}. " + endMessage;
    LOGGER.warn(errorMessage, errorTypeMessage);
  }
}
