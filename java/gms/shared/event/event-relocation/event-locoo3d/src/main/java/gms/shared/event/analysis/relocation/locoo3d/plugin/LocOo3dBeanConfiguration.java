package gms.shared.event.analysis.relocation.locoo3d.plugin;

import gms.shared.event.analysis.relocation.locoo3d.configuration.LocOo3dConfigurationResolver;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.locoo3d.LocOO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Creates a LocOO bean for use in LocOo3dEventRelocator. */
@Configuration
public class LocOo3dBeanConfiguration {
  @Bean
  public LocOO getLocOO(@Autowired LocOo3dConfigurationResolver resolver) throws Exception {
    var locOo3dSettings = resolver.getLocOo3dSettings();

    var properties = new PropertiesPlusGMP();

    locOo3dSettings.setProperties(properties);

    return new LocOO(properties);
  }
}
