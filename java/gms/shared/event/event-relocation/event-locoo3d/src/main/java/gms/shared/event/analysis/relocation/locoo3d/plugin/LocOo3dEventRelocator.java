package gms.shared.event.analysis.relocation.locoo3d.plugin;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.relocation.api.EventRelocatorPlugin;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsInput;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsInputOutputFactory;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsOutput;
import gms.shared.event.analysis.relocation.locoo3d.configuration.EventRelocationProcessingDefinitionSettings;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.LocationSolution;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.locoo3d.LocOO;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Relocates {@link EventHypothesis} objects using LocOo3d */
@Component
public class LocOo3dEventRelocator implements EventRelocatorPlugin {

  private static final int HIGHEST_SALSA3D_VERBOSITY = 4;
  private final LocOO locOO;

  @Autowired
  public LocOo3dEventRelocator(LocOO locoo) {
    this.locOO = locoo;
  }

  /** {@inheritDoc} */
  @Override
  public Collection<LocationSolution> relocate(
      EventHypothesis eventHypothesis,
      EventRelocationDefinition eventRelocationDefinition,
      Map<PhaseType, List<EventRelocationPredictorDefinition>> eventRelocationDefinitionByPhaseType,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition) {

    Collection<LocationSolution> locationSolutions;

    var erpdSettings =
        new EventRelocationProcessingDefinitionSettings(
            eventRelocationProcessingDefinition, eventRelocationDefinitionByPhaseType);

    var properties = new PropertiesPlusGMP();

    erpdSettings.setProperties(properties);

    setDataLoaderProperties(properties);

    // TODO: more robust solution, like stdout and/or setting these in system config
    properties.setProperty("io_verbosity", HIGHEST_SALSA3D_VERBOSITY);
    properties.setProperty("io_log_file", "/tmp/locoo_log.txt");
    properties.setProperty("io_error_file", "/tmp/locoo_errors.txt");
    properties.setProperty("io_print_to_screen", Boolean.toString(true));
    properties.setProperty("io_print_errors_to_screen", Boolean.toString(true));

    var factory = createGmsInputOutputFactory(properties);

    setGmsInputAndAcceptCoi(
        factory, eventHypothesis, eventRelocationDefinition, eventRelocationProcessingDefinition);

    var gmsOutput = getGmsOutput(factory, eventRelocationProcessingDefinition);

    locationSolutions = gmsOutput.getOutputLocationSolutions().values();

    return locationSolutions;
  }

  private GmsOutput getGmsOutput(
      GmsInputOutputFactory factory,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition)
      throws LocOORunException {
    var gmsOutput = (GmsOutput) factory.getDataOutput();
    gmsOutput.setEllipseParameters(
        eventRelocationProcessingDefinition.locationUncertaintyDefinitions());
    try {
      locOO.run(factory);
    } catch (Exception ex) {
      throw new LocOORunException(ex);
    }
    return gmsOutput;
  }

  private static void setGmsInputAndAcceptCoi(
      GmsInputOutputFactory factory,
      EventHypothesis eventHypothesis,
      EventRelocationDefinition eventRelocationDefinition,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition)
      throws GmsInputAcceptCoiException {
    var gmsInput = (GmsInput) factory.getDataInput();

    var locationRestraints =
        eventRelocationProcessingDefinition.locationRestraints().stream()
            .collect(Collectors.toSet());

    try {
      gmsInput.acceptCoi(eventHypothesis, eventRelocationDefinition, locationRestraints);
    } catch (Exception ex) {
      throw new GmsInputAcceptCoiException(ex);
    }
  }

  private static GmsInputOutputFactory createGmsInputOutputFactory(PropertiesPlusGMP properties)
      throws FactoryCreationException {
    GmsInputOutputFactory factory = null;
    try {
      factory = new GmsInputOutputFactory(properties);
    } catch (Exception ex) {
      throw new FactoryCreationException(ex);
    }
    return factory;
  }

  private Properties setDataLoaderProperties(Properties properties) {
    properties.setProperty("dataLoaderInputType", "application");
    properties.setProperty("dataLoaderInputFormat", "gms");
    properties.setProperty("dataLoaderOutputType", "application");
    properties.setProperty("dataLoaderOutputFormat", "gms");

    return properties;
  }

  static class FactoryCreationException extends RuntimeException {
    public FactoryCreationException(Exception e) {
      super(e.getMessage(), e.getCause());
    }
  }

  static class LocOORunException extends RuntimeException {
    public LocOORunException(Exception e) {
      super(e.getMessage(), e.getCause());
    }
  }

  static class GmsInputAcceptCoiException extends RuntimeException {
    public GmsInputAcceptCoiException(Exception e) {
      super(e.getMessage(), e.getCause());
    }
  }
}
