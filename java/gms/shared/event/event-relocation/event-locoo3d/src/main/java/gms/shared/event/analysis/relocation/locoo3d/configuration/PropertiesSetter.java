package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Properties;

/** Sets the properties in all the LocOo3dSettings domain. */
public interface PropertiesSetter {

  /**
   * Return the properties {@link Properties} for the appropriate labels
   *
   * @param properties the {@link Properties} to be set for the new settings
   * @return the modified {@link Properties} corresponding to the new settings
   */
  Properties setProperties(Properties properties);
}
