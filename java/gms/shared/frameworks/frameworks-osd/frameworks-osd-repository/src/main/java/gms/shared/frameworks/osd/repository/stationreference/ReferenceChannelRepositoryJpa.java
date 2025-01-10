package gms.shared.frameworks.osd.repository.stationreference;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.coi.exceptions.RepositoryException;
import gms.shared.frameworks.osd.api.stationreference.ReferenceChannelRepository;
import gms.shared.frameworks.osd.api.util.ReferenceChannelRequest;
import gms.shared.frameworks.osd.api.util.RepositoryExceptionUtils;
import gms.shared.frameworks.osd.coi.channel.ReferenceChannel;
import gms.shared.frameworks.osd.dao.channel.ReferenceChannelDao;
import gms.shared.frameworks.osd.repository.utils.RepositoryUtility;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReferenceChannelRepositoryJpa implements ReferenceChannelRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReferenceChannelRepositoryJpa.class);

  private EntityManagerFactory entityManagerFactory;

  private final RepositoryUtility<ReferenceChannel, ReferenceChannelDao> channelRepoUtility;

  public ReferenceChannelRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
    this.channelRepoUtility =
        RepositoryUtility.create(
            ReferenceChannelDao.class, ReferenceChannelDao::new, ReferenceChannelDao::toCoi);
  }

  @Override
  public List<ReferenceChannel> retrieveReferenceChannels(
      ReferenceChannelRequest referenceChannelRequest) {
    Objects.requireNonNull(referenceChannelRequest);
    LOGGER.info("Retrieving ReferenceChannels");

    var entityManager = entityManagerFactory.createEntityManager();
    var builder = entityManager.getCriteriaBuilder();
    CriteriaQuery<ReferenceChannelDao> referenceChannelQuery =
        builder.createQuery(ReferenceChannelDao.class);
    Root<ReferenceChannelDao> fromReferenceChannel =
        referenceChannelQuery.from(ReferenceChannelDao.class);
    referenceChannelQuery.select(fromReferenceChannel);

    List<Predicate> disjunctions = new ArrayList<>();
    if (referenceChannelRequest.getChannelNames().isPresent()
        && !referenceChannelRequest.getChannelNames().get().isEmpty()) {
      disjunctions.add(
          fromReferenceChannel.get("name").in(referenceChannelRequest.getChannelNames().get()));
    }
    if (referenceChannelRequest.getEntityIds().isPresent()
        && !referenceChannelRequest.getEntityIds().get().isEmpty()) {
      disjunctions.add(
          fromReferenceChannel.get("entityId").in(referenceChannelRequest.getEntityIds().get()));
    }
    if (referenceChannelRequest.getVersionIds().isPresent()
        && !referenceChannelRequest.getVersionIds().get().isEmpty()) {
      disjunctions.add(
          fromReferenceChannel.get("versionId").in(referenceChannelRequest.getVersionIds().get()));
    }

    if (!disjunctions.isEmpty()) {
      referenceChannelQuery.where(builder.or(disjunctions.stream().toArray(Predicate[]::new)));
    }
    referenceChannelQuery.orderBy(
        builder.asc(fromReferenceChannel.get("name")),
        builder.asc(fromReferenceChannel.get("actualTime")),
        builder.asc(fromReferenceChannel.get("systemTime")));
    try {
      return entityManager
          .createQuery(referenceChannelQuery)
          .getResultStream()
          .map(ReferenceChannelDao::toCoi)
          .toList();
    } catch (Exception e) {
      throw RepositoryExceptionUtils.wrapWithContext("Error retrieving ReferenceChannels: ", e);
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeReferenceChannels(Collection<ReferenceChannel> channels) {
    Objects.requireNonNull(channels);
    LOGGER.info("Storing ReferenceChannels");

    var entityManager = entityManagerFactory.createEntityManager();

    try {
      for (ReferenceChannel channel : channels) {
        if (channelExists(entityManager, channel)) {
          throw new DataExistsException("Attempt to store channel, already present: " + channel);
        }
      }
      this.channelRepoUtility.persist(channels, entityManager);
    } catch (RepositoryException e) {
      throw RepositoryExceptionUtils.wrapWithContext("Error storing ReferenceChannels: ", e);
    } finally {
      entityManager.close();
    }
  }

  private static boolean channelExists(EntityManager em, ReferenceChannel chan) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<ReferenceChannelDao> channelQuery = cb.createQuery(ReferenceChannelDao.class);
    Root<ReferenceChannelDao> fromChannel = channelQuery.from(ReferenceChannelDao.class);
    // TODO: Is a version id check sufficient for checking for channel existence?
    channelQuery
        .select(fromChannel)
        .where(cb.equal(fromChannel.get("versionId"), chan.getVersionId()));

    // If the returned result list is not empty, the channel exists
    return !em.createQuery(channelQuery).getResultList().isEmpty();
  }
}
