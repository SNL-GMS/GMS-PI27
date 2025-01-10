package gms.shared.stationdefinition.dao.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanAndSurroundingDates;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class SiteAndSiteChanUtilityTest {

  @Test
  void testUpdateStartEndAndReturnSiteDaos() {

    var actual = new StartAndEndForSiteAndSiteChan();

    var sta1 = "STA1";
    var sta2 = "STA2";
    var sta3 = "STA3";

    var t1 = Instant.parse("2000-11-10T17:26:44Z");
    var t2 = Instant.parse("2002-06-10T17:26:44Z");
    var t3 = Instant.parse("2003-07-10T17:26:44Z");
    var t4 = Instant.parse("2008-11-10T17:26:44Z");
    var t5 = Instant.parse("2010-07-10T17:26:44Z");
    var t6 = Instant.parse("2015-09-10T17:26:44Z");
    var t7 = Instant.parse("2020-09-10T17:26:44Z");

    var site1 = DefaultCoiTestFixtures.getDefaultSiteDao();
    site1.getId().setStationCode(sta1);
    site1.getId().setOnDate(t1);
    site1.setOffDate(t2);

    var site2 = DefaultCoiTestFixtures.getDefaultSiteDao();
    site2.getId().setStationCode(sta1);
    ;
    site2.getId().setOnDate(t2);
    site2.setOffDate(t3);

    var site3 = DefaultCoiTestFixtures.getDefaultSiteDao();
    site3.getId().setStationCode(sta1);
    ;
    site3.getId().setOnDate(t4);
    site3.setOffDate(t5);

    var site4 = DefaultCoiTestFixtures.getDefaultSiteDao();
    site4.getId().setStationCode(sta2);
    site4.getId().setOnDate(t1);
    site4.setOffDate(t2);

    var site5 = DefaultCoiTestFixtures.getDefaultSiteDao();
    site5.getId().setStationCode(sta2);
    site5.getId().setOnDate(t6);
    site5.setOffDate(t7);

    var site6 = DefaultCoiTestFixtures.getDefaultSiteDao();
    site6.getId().setStationCode(sta3);
    site6.getId().setOnDate(t6);
    site6.setOffDate(t7);

    var siteSet =
        List.of(site1, site2, site3, site4, site5, site6).stream().collect(Collectors.toList());

    var siteAndSurrounding1 = new SiteAndSurroundingDates(site1, null, t2);
    var siteAndSurrounding2 = new SiteAndSurroundingDates(site2, t2, t3);
    var siteAndSurrounding3 = new SiteAndSurroundingDates(site3, null, t5);

    var siteAndSurrounding4 = new SiteAndSurroundingDates(site4, t2, t3);
    var siteAndSurrounding5 = new SiteAndSurroundingDates(site5, null, null);

    var siteAndSurrounding6 = new SiteAndSurroundingDates(site6, t6, t7);
    var sitesAndSurroundings =
        List.of(
            siteAndSurrounding1,
            siteAndSurrounding2,
            siteAndSurrounding3,
            siteAndSurrounding4,
            siteAndSurrounding5,
            siteAndSurrounding6);

    var returned =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(actual, sitesAndSurroundings);
    var returnedSet = returned.stream().collect(Collectors.toList());

    assertEquals(6, returned.size());
    assertEquals(siteSet, returnedSet);
    assertTrue(actual.isNextTimeOverLapForSite(site1));
    assertTrue(!actual.isPrevTimeOverLapForSite(site1));
    assertTrue(!actual.isNextTimeOverLapForSite(site4));
    assertTrue(actual.isPrevTimeOverLapForSite(site4));
    assertTrue(actual.isNextTimeOverLapForSite(site6));
    assertTrue(actual.isPrevTimeOverLapForSite(site6));
  }

  @Test
  void testUpdateStartEndAndReturnSiteChanDaos() {

    var actual = new StartAndEndForSiteAndSiteChan();

    var sta1 = "STA1";
    var chan1 = "CHAN1";
    var chan2 = "CHAN2";
    var chan3 = "CHAN3";
    var sta2 = "STA2";
    var chan4 = "BBO";

    var t1 = Instant.parse("2000-11-10T17:26:44Z");
    var t2 = Instant.parse("2002-06-10T17:26:44Z");
    var t3 = Instant.parse("2003-07-10T17:26:44Z");
    var t4 = Instant.parse("2008-11-10T17:26:44Z");
    var t5 = Instant.parse("2010-07-10T17:26:44Z");
    var t6 = Instant.parse("2015-09-10T17:26:44Z");
    var t7 = Instant.parse("2020-09-10T17:26:44Z");

    var siteChan1 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan1.getId().setStationCode(sta1);
    siteChan1.getId().setChannelCode(chan1);
    siteChan1.getId().setOnDate(t1);
    siteChan1.setOffDate(t2);

    var siteChan2 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan2.getId().setStationCode(sta1);
    siteChan2.getId().setChannelCode(chan1);
    siteChan2.getId().setOnDate(t3);
    siteChan2.setOffDate(t4);

    var siteChan3 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan3.getId().setStationCode(sta1);
    siteChan3.getId().setChannelCode(chan1);
    siteChan3.getId().setOnDate(t5);
    siteChan3.setOffDate(t6);

    var siteChan4 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan4.getId().setStationCode(sta1);
    siteChan4.getId().setChannelCode(chan2);
    siteChan4.getId().setOnDate(t1);
    siteChan4.setOffDate(t3);

    var siteChan5 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan5.getId().setStationCode(sta1);
    siteChan5.getId().setChannelCode(chan2);
    siteChan5.getId().setOnDate(t3);
    siteChan5.setOffDate(t5);

    var siteChan6 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan6.getId().setStationCode(sta1);
    siteChan6.getId().setChannelCode(chan3);
    siteChan6.getId().setOnDate(t3);
    siteChan6.setOffDate(t5);

    var siteChan7 = DefaultCoiTestFixtures.getDefaultSiteChanDao();
    siteChan7.getId().setStationCode(sta2);
    siteChan7.getId().setChannelCode(chan4);
    siteChan7.getId().setOnDate(t3);
    siteChan7.setOffDate(t5);

    var siteChanSet =
        List.of(siteChan1, siteChan2, siteChan3, siteChan4, siteChan5, siteChan6, siteChan7)
            .stream()
            .collect(Collectors.toList());

    var siteChanAndSurrounding1 = new SiteChanAndSurroundingDates(siteChan1, null, t2);
    var siteChanAndSurrounding2 = new SiteChanAndSurroundingDates(siteChan2, t2, t3);
    var siteChanAndSurrounding3 = new SiteChanAndSurroundingDates(siteChan3, null, t5);

    var siteChanAndSurrounding4 = new SiteChanAndSurroundingDates(siteChan4, t2, t3);
    var siteChanAndSurrounding5 = new SiteChanAndSurroundingDates(siteChan5, null, null);

    var siteChanAndSurrounding6 = new SiteChanAndSurroundingDates(siteChan6, t6, t7);

    var siteChanAndSurrounding7 = new SiteChanAndSurroundingDates(siteChan7, t6, t7);

    var siteChanAndSurroundings =
        List.of(
            siteChanAndSurrounding1,
            siteChanAndSurrounding2,
            siteChanAndSurrounding3,
            siteChanAndSurrounding4,
            siteChanAndSurrounding5,
            siteChanAndSurrounding6,
            siteChanAndSurrounding7);

    var returned =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(actual, siteChanAndSurroundings);
    var returnedSet = returned.stream().collect(Collectors.toList());

    assertEquals(7, returned.size());
    assertEquals(siteChanSet, returnedSet);
    assertTrue(actual.isNextTimeOverLapForSiteChan(siteChan1));
    assertTrue(!actual.isPrevTimeOverLapForSiteChan(siteChan1));
    assertTrue(!actual.isNextTimeOverLapForSiteChan(siteChan4));
    assertTrue(actual.isPrevTimeOverLapForSiteChan(siteChan4));
    assertTrue(actual.isNextTimeOverLapForSiteChan(siteChan6));
    assertTrue(actual.isPrevTimeOverLapForSiteChan(siteChan6));
    assertTrue(actual.isNextTimeOverLapForSiteChan(siteChan7));
    assertTrue(actual.isPrevTimeOverLapForSiteChan(siteChan7));
  }
}
