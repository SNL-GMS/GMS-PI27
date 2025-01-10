package gms.shared.stationdefinition.coi.utils;

import static com.google.common.base.Preconditions.checkArgument;

import gms.shared.stationdefinition.coi.filter.FirFilterParameters;
import gms.shared.stationdefinition.coi.filter.IirFilterParameters;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.LinearFilterParameters;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import java.util.function.Supplier;

/** Utility class for housing validation logic for Filter COI classes */
public final class FilterValidator {

  private FilterValidator() {
    // private constructor for utility class
  }

  public static void validate(LinearFilterDescription description) {
    checkArgument(
        description.getFilterType() == FilterType.LINEAR,
        "Linear filter are only of the LINEAR type");
    checkArgument(description.getOrder() >= 1, "Filter order must be at greater or equal than one");

    var passBandType = description.getPassBandType();
    switch (passBandType) {
      case LOW_PASS -> {
        checkArgument(
            description.getLowFrequencyHz().isEmpty(),
            presentFrequencyMessage("Low", passBandType));
        checkFrequency(
            description
                .getHighFrequencyHz()
                .orElseThrow(missingFrequencyException("High", passBandType)));
      }
      case HIGH_PASS -> {
        checkFrequency(
            description
                .getLowFrequencyHz()
                .orElseThrow(missingFrequencyException("Low", passBandType)));
        checkArgument(
            description.getHighFrequencyHz().isEmpty(),
            presentFrequencyMessage("High", passBandType));
      }
      case BAND_PASS, BAND_REJECT -> {
        checkFrequency(
            description
                .getLowFrequencyHz()
                .orElseThrow(missingFrequencyException("Low", passBandType)));
        checkFrequency(
            description
                .getHighFrequencyHz()
                .orElseThrow(missingFrequencyException("High", passBandType)));
      }
    }

    checkArgument(
        description.isCausal() ^ description.isZeroPhase(),
        "causal and zeroPhase must be opposite values");
    description
        .getParameters()
        .ifPresent(parameters -> validate(parameters, description.getLinearFilterType()));
  }

  private static void validate(
      LinearFilterParameters parameters, LinearFilterType linearFilterType) {

    switch (linearFilterType) {
      case FIR_HAMMING, FIR_OTHER -> checkArgument(
          parameters instanceof FirFilterParameters,
          "FirFilterParameters must be used when linearFilterType.FIR_HAMMING or"
              + " linearFilterType.FIR_OTHER is set.");
      case IIR_BUTTERWORTH, IIR_OTHER -> checkArgument(
          parameters instanceof IirFilterParameters,
          "IirFilterParameters must be used when linearFilterType.IIR_BUTTERWORTH OR"
              + " linearFilterType.IIR_OTHER is set.");
    }
  }

  private static Supplier<IllegalArgumentException> missingFrequencyException(
      String kind, PassBandType passBandType) {
    return () -> new IllegalArgumentException(missingFrequencyMessage(kind, passBandType));
  }

  private static String presentFrequencyMessage(String kind, PassBandType passBandType) {
    return String.format(
        "%s Frequency must not be present for PassBandType %s", kind, passBandType);
  }

  private static String missingFrequencyMessage(String kind, PassBandType passBandType) {
    return String.format("%s Frequency must be present for PassBandType %s", kind, passBandType);
  }

  private static void checkFrequency(Double frequency) {
    checkArgument(frequency >= 0.0, "Frequency values must be positive");
  }
}
