package gms.shared.signaldetection.database.connector;

import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class AmplitudeDatabaseConnector extends DatabaseConnector {

  static final String AMPLITUDE_A52_KEY = "A5/2";
  static final String AMPLITUDE_A52OR_KEY = "A5/2-OR";
  static final String AMPLITUDE_ALR2_KEY = "ALR/2";
  static final String AMPLITUDE_SBSNR_KEY = "SBSNR";
  static final String ARRIVAL_ID = "arrivalId";
  static final String AMPLITUDE_TYPE = "amplitudeType";
  static final String ARIDS_MESSAGE = "arids size = %s";

  static final String AMPLITUDE_ARID_ERROR = "Amplitudes by arides exception";

  @Autowired
  public AmplitudeDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public List<AmplitudeDao> findAmplitudesByArids(Collection<Long> arids) {
    Objects.requireNonNull(arids, "Arids cannot be null");
    var errorMessage = String.format(ARIDS_MESSAGE, arids.size());

    if (arids.isEmpty()) {
      return List.of();
    } else {
      return runPartitionedQuery(
          arids,
          1000,
          (Collection<Long> partitionedArids) -> {
            EntityResultListFunction<AmplitudeDao> delegateFunction =
                entityManager -> createDelegateFunction(entityManager, partitionedArids);

            return runWithEntityManagerResultListFunction(
                delegateFunction, AMPLITUDE_ARID_ERROR, errorMessage);
          });
    }
  }

  private static List<AmplitudeDao> createDelegateFunction(
      EntityManager entityManager, Collection<Long> partitionedArids) {
    var cb = entityManager.getCriteriaBuilder();
    var query = cb.createQuery(AmplitudeDao.class);
    var fromAmplitude = query.from(AmplitudeDao.class);
    var aridPath = fromAmplitude.get(ARRIVAL_ID);
    var amplitudeTypePath = fromAmplitude.get(AMPLITUDE_TYPE);
    query
        .select(fromAmplitude)
        .where(
            cb.and(
                aridPath.in(partitionedArids),
                cb.or(
                    cb.equal(amplitudeTypePath, AMPLITUDE_A52_KEY),
                    cb.equal(amplitudeTypePath, AMPLITUDE_A52OR_KEY),
                    cb.equal(amplitudeTypePath, AMPLITUDE_ALR2_KEY),
                    cb.equal(amplitudeTypePath, AMPLITUDE_SBSNR_KEY))));

    return entityManager.createQuery(query).getResultList();
  }
}
