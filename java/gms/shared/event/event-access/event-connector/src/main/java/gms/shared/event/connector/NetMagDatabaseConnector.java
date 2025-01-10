package gms.shared.event.connector;

import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.OriginDao;
import jakarta.persistence.EntityManagerFactory;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link NetMagDao} from the database */
public class NetMagDatabaseConnector extends AbstractPooledConnector<NetMagDao> {

  private static final Logger LOGGER = LoggerFactory.getLogger(NetMagDatabaseConnector.class);
  private static final String MAG_ID = "magnitudeId";
  private static final String ORIGIN_ID = "originId";
  private static final Double NA_VALUE_LARGE = -999.0;
  private static final Long NA_VALUE_SMALL = -1L;

  public NetMagDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(NetMagDao.class, entityManagerFactory);
  }

  /**
   * Retrieves a list of {@link NetMagDao}s from the database with the specified orid
   *
   * @param orid to query NetMagDaos for
   * @return a list of associated NetMagDaos
   */
  public List<NetMagDao> findNetMagByOrid(long orid) {
    return queryForAll((cb, from) -> cb.equal(from.get(ORIGIN_ID), orid));
  }

  /**
   * Retrieves a map of MagnituteType to NetMagDao from the database given the OriginDao. Note
   * method only returns MagnitudeTypes of MB, ML, and MS
   *
   * @param originDao the orgianDao to use
   * @return Map of MagnituteType to NetMagDao
   */
  public Map<MagnitudeType, NetMagDao> findNetMagByOriginDao(OriginDao originDao) {

    var mbid = originDao.getBodyWaveMagId();
    var mb = originDao.getBodyWaveMag();
    var msid = originDao.getSurfaceWaveMagId();
    var ms = originDao.getSurfaceWaveMag();
    var mlid = originDao.getLocalMagId();
    var ml = originDao.getLocalMag();
    var orid = originDao.getOriginId();

    return Stream.of(
            validateAndRunQuery(MagnitudeType.MB, orid, mbid, mb),
            validateAndRunQuery(MagnitudeType.ML, orid, mlid, ml),
            validateAndRunQuery(MagnitudeType.MS, orid, msid, ms))
        .flatMap(Optional::stream)
        .collect(Collectors.toMap(Pair::getKey, Pair::getValue));
  }

  private Optional<Pair<MagnitudeType, NetMagDao>> validateAndRunQuery(
      MagnitudeType mType, long orid, long magId, double mag) {

    if (isValidId(magId, mType, orid) && isValidMagitude(mag, mType, orid)) {

      // Note on the findFirst(), this is assumed to be a single list due to
      // the MBID being used as a primary key on the NETMAG table
      var netMagOpt =
          queryForSingle(
              (cb, from) ->
                  cb.and(cb.equal(from.get(MAG_ID), magId), cb.equal(from.get(ORIGIN_ID), orid)));

      if (netMagOpt.isPresent()) {
        return Optional.of(Pair.of(mType, netMagOpt.get()));
      } else {
        LOGGER.debug(
            "Could not bridge {} because {} ID was not found " + "in the NetMag Table",
            mType,
            magId);
        return Optional.empty();
      }
    }

    return Optional.empty();
  }

  private static boolean isValidId(long id, MagnitudeType mType, long orid) {
    var isValid = id != NA_VALUE_SMALL;

    if (!isValid) {
      LOGGER.debug(
          "Could not bridge {} because {} ID value was null"
              + " (-1) in in the ORIGIN table for ORID {}",
          mType,
          id,
          orid);
    }

    return isValid;
  }

  private static boolean isValidMagitude(double m, MagnitudeType mType, long orid) {

    var isValid = BigDecimal.valueOf(m).intValue() != NA_VALUE_LARGE;

    if (!isValid) {
      LOGGER.debug(
          "Could not bridge {} because {} value was null"
              + " (-999) in in the ORIGIN table for ORID {}",
          mType,
          m,
          orid);
    }

    return isValid;
  }
}
