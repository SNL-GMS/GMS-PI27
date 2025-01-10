package gms.shared.utilities.javautilities.objectmapper;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.FailsafeException;
import net.jodah.failsafe.RetryPolicy;
import oracle.jdbc.pool.OracleDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * DatabaseLivenessCheck class for validating if an Oracle database is ready to receive connections
 */
public final class OracleLivenessCheck implements DatabaseLivenessCheck {

  private static final int INVALID_LOGIN_ERROR_CODE = 1017;
  private static final int DELAY = 30;
  private static final int MAX_DELAY = 300;
  private static final int MAX_DURATION = 600;

  private static final Logger LOGGER = LoggerFactory.getLogger(OracleLivenessCheck.class);

  private OracleLivenessCheck() {
    // Hide implicit public constructor
  }

  public static OracleLivenessCheck create() {
    return new OracleLivenessCheck();
  }

  @Override
  public boolean isLive() {
    RetryPolicy<Boolean> retryPolicy =
        new RetryPolicy<Boolean>()
            .withBackoff(DELAY, MAX_DELAY, ChronoUnit.SECONDS)
            .withMaxDuration(Duration.ofSeconds(MAX_DURATION))
            .withMaxAttempts(-1)
            .handleResult(false)
            .onFailedAttempt(event -> LOGGER.info("Database is not ready, retrying"));

    try {
      Failsafe.with(retryPolicy).run(OracleLivenessCheck::checkConnection);
    } catch (FailsafeException ex) {
      LOGGER.info("Liveness check failed", ex);
      return false;
    }

    return true;
  }

  private static void checkConnection() throws LivenessException {
    Connection connection = null;
    try {
      var dataSource = new OracleDataSource();
      dataSource.setURL("jdbc:oracle:thin:@connection_check");
      // this is expected to throw an exception since we do not provide credentials.  The error
      // details are
      // used to determine the state of the database
      connection = dataSource.getConnection();
    } catch (SQLException ex) {
      int errorCode = ex.getErrorCode();
      // The invalid login error code indicates that the database expected (and didn't receive)
      // correct login
      // credentials. This indicates that
      // 1) the container is up (in a containerized scenario),
      // 2) the database server is up
      if (errorCode != INVALID_LOGIN_ERROR_CODE) {
        throw new LivenessException(ex);
      }
    } finally {
      if (connection != null) {
        try {
          connection.close();
        } catch (SQLException e) {
          LOGGER.error("Error closing connection", e);
        }
      }
    }
  }
}
