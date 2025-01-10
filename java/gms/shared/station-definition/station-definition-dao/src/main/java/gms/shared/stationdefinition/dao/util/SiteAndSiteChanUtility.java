package gms.shared.stationdefinition.dao.util;

import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/** Site and SiteChan utility for adjusting DAO properties */
public final class SiteAndSiteChanUtility {

  private SiteAndSiteChanUtility() {
    // Hide implicit public constructor
  }

  /**
   * Update whether the start or end of a series of sites for a specific sta have overlaps and
   * return the sites as a list
   *
   * @param siteAndSurroundingDates {@link SiteAndSurroundingDates}
   * @param startEnd {@link StartAndEndForSiteAndSiteChan}
   * @return {@link SiteDao}
   */
  public static List<SiteDao> updateStartEndAndReturnSiteDaos(
      StartAndEndForSiteAndSiteChan startEnd,
      List<SiteAndSurroundingDates> siteAndSurroundingDates) {

    List<SiteDao> siteDaos = new ArrayList<>();
    HashMap<String, SiteAndSurroundingDates> staCodeToMinTime = new HashMap<>();
    HashMap<String, SiteAndSurroundingDates> staCodeToMaxTime = new HashMap<>();

    for (SiteAndSurroundingDates siteAndSurrounding : siteAndSurroundingDates) {

      siteDaos.add(siteAndSurrounding.getSiteDao());
      String staCode = siteAndSurrounding.getSiteDao().getId().getStationCode();

      SiteAndSurroundingDates curr = staCodeToMinTime.get(staCode);

      if ((curr != null
              && curr.getSiteDao()
                  .getId()
                  .getOnDate()
                  .isAfter(siteAndSurrounding.getSiteDao().getId().getOnDate()))
          || curr == null) {

        staCodeToMinTime.put(staCode, siteAndSurrounding);
      }

      curr = staCodeToMaxTime.get(staCode);

      if ((curr != null
              && curr.getSiteDao()
                  .getOffDate()
                  .isBefore(siteAndSurrounding.getSiteDao().getOffDate()))
          || curr == null) {

        staCodeToMaxTime.put(staCode, siteAndSurrounding);
      }
    }

    for (SiteAndSurroundingDates surrounding : staCodeToMinTime.values()) {

      startEnd.setPrevTimeOverLapForSite(
          surrounding.getSiteDao(), surrounding.getPreviousOffDate().isPresent());
    }
    for (SiteAndSurroundingDates surrounding : staCodeToMaxTime.values()) {

      startEnd.setNextTimeOverLapForSite(
          surrounding.getSiteDao(), surrounding.getNextOnDate().isPresent());
    }

    return siteDaos;
  }

  /**
   * Update whether the start or end of a series of sitechans for a specific sta + chan have
   * overlaps and return the sitechan as a list
   *
   * @param siteChanAndSurroundingDates {@link SiteChanAndSurroundingDates}
   * @param start\End {@link StartAndEndForSiteAndSiteChan}
   * @return {@link SiteDao}
   */
  public static List<SiteChanDao> updateStartEndAndReturnSiteChanDaos(
      StartAndEndForSiteAndSiteChan startEnd,
      List<SiteChanAndSurroundingDates> siteChanAndSurroundingDates) {

    List<SiteChanDao> siteChanDaos = new ArrayList<>();
    HashMap<String, SiteChanAndSurroundingDates> staChanCodeToMinTime = new HashMap<>();
    HashMap<String, SiteChanAndSurroundingDates> staChanCodeToMaxTime = new HashMap<>();

    for (SiteChanAndSurroundingDates siteChanAndSurrounding : siteChanAndSurroundingDates) {

      siteChanDaos.add(siteChanAndSurrounding.getSiteChanDao());
      SiteChanKey key = siteChanAndSurrounding.getSiteChanDao().getId();
      String staChanCode = key.getStationCode() + key.getChannelCode();

      SiteChanAndSurroundingDates curr = staChanCodeToMinTime.get(staChanCode);

      if ((curr != null
              && curr.getSiteChanDao()
                  .getId()
                  .getOnDate()
                  .isAfter(siteChanAndSurrounding.getSiteChanDao().getId().getOnDate()))
          || curr == null) {

        staChanCodeToMinTime.put(staChanCode, siteChanAndSurrounding);
      }

      curr = staChanCodeToMaxTime.get(staChanCode);

      if ((curr != null
              && curr.getSiteChanDao()
                  .getOffDate()
                  .isBefore(siteChanAndSurrounding.getSiteChanDao().getOffDate()))
          || curr == null) {

        staChanCodeToMaxTime.put(staChanCode, siteChanAndSurrounding);
      }
    }

    for (SiteChanAndSurroundingDates surrounding : staChanCodeToMinTime.values()) {

      startEnd.setPrevTimeOverLapForSiteChan(
          surrounding.getSiteChanDao(), surrounding.getPreviousOffDate().isPresent());
    }
    for (SiteChanAndSurroundingDates surrounding : staChanCodeToMaxTime.values()) {

      startEnd.setNextTimeOverLapForSiteChan(
          surrounding.getSiteChanDao(), surrounding.getNextOnDate().isPresent());
    }

    return siteChanDaos;
  }
}
