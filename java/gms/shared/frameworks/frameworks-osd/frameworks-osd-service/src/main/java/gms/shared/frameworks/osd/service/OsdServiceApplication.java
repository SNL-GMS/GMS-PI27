package gms.shared.frameworks.osd.service;

import gms.shared.frameworks.osd.repository.OsdRepositoryFactory;
import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OsdServiceApplication {

  private static final Logger LOGGER = LoggerFactory.getLogger(OsdServiceApplication.class);

  public static void main(String[] args) {
    final var config = SystemConfig.create("osd");
    try {
      var osdRepository = OsdRepositoryFactory.createOsdRepository(config);
      ServiceGenerator.runService(osdRepository, config);
    } catch (Exception e) {
      LOGGER.error("OSD Service encountered an unrecoverable exception: ", e);
      System.exit(1);
    }
  }
}
