package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.utilities.bridge.database.connector.EntitySingleResultFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class NetworkDatabaseConnector extends DatabaseConnector {

  private static final String NET = "net";

  private static final Logger LOGGER = LoggerFactory.getLogger(NetworkDatabaseConnector.class);

  static final String NETWORK_ERROR = "Network by id exception";
  static final String NETWORK_IDS_ERROR = "Networks by ids exception";
  static final String NETWORK_MESSAGE = "network id %s";

  @Autowired
  public NetworkDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public Optional<NetworkDao> findNetwork(String net) {

    if (net == null || net.isEmpty()) {
      final var MESSAGE = "Request for Network was missing networkId input";
      LOGGER.debug(MESSAGE);
      return Optional.empty();
    } else {
      EntitySingleResultFunction<NetworkDao> delegateFunc =
          (EntityManager em) -> {
            var cb = em.getCriteriaBuilder();
            CriteriaQuery<NetworkDao> query = cb.createQuery(NetworkDao.class);
            Root<NetworkDao> fromNetwork = query.from(NetworkDao.class);

            query.select(fromNetwork);

            final Path<Object> channelId = fromNetwork.get(NET);
            query.where(cb.and(cb.equal(channelId, net)));
            return em.createQuery(query).getSingleResult();
          };

      return runWithEntityManagerSingleResultFunction(
          delegateFunc, NETWORK_ERROR, String.format(NETWORK_MESSAGE, net));
    }
  }

  public List<NetworkDao> findNetworks(Collection<String> nets) {

    if (nets.isEmpty()) {
      final var MESSAGE = "Request for Network was missing networkId input";
      LOGGER.debug(MESSAGE);
      return List.of();
    } else {
      return runPartitionedQuery(
          nets,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<NetworkDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<NetworkDao> query = cb.createQuery(NetworkDao.class);
                  Root<NetworkDao> fromNetwork = query.from(NetworkDao.class);
                  query.select(fromNetwork);
                  query.where(fromNetwork.get(NET).in(partition));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, NETWORK_IDS_ERROR, String.format("network ids size %s", nets.size()));
          });
    }
  }
}
