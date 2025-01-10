package gms.shared.stationdefinition.dao.util;

import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import org.junit.jupiter.api.Test;

class StartAndEndForSiteAndSiteChanTest {

  @Test
  void testMissingSiteAndSiteChan() {

    var startAndEnd = new StartAndEndForSiteAndSiteChan();
    var site = DefaultCoiTestFixtures.getDefaultSiteDao();
    var siteChan = DefaultCoiTestFixtures.getDefaultSiteChanDao();

    assertTrue(!startAndEnd.isNextTimeOverLapForSite(site));
    assertTrue(!startAndEnd.isNextTimeOverLapForSiteChan(siteChan));

    assertTrue(!startAndEnd.isPrevTimeOverLapForSite(site));
    assertTrue(!startAndEnd.isPrevTimeOverLapForSiteChan(siteChan));

    startAndEnd.setNextTimeOverLapForSite(site, true);
    startAndEnd.setNextTimeOverLapForSiteChan(siteChan, true);

    assertTrue(startAndEnd.isNextTimeOverLapForSite(site));
    assertTrue(startAndEnd.isNextTimeOverLapForSiteChan(siteChan));

    startAndEnd.setPrevTimeOverLapForSite(site, true);
    startAndEnd.setPrevTimeOverLapForSiteChan(siteChan, true);

    assertTrue(startAndEnd.isPrevTimeOverLapForSite(site));
    assertTrue(startAndEnd.isPrevTimeOverLapForSiteChan(siteChan));

    startAndEnd.setNextTimeOverLapForSite(site, false);
    startAndEnd.setNextTimeOverLapForSiteChan(siteChan, false);

    assertTrue(!startAndEnd.isNextTimeOverLapForSite(site));
    assertTrue(!startAndEnd.isNextTimeOverLapForSiteChan(siteChan));

    startAndEnd.setPrevTimeOverLapForSite(site, false);
    startAndEnd.setPrevTimeOverLapForSiteChan(siteChan, false);

    assertTrue(!startAndEnd.isPrevTimeOverLapForSite(site));
    assertTrue(!startAndEnd.isPrevTimeOverLapForSiteChan(siteChan));
  }
}
