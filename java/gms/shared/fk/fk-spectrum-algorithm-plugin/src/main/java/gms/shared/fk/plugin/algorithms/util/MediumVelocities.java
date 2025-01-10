package gms.shared.fk.plugin.algorithms.util;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import org.apache.commons.lang3.Validate;

public class MediumVelocities {

  private static final int NUM_PARTS_IN_VALID_FORMAT = 2;

  private Map<PhaseType, Double> data;

  public MediumVelocities() {
    this.data = new EnumMap<>(PhaseType.class);
  }

  public void initialize(String modelName) throws IOException {
    Objects.requireNonNull(
        modelName, "modelName parameter cannot be null for MediumVelocities::initialize()");

    var properties = new Properties();

    try (var propertiesInputStream =
        Thread.currentThread()
            .getContextClassLoader()
            .getResourceAsStream("application.properties")) {

      properties.load(propertiesInputStream);
    } catch (NullPointerException e) {

      throw new IllegalArgumentException(
          "application.properties file not found for MediumVelocities::initialize()");
    }

    String velocitiesConfig = properties.getProperty(modelName + ".mediumVelocities");
    Objects.requireNonNull(
        velocitiesConfig,
        modelName
            + ".mediumVelocities property not found in application.properties for"
            + " MediumVelocities::initialize()");

    for (String velocity : velocitiesConfig.split(",")) {
      String[] v = velocity.split(":");

      Validate.isTrue(
          v.length == NUM_PARTS_IN_VALID_FORMAT,
          "Invalid format for specificying medium velocities in config file");

      data.put(PhaseType.valueOf(v[0]), Double.valueOf(v[1]));
    }
  }

  public double getMediumVelocity(PhaseType p) {
    Objects.requireNonNull(
        p, "PhaseType parameter cannot be null in MediumVelocities::getMediumVelocity()");

    PhaseType finalPhase = p.getFinalPhase();
    if (PhaseType.UNKNOWN == finalPhase) {
      throw new IllegalArgumentException(
          "Provided phase type \""
              + p.name()
              + "\" cannot be mapped into PhaseType \"P\" or \"S\"");
    } else {
      return data.get(finalPhase);
    }
  }

  public double getMediumVelocity(Channel channel, PhaseType p) {
    return this.getMediumVelocity(p);
  }

  public double getMediumVelocity(Location receiverLocation, PhaseType p) {
    return this.getMediumVelocity(p);
  }
}
