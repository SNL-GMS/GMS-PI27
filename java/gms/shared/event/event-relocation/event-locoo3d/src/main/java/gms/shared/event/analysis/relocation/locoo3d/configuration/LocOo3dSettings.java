package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Map;
import java.util.Properties;
import javax.annotation.Nullable;

/**
 * Contains information needed to properly setup the {@link LocOo3dSettings} object.
 *
 * @param LocOo3d2dLookupSettings - the provided {@link LocOo3d2dLookupSettings} settings.
 * @param LocOo3dRSTTSettings - the provided {@link LocOo3dRSTTSettings} settings.
 * @param LocOo3dBenderSettings - the provided {@link LocOo3dBenderSettings} settings.
 * @param LibCorrInitializationSettings - the provided {@link LibCorrInitializationSettings}
 *     settings.
 * @param ttPathCorrections - asserts wether or not the tt path corrections will need to be used.
 * @param azPathCorrections - asserts wether or not the az path corrections will need to be used.
 * @param shPathCorrections - asserts wether or not the sh path corrections will need to be used.
 * @param ttModelUncertainty - asserts wether or not the tt model uncertainty will need to be used.
 * @param azModelUncertainty - asserts wether or not the az model uncertainty will need to be used.
 * @param shModelUncertainty - asserts wether or not the sh model uncertainty will need to be used.
 */
public record LocOo3dSettings(
    @Nullable LocOo3d2dLookupSettings locOo3d2dLookupSettings,
    @Nullable LocOo3dRSTTSettings locOo3dRSTTSettings,
    @Nullable LocOo3dBenderSettings locOo3dBenderSettings,
    Map<String, LibCorrInitializationSettings> predictorToLibCorrSettings,
    boolean ttPathCorrections,
    boolean azPathCorrections,
    boolean shPathCorrections,
    boolean ttModelUncertainty,
    boolean azModelUncertainty,
    boolean shModelUncertainty)
    implements PropertiesSetter {

  /** {@inheritDoc} */
  @Override
  public Properties setProperties(Properties properties) {
    if (locOo3d2dLookupSettings != null) {
      locOo3d2dLookupSettings.setProperties(properties);
    }
    if (locOo3dBenderSettings != null) {
      locOo3dBenderSettings.setProperties(properties);
    }
    if (locOo3dRSTTSettings != null) {
      locOo3dRSTTSettings.setProperties(properties);
    }
    predictorToLibCorrSettings.forEach(
        (predictor, definition) -> definition.setProperties(predictor, properties));
    properties.setProperty("use_tt_path_corrections", Boolean.toString(ttPathCorrections));
    properties.setProperty("use_az_path_corrections", Boolean.toString(azPathCorrections));
    properties.setProperty("use_sh_path_corrections", Boolean.toString(shPathCorrections));
    properties.setProperty("use_tt_model_uncertainty", Boolean.toString(ttModelUncertainty));
    properties.setProperty("use_az_model_uncertainty", Boolean.toString(azModelUncertainty));
    properties.setProperty("use_sh_model_uncertainty", Boolean.toString(shModelUncertainty));
    return properties;
  }
}
