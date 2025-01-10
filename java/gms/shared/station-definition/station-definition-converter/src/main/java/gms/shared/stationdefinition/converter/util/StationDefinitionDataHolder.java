package gms.shared.stationdefinition.converter.util;

import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import java.util.List;

public class StationDefinitionDataHolder {
  private List<SiteDao> siteDaos;
  private List<SiteChanDao> siteChanDaos;
  private List<SensorDao> sensorDaos;
  private List<InstrumentDao> instrumentDaos;
  private List<WfdiscDao> wfdiscVersions;
  private StartAndEndForSiteAndSiteChan startEndBoolean;

  public StationDefinitionDataHolder(
      List<SiteDao> siteDaos,
      List<SiteChanDao> siteChanDaos,
      List<SensorDao> sensorDaos,
      List<InstrumentDao> instrumentDaos,
      List<WfdiscDao> wfdiscVersions,
      StartAndEndForSiteAndSiteChan map) {
    this.siteDaos = siteDaos;
    this.siteChanDaos = siteChanDaos;
    this.sensorDaos = sensorDaos;
    this.wfdiscVersions = wfdiscVersions;
    this.instrumentDaos = instrumentDaos;
    this.startEndBoolean = map;
  }

  public List<SiteDao> getSiteDaos() {
    return siteDaos;
  }

  public List<SiteChanDao> getSiteChanDaos() {
    return siteChanDaos;
  }

  public List<SensorDao> getSensorDaos() {
    return sensorDaos;
  }

  public List<InstrumentDao> getInstrumentDaos() {
    return instrumentDaos;
  }

  public List<WfdiscDao> getWfdiscVersions() {
    return wfdiscVersions;
  }

  public StartAndEndForSiteAndSiteChan getStartEndBoolean() {
    return startEndBoolean;
  }

  @Override
  public String toString() {
    var sb = new StringBuilder();
    sb.append("StationDefinitionDataHolder{");
    sb.append("siteDaos=").append(siteDaos);
    sb.append(", siteChanDaos=").append(siteChanDaos);
    sb.append(", sensorDaos=").append(sensorDaos);
    sb.append(", instrumentDaos=").append(instrumentDaos);
    sb.append(", wfdiscVersions=").append(wfdiscVersions);
    sb.append(", startEndBoolean=").append(startEndBoolean);
    sb.append('}');
    return sb.toString();
  }
}
