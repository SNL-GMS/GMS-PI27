package gms.shared.stationdefinition.coi.utils;

import gms.shared.stationdefinition.coi.channel.ChannelDataType;

/** An enumeration of units used in any given context */
public enum Units {
  COUNT,
  COUNTS_PER_NANOMETER,
  COUNTS_PER_PASCAL,
  DECIBELS,
  DEGREES,
  DEGREES_PER_KM,
  DEGREES_PER_SECOND,
  HERTZ,
  KILOMETERS,
  KILOMETERS_PER_SECOND,
  LOG_NM,
  MICROPASCALS,
  NANOMETERS,
  NANOMETERS_PER_COUNT,
  NANOMETERS_PER_SECOND,
  NANOMETERS_SQUARED_PER_SECOND,
  ONE_OVER_DEGREE,
  ONE_OVER_KM,
  PASCALS,
  PASCALS_PER_COUNT,
  RADIANS,
  SECONDS,
  SECONDS_PER_DEGREE,
  SECONDS_PER_DEGREE_KM,
  SECONDS_PER_DEGREE_SQUARED,
  SECONDS_PER_KILOMETER,
  SECONDS_PER_KM_PER_DEGREE,
  SECONDS_PER_KM_SQUARED,
  SECONDS_PER_RADIAN,
  UNITLESS;

  /**
   * Given a reference channel, return the correct units for that channel's data type (e.g. seimsic
   * units are counts/nm).
   *
   * @param referenceChannelDataType data type for channel whose units are returned
   * @return units for specified channel
   */
  public static Units determineUnits(ChannelDataType referenceChannelDataType) {
    return switch (referenceChannelDataType) {
      case SEISMIC -> Units.NANOMETERS;
      case HYDROACOUSTIC -> Units.MICROPASCALS;
      case INFRASOUND -> Units.PASCALS;
      default -> Units.UNITLESS;
    };
  }
}
