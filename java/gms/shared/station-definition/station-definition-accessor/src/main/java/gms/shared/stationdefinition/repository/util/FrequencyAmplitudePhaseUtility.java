package gms.shared.stationdefinition.repository.util;

import static com.google.common.base.Preconditions.checkState;

import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.channel.AmplitudePhaseResponse;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseDefinition;
import gms.shared.stationdefinition.configuration.FrequencySamplingMode;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.analysis.interpolation.LinearInterpolator;
import org.apache.commons.math3.complex.Complex;

/**
 * Utility class containing methods related to generating {@link FrequencyAmplitudePhase} objects
 * from instrument response data files
 */
public final class FrequencyAmplitudePhaseUtility {

  private static final double RADIANS_TO_DEGREES = 180.0 / Math.PI;
  private static final double TOLERANCE = 1E-12;

  private FrequencyAmplitudePhaseUtility() {
    // Utility class
  }

  /**
   * Creates the list of frequencies to be stored in the {@link FrequencyAmplitudePhase} object
   *
   * @param fapDef the FrequencyAmplitudePhaseDefinition used to create the list
   * @param sampleRate the {@link InstrumentDao} sample rate, used to calculate the highest
   *     frequency detectable by the instrument (the Nyquist frequency)
   * @param calFreq the {@link Channel} calibration frequency, which will be the first entry in the
   *     list
   * @return the interpolated list of frequencies, with calFreq at index = 0
   */
  public static List<Double> generateFrequencyList(
      FrequencyAmplitudePhaseDefinition fapDef, double sampleRate, double calFreq) {

    var nyquistFreq = sampleRate / 2.0;
    checkState(
        fapDef.lowerFrequencyBoundHz() < nyquistFreq,
        "The nyquist frequency must be higher than the interpolation lower bound");

    var lowerBound = fapDef.lowerFrequencyBoundHz();
    // As an instrument can't detect frequencies above Nyquist, we cap the upper bound at Nyquist
    var upperBound =
        (nyquistFreq < fapDef.upperFrequencyBoundHz())
            ? nyquistFreq
            : fapDef.upperFrequencyBoundHz();

    checkState(
        lowerBound < upperBound,
        "The interpolation lower bound must be lower than the interpolation upper bound");
    checkState(
        fapDef.lowerFrequencyBoundHz() <= calFreq,
        "The calibration frequency must be higher than the interpolation lower bound");
    checkState(
        calFreq <= fapDef.upperFrequencyBoundHz(),
        "The calibration frequency must be lower than the interpolation upper bound [%s  %s]",
        calFreq,
        fapDef.upperFrequencyBoundHz());

    if (fapDef.frequencySamplingMode() == FrequencySamplingMode.LOG) {
      lowerBound = Math.log10(lowerBound);
      upperBound = Math.log10(upperBound);
    }

    var xValues = new double[] {0, (fapDef.frequencySamplingCount() - 1)};
    var yValues = new double[] {lowerBound, upperBound};

    var interpolator = new LinearInterpolator().interpolate(xValues, yValues);

    var freqList =
        IntStream.range(0, fapDef.frequencySamplingCount())
            .mapToDouble(interpolator::value)
            .map(
                d ->
                    (fapDef.frequencySamplingMode() == FrequencySamplingMode.LOG)
                        ? Math.pow(10, d)
                        : d)
            .boxed()
            .collect(Collectors.toList());

    freqList.add(0, calFreq);

    return ImmutableList.copyOf(freqList);
  }

  /**
   * Combines multiple H(f) DataBlocks into a single DataBlock, discarding frequencies f that aren't
   * present in all DataBlocks. A DataBlock is a list of (Double, Complex) pairs. The input
   * DataBlocks must have their first entry be the calibration frequency. Invalid frequencies are
   * indicated by having a Complex.NaN for the complex number in the pair.
   *
   * @param dataBlocks the list of DataBlocks created by parsers
   * @return the consolidated DataBlock
   */
  public static List<Pair<Double, Complex>> consolidateDataBlocks(
      List<List<Pair<Double, Complex>>> dataBlocks) {

    // start with a list with each entry = (1, 1 + 0i)
    List<Pair<Double, Complex>> consolidatedDataBlock =
        dataBlocks.get(0).stream()
            .map(db -> Pair.of(db.getLeft(), Complex.ONE))
            .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);

    // for each data block, multiply the corresponding entries for the data block and result block
    dataBlocks.forEach(dataBlock -> multiplyBlocks(dataBlock, consolidatedDataBlock));

    // strip out any entries that hava NaN for the complex number
    return consolidatedDataBlock.stream().filter(pair -> !pair.getRight().isNaN()).toList();
  }

  private static void multiplyBlocks(
      List<Pair<Double, Complex>> dataBlock, List<Pair<Double, Complex>> consolidatedDataBlock) {

    for (var i = 0; i < consolidatedDataBlock.size(); i++) {
      var consolidatedFreq = consolidatedDataBlock.get(i).getLeft();
      var freq = dataBlock.get(i).getLeft();
      checkState(
          Math.abs(freq - consolidatedFreq) < TOLERANCE,
          "Frequency mismatch when combining data blocks");
      var response = consolidatedDataBlock.get(i).getRight().multiply(dataBlock.get(i).getRight());
      consolidatedDataBlock.set(i, Pair.of(freq, response));
    }
  }

  /**
   * Constructs the {@link FrequencyAmplitudePhase} object from the DataBlock
   *
   * @param dataBlock the final DataBlock, with calFreq at index 0 and the remainder of the list
   *     sorted by frequency
   * @param nominalCalibrationFactor the nominal calibration factor from the {@link InstrumentDao}
   * @param nominalCalibrationPeriod the nominal calibration period from the {@link InstrumentDao}
   * @param nominalSampleRateHz nominal sample rate hz
   * @param id the {@link UUID} generated for this {@link FrequencyAmplitudePhase}
   * @param channelDataType the {@link ChannelDataType}, used to determine the units for the
   *     Amplitude response
   * @return the fully populated {@link FrequencyAmplitudePhase}
   */
  public static FrequencyAmplitudePhase constructFrequencyAmplitudePhase(
      List<Pair<Double, Complex>> dataBlock,
      double nominalCalibrationFactor,
      double nominalCalibrationPeriod,
      double nominalSampleRateHz,
      UUID id,
      ChannelDataType channelDataType) {

    checkState(!dataBlock.isEmpty(), "Cannot construct FAP from an empty data block");

    var normalizedDataBlock = normalize(dataBlock, nominalCalibrationFactor);
    var degreesDataBlock = convertToDegrees(normalizedDataBlock);
    placeCalFreq(degreesDataBlock);

    var ampUnits =
        switch (channelDataType) {
          case SEISMIC -> Units.COUNTS_PER_NANOMETER;
          case HYDROACOUSTIC, INFRASOUND -> Units.COUNTS_PER_PASCAL;
          default -> Units.UNITLESS;
        };

    var freqList = new ArrayList<Double>();
    var respList = new ArrayList<AmplitudePhaseResponse>();

    degreesDataBlock.forEach(
        (var data) -> {
          var freq = data.getLeft();

          var amplitude = DoubleValue.from(data.getRight().getLeft(), Optional.empty(), ampUnits);
          var phase = DoubleValue.from(data.getRight().getRight(), Optional.empty(), Units.DEGREES);
          var resp = AmplitudePhaseResponse.from(amplitude, phase);

          freqList.add(freq);
          respList.add(resp);
        });

    // create the calibration object from input nominal values
    // time shift zero due to no nominal time shift in instrument response
    var calibration =
        Calibration.from(
            nominalCalibrationPeriod,
            Duration.ZERO,
            DoubleValue.from(
                nominalCalibrationFactor, Optional.empty(), Units.NANOMETERS_PER_COUNT));

    var data =
        FrequencyAmplitudePhase.Data.builder()
            .setFrequencies(freqList)
            .setAmplitudePhaseResponses(respList)
            .setNominalCalibration(calibration)
            .setNominalSampleRateHz(nominalSampleRateHz)
            .build();

    return FrequencyAmplitudePhase.builder().setId(id).setData(data).build();
  }

  /** Normalizes the data block so that |H(1/ncalper)| = 1/ncalib */
  private static List<Pair<Double, Complex>> normalize(
      List<Pair<Double, Complex>> dataBlock, double ncalib) {

    var amplitudeAtCalFreq = dataBlock.get(0).getRight().abs();
    var normalizationFactor = (1 / ncalib) / amplitudeAtCalFreq;

    return dataBlock.stream()
        .map(pair -> Pair.of(pair.getLeft(), pair.getRight().multiply(normalizationFactor)))
        .toList();
  }

  /**
   * Converts the list of complex numbers to polar form with phases in the range [0, 360) degrees.
   * The resulting list needs to be mutable.
   */
  private static List<Pair<Double, Pair<Double, Double>>> convertToDegrees(
      List<Pair<Double, Complex>> normalizedDataBlock) {

    return normalizedDataBlock.stream()
        .map(pair -> Pair.of(pair.getLeft(), convertToPolarDegrees(pair.getRight())))
        .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
  }

  /** Converts a complex number to polar form with phases in the range [0, 360) degrees. */
  private static Pair<Double, Double> convertToPolarDegrees(Complex complex) {
    var amplitude = complex.abs();

    // getArgument returns the phase in the range [-pi, pi]
    var phaseRadians = complex.getArgument();
    // translate to the range [0, 2pi) by adding 2pi to the negative phases
    var phaseUnwrapped = (phaseRadians >= 0.0) ? phaseRadians : ((2.0 * Math.PI) + phaseRadians);
    var phaseDegrees = phaseUnwrapped * RADIANS_TO_DEGREES;

    return Pair.of(amplitude, phaseDegrees);
  }

  /**
   * Sorts the calibration frequency into the interpolated list, removing a it if it already exists
   */
  private static void placeCalFreq(List<Pair<Double, Pair<Double, Double>>> dataBlock) {

    if (dataBlock.size() == 1) {
      return;
    }

    var calFreqPair = dataBlock.remove(0);

    var insertionPoint =
        dataBlock.stream().filter(pair -> calFreqPair.getLeft() < pair.getLeft()).findFirst();

    int index;
    if (insertionPoint.isPresent()) {
      index = dataBlock.indexOf(insertionPoint.get());
      dataBlock.add(index, calFreqPair);
    } else {
      dataBlock.add(calFreqPair);
      index = dataBlock.size() - 1;
    }

    // remove the bordering entry if it's too close to the just-added calFreqPair
    if ((index != dataBlock.size() - 1)
        && (dataBlock.get(index + 1).getLeft() - dataBlock.get(index).getLeft() < TOLERANCE)) {
      dataBlock.remove(index + 1);
    }
    if (index != 0
        && (dataBlock.get(index).getLeft() - dataBlock.get(index - 1).getLeft()) < TOLERANCE) {
      dataBlock.remove(index - 1);
    }
  }
}
