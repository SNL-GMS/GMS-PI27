package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseDefinition;
import gms.shared.stationdefinition.configuration.FrequencySamplingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.complex.Complex;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FrequencyAmplitudePhaseUtilityTest {

  private static final double TOLERANCE = 1E-12;

  @ParameterizedTest
  @MethodSource("getFrequencyInterpolationArguments")
  void testFrequencyInterpolation(
      double calFreq,
      double sampleRate,
      FrequencyAmplitudePhaseDefinition fapDef,
      List<Double> expected) {

    if (expected == null) {
      assertThrows(
          IllegalStateException.class,
          () -> FrequencyAmplitudePhaseUtility.generateFrequencyList(fapDef, sampleRate, calFreq));
    } else {
      var result =
          FrequencyAmplitudePhaseUtility.generateFrequencyList(fapDef, sampleRate, calFreq);

      assertTrue(fuzzyEquals(result.get(0), calFreq));
      for (int i = 0; i < expected.size(); i++) {
        assertTrue(fuzzyEquals(result.get(i + 1), expected.get(i)));
      }
    }
  }

  private static Stream<Arguments> getFrequencyInterpolationArguments() {
    return Stream.of(
        arguments(
            15.0,
            0.02,
            new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LOG, 128),
            null),
        arguments(
            0.01,
            1000.0,
            new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LINEAR, 128),
            null),
        arguments(
            25.0,
            1000.0,
            new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LINEAR, 128),
            null),
        arguments(
            15.0,
            1000.0,
            new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LOG, 128),
            TestFixtures.LOG_FREQS),
        arguments(
            15.0,
            1000.0,
            new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LINEAR, 128),
            TestFixtures.LINEAR_FREQS),
        arguments(
            5.0,
            20.0,
            new FrequencyAmplitudePhaseDefinition(0.02, 20.0, FrequencySamplingMode.LOG, 128),
            TestFixtures.HALF_RANGE));
  }

  @Test
  void testCombineBlocksSingleBlock() {
    var pairA1 = Pair.of(1.0, new Complex(2.0, 3.0));
    var pairA2 = Pair.of(4.0, new Complex(5.0, 6.0));
    var pairA3 = Pair.of(7.0, new Complex(8.0, 9.0));
    var blockA = List.of(pairA1, pairA2, pairA3);

    var result = FrequencyAmplitudePhaseUtility.consolidateDataBlocks(List.of(blockA));
    var expected = blockA;

    assertArrayEquals(expected.toArray(), result.toArray());
  }

  @Test
  void testCombineBlocksTwoBlocks() {
    var pairA1 = Pair.of(1.0, new Complex(2.0, 3.0));
    var pairA2 = Pair.of(4.0, new Complex(5.0, 6.0));
    var pairA3 = Pair.of(7.0, new Complex(8.0, 9.0));
    var blockA = List.of(pairA1, pairA2, pairA3);
    var blockB = List.of(pairA1, pairA2, pairA3);

    var pairE1 = Pair.of(1.0, pairA1.getRight().multiply(pairA1.getRight()));
    var pairE2 = Pair.of(4.0, pairA2.getRight().multiply(pairA2.getRight()));
    var pairE3 = Pair.of(7.0, pairA3.getRight().multiply(pairA3.getRight()));

    var result = FrequencyAmplitudePhaseUtility.consolidateDataBlocks(List.of(blockA, blockB));
    var expected = List.of(pairE1, pairE2, pairE3);

    assertArrayEquals(expected.toArray(), result.toArray());
  }

  @Test
  void testCombineBlocksNaNs() {
    var pairA1 = Pair.of(1.0, new Complex(2.0, 3.0));
    var pairA2 = Pair.of(4.0, new Complex(5.0, 6.0));
    var pairA3 = Pair.of(7.0, new Complex(8.0, 9.0));
    var blockA = List.of(pairA1, pairA2, pairA3);

    var pairB1 = Pair.of(1.0, new Complex(2.0, Double.NaN));
    var pairB2 = Pair.of(4.0, new Complex(Double.NaN, 6.0));
    var pairB3 = Pair.of(7.0, Complex.NaN);
    var blockB = List.of(pairB1, pairB2, pairB3);

    var result = FrequencyAmplitudePhaseUtility.consolidateDataBlocks(List.of(blockA, blockB));
    var expected = List.of();

    assertArrayEquals(expected.toArray(), result.toArray());
  }

  @Test
  void testCombineBlocksMismatch() {
    var pairA1 = Pair.of(1.0, new Complex(2.0, 3.0));
    var pairA2 = Pair.of(4.0, new Complex(5.0, 6.0));
    var pairA3 = Pair.of(7.0, new Complex(8.0, 9.0));
    var blockA = List.of(pairA1, pairA2, pairA3);

    var pairB3 = Pair.of(8.0, new Complex(8.0, 9.0));
    var blockB = List.of(pairA1, pairA2, pairB3);

    var dataBlocks = List.of(blockA, blockB);
    assertThrows(
        IllegalStateException.class,
        () -> FrequencyAmplitudePhaseUtility.consolidateDataBlocks(dataBlocks));
  }

  @Test
  void testConstructFrequencyAmplitudePhase() {
    var input1 = Pair.of(25.0, new Complex(0.0, -1.0));
    var input2 = Pair.of(11.0, new Complex(2.0, 0.0));
    var input3 = Pair.of(16.0, new Complex(0.0, 2.0));
    var input4 = Pair.of(21.0, new Complex(-2.0, 0.0));
    var input5 = Pair.of(26.0, new Complex(2.0, 2.0));
    var input6 = Pair.of(31.0, new Complex(-1.0, 1.0));
    var input7 = Pair.of(36.0, new Complex(-1.0, -1.0));
    var input8 = Pair.of(41.0, new Complex(2.0, -2.0));

    var dataBlock = List.of(input1, input2, input3, input4, input5, input6, input7, input8);
    var ncalib = 0.5;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");
    var channelDataType = ChannelDataType.SEISMIC;

    var result =
        FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
            dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType);
    var expected =
        List.of(
            Pair.of(11.0, Pair.of(4.0, 0.0)),
            Pair.of(16.0, Pair.of(4.0, 90.0)),
            Pair.of(21.0, Pair.of(4.0, 180.0)),
            Pair.of(25.0, Pair.of(2.0, 270.0)),
            Pair.of(26.0, Pair.of(4.0 * Math.sqrt(2.0), 45.0)),
            Pair.of(31.0, Pair.of(2.0 * Math.sqrt(2.0), 135.0)),
            Pair.of(36.0, Pair.of(2.0 * Math.sqrt(2.0), 225.0)),
            Pair.of(41.0, Pair.of(4.0 * Math.sqrt(2.0), 315.0)));

    for (var i = 0; i < expected.size(); i++) {
      var data = result.getData().get();
      assertTrue(fuzzyEquals(data.getFrequencies().get(i), expected.get(i).getLeft()));
      assertTrue(
          fuzzyEquals(
              data.getAmplitudePhaseResponses().get(i).getAmplitude().getValue(),
              expected.get(i).getRight().getLeft()));
      assertTrue(
          fuzzyEquals(
              data.getAmplitudePhaseResponses().get(i).getPhase().getValue(),
              expected.get(i).getRight().getRight()));
    }
  }

  @Test
  void testConstructFrequencyAmplitudePhaseCalFreqAtStart() {
    var input1 = Pair.of(11.0, new Complex(1.0, 0.0));
    var input2 = Pair.of(16.0, new Complex(-1.0, 0.0));
    var input3 = Pair.of(21.0, new Complex(0.0, 2.0));

    var dataBlock = List.of(input1, input2, input3);
    var ncalib = 1.0;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");
    var channelDataType = ChannelDataType.SEISMIC;

    var result =
        FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
            dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType);
    var expected =
        List.of(
            Pair.of(11.0, Pair.of(1.0, 0.0)),
            Pair.of(16.0, Pair.of(1.0, 180.0)),
            Pair.of(21.0, Pair.of(2.0, 90.0)));

    for (var i = 0; i < expected.size(); i++) {
      var data = result.getData().get();
      assertTrue(fuzzyEquals(data.getFrequencies().get(i), expected.get(i).getLeft()));
      assertTrue(
          fuzzyEquals(
              data.getAmplitudePhaseResponses().get(i).getAmplitude().getValue(),
              expected.get(i).getRight().getLeft()));
      assertTrue(
          fuzzyEquals(
              data.getAmplitudePhaseResponses().get(i).getPhase().getValue(),
              expected.get(i).getRight().getRight()));
    }
  }

  @Test
  void testConstructFrequencyAmplitudePhaseCalFreqAtEnd() {
    var input1 = Pair.of(21.0, new Complex(0.0, 2.0));
    var input2 = Pair.of(11.0, new Complex(1.0, 0.0));
    var input3 = Pair.of(16.0, new Complex(-1.0, 0.0));

    var dataBlock = List.of(input1, input2, input3);
    var ncalib = 1.0;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");
    var channelDataType = ChannelDataType.SEISMIC;

    var result =
        FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
            dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType);
    var expected =
        List.of(
            Pair.of(11.0, Pair.of(0.5, 0.0)),
            Pair.of(16.0, Pair.of(0.5, 180.0)),
            Pair.of(21.0, Pair.of(1.0, 90.0)));

    for (var i = 0; i < expected.size(); i++) {
      var data = result.getData().get();
      assertTrue(fuzzyEquals(data.getFrequencies().get(i), expected.get(i).getLeft()));
      assertTrue(
          fuzzyEquals(
              data.getAmplitudePhaseResponses().get(i).getAmplitude().getValue(),
              expected.get(i).getRight().getLeft()));
      assertTrue(
          fuzzyEquals(
              data.getAmplitudePhaseResponses().get(i).getPhase().getValue(),
              expected.get(i).getRight().getRight()));
    }
  }

  @Test
  void testConstructFrequencyAmplitudePhaseSingleEntry() {
    var input1 = Pair.of(25.0, new Complex(0.0, -1.0));
    var dataBlock = List.of(input1);
    var ncalib = 2;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");
    var channelDataType = ChannelDataType.SEISMIC;

    var result =
        FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
            dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType);
    var data = result.getData().get();
    assertTrue(fuzzyEquals(data.getFrequencies().get(0), input1.getLeft()));
    assertTrue(
        fuzzyEquals(
            data.getAmplitudePhaseResponses().get(0).getAmplitude().getValue(), 1.0 / ncalib));
    assertTrue(fuzzyEquals(data.getAmplitudePhaseResponses().get(0).getPhase().getValue(), 270.0));
  }

  @Test
  void testConstructFrequencyAmplitudePhaseEmptyBlock() {
    List<Pair<Double, Complex>> dataBlock = List.of();
    var ncalib = 2;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");
    var channelDataType = ChannelDataType.SEISMIC;

    assertThrows(
        IllegalStateException.class,
        () ->
            FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
                dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType));
  }

  @Test
  void testConstructFrequencyAmplitudePhaseDeleteEntries() {
    var input1 = Pair.of(25.0, new Complex(0.0, -1.0));
    var input2 = Pair.of(25.0 - 1E-12, new Complex(0.0, -1.0));
    var input3 = Pair.of(25.0 + 1E-12, new Complex(0.0, -1.0));
    var dataBlock = List.of(input1, input2, input3);
    var ncalib = 2;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");
    var channelDataType = ChannelDataType.SEISMIC;

    var result =
        FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
            dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType);
    var data = result.getData().get();
    assertEquals(1, data.getFrequencies().size());
    assertTrue(fuzzyEquals(data.getFrequencies().get(0), input1.getLeft()));
    assertTrue(
        fuzzyEquals(
            data.getAmplitudePhaseResponses().get(0).getAmplitude().getValue(), 1.0 / ncalib));
    assertTrue(fuzzyEquals(data.getAmplitudePhaseResponses().get(0).getPhase().getValue(), 270.0));
  }

  @ParameterizedTest
  @MethodSource("getConstructFrequencyAmplitudePhaseAmplitudeUnitsArguments")
  void testConstructFrequencyAmplitudePhaseAmplitudeUnits(
      ChannelDataType channelDataType, Units expectedUnits) {
    var input1 = Pair.of(25.0, new Complex(0.0, -1.0));
    var dataBlock = List.of(input1);
    var ncalib = 2;
    var ncalibPeriod = 2.0;
    var sampleRate = 10.0;
    var id = UUID.fromString("00000000-000-0000-0000-000000000001");

    var result =
        FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
            dataBlock, ncalib, ncalibPeriod, sampleRate, id, channelDataType);
    var ampUnits =
        result.getData().get().getAmplitudePhaseResponses().get(0).getAmplitude().getUnits();
    assertEquals(expectedUnits, ampUnits);
  }

  private static Stream<Arguments> getConstructFrequencyAmplitudePhaseAmplitudeUnitsArguments() {
    return Stream.of(
        arguments(ChannelDataType.SEISMIC, Units.COUNTS_PER_NANOMETER),
        arguments(ChannelDataType.HYDROACOUSTIC, Units.COUNTS_PER_PASCAL),
        arguments(ChannelDataType.INFRASOUND, Units.COUNTS_PER_PASCAL),
        arguments(ChannelDataType.WEATHER, Units.UNITLESS));
  }

  private static boolean fuzzyEquals(double a, double b) {
    return Math.abs(a - b) <= TOLERANCE;
  }

  /**
   * These frequency values were generated by an accepted python implementation of the interpolation
   * algorithm and provided by the SME team as a truth set for testing.
   */
  private static class TestFixtures {
    private static final List<Double> LOG_FREQS =
        List.of(
            0.020000000000000004,
            0.021117963888671577,
            0.022298419940161834,
            0.023544861353538598,
            0.02486097659139035,
            0.026250660294704537,
            0.027718024807867753,
            0.0292674123478927,
            0.030903407853882944,
            0.032630852554759476,
            0.034454858295398856,
            0.036380822663576465,
            0.0384144449624786,
            0.04056174307604924,
            0.0428290712770791,
            0.04522313903073489,
            0.04775103084917167,
            0.05042022725598248,
            0.05323862692252264,
            0.056214570041614564,
            0.05935686300780076,
            0.0626748044771781,
            0.06617821288392993,
            0.0698774554949826,
            0.07378347908876488,
            0.07790784234885455,
            0.08226275006837144,
            0.08686108926633417,
            0.09171646732285614,
            0.09684325224603016,
            0.10225661518965884,
            0.10797257534765005,
            0.1140080473579272,
            0.12038089135613327,
            0.12710996582724596,
            0.13421518341150288,
            0.1417175698297775,
            0.1496393261027767,
            0.15800389424817937,
            0.16683602665012676,
            0.17616185930634123,
            0.18600898916962783,
            0.19640655581262517,
            0.2073853276574688,
            0.2189777930255374,
            0.23121825627671486,
            0.24414293932266382,
            0.25779008881450743,
            0.2722000893221103,
            0.2874155828398751,
            0.3034815949726988,
            0.3204456681754954,
            0.3383580024405673,
            0.3572716038491474,
            0.37724244142670355,
            0.3983296127661713,
            0.42059551890922686,
            0.44410604900310696,
            0.468930775279411,
            0.49514315893186833,
            0.5228207675022982,
            0.5520455044180546,
            0.5829038513601983,
            0.6154871241796125,
            0.6498917431183686,
            0.6862195181359765,
            0.7245779501848579,
            0.7650805493265754,
            0.8078471706301815,
            0.8530043688466837,
            0.9006857729091677,
            0.9510324813668025,
            1.0041934799228933,
            1.060326082312555,
            1.119596395824657,
            1.1821798128455976,
            1.2482615298794926,
            1.3180370955806526,
            1.39171298942009,
            1.469507232698431,
            1.5516500337133583,
            1.6383844689907363,
            1.729967202595336,
            1.8266692456497253,
            1.928776758308892,
            2.03659189656381,
            2.1504337063797845,
            2.270639067815523,
            2.397563691916755,
            2.5315831733344063,
            2.673094101782229,
            2.822515235622907,
            2.9802887410554946,
            3.14688150057122,
            3.322786494549582,
            3.5085242600831834,
            3.704644431348241,
            3.9117273660790195,
            4.130385862959255,
            4.361266975012656,
            4.605053924358659,
            4.862468123999573,
            5.134271312621985,
            5.421267808729674,
            5.724306890778546,
            6.044285310356759,
            6.382149945847105,
            6.7389006044243205,
            7.115592980678992,
            7.513341780623193,
            7.933324020322399,
            8.37678250891496,
            8.845029526326089,
            9.339450706559418,
            9.8615091380575,
            10.412749693265152,
            10.994803600207472,
            11.60939326961088,
            12.25833739185147,
            12.94355631881359,
            13.667077746584608,
            14.43104271580203,
            15.237711947409212,
            16.089472532568372,
            16.9888449965276,
            17.93849075734543,
            18.94122000154448,
            20.000000000000004);

    private static final List<Double> LINEAR_FREQS =
        List.of(
            0.02,
            0.17732283464566928,
            0.3346456692913386,
            0.49196850393700786,
            0.6492913385826772,
            0.8066141732283465,
            0.9639370078740157,
            1.1212598425196851,
            1.2785826771653543,
            1.4359055118110235,
            1.593228346456693,
            1.7505511811023622,
            1.9078740157480314,
            2.0651968503937006,
            2.2225196850393703,
            2.3798425196850395,
            2.5371653543307087,
            2.694488188976378,
            2.851811023622047,
            3.0091338582677167,
            3.166456692913386,
            3.323779527559055,
            3.4811023622047244,
            3.6384251968503936,
            3.7957480314960628,
            3.9530708661417324,
            4.110393700787401,
            4.26771653543307,
            4.42503937007874,
            4.582362204724409,
            4.7396850393700785,
            4.897007874015747,
            5.054330708661417,
            5.2116535433070865,
            5.368976377952755,
            5.526299212598425,
            5.683622047244094,
            5.840944881889763,
            5.998267716535433,
            6.155590551181102,
            6.312913385826771,
            6.47023622047244,
            6.62755905511811,
            6.7848818897637795,
            6.942204724409448,
            7.099527559055118,
            7.256850393700787,
            7.414173228346456,
            7.571496062992125,
            7.728818897637795,
            7.886141732283464,
            8.043464566929133,
            8.200787401574802,
            8.358110236220472,
            8.515433070866141,
            8.67275590551181,
            8.83007874015748,
            8.98740157480315,
            9.144724409448818,
            9.302047244094489,
            9.459370078740157,
            9.616692913385826,
            9.774015748031495,
            9.931338582677165,
            10.088661417322834,
            10.245984251968503,
            10.403307086614173,
            10.560629921259842,
            10.717952755905511,
            10.87527559055118,
            11.03259842519685,
            11.189921259842519,
            11.347244094488188,
            11.504566929133858,
            11.661889763779527,
            11.819212598425196,
            11.976535433070866,
            12.133858267716535,
            12.291181102362204,
            12.448503937007873,
            12.605826771653543,
            12.763149606299212,
            12.92047244094488,
            13.077795275590551,
            13.23511811023622,
            13.392440944881889,
            13.54976377952756,
            13.707086614173228,
            13.864409448818897,
            14.021732283464566,
            14.179055118110236,
            14.336377952755905,
            14.493700787401574,
            14.651023622047244,
            14.808346456692913,
            14.965669291338582,
            15.12299212598425,
            15.280314960629921,
            15.43763779527559,
            15.594960629921259,
            15.75228346456693,
            15.909606299212598,
            16.066929133858267,
            16.224251968503935,
            16.381574803149604,
            16.538897637795277,
            16.696220472440945,
            16.853543307086614,
            17.010866141732283,
            17.16818897637795,
            17.32551181102362,
            17.48283464566929,
            17.64015748031496,
            17.79748031496063,
            17.9548031496063,
            18.112125984251968,
            18.269448818897636,
            18.426771653543305,
            18.584094488188978,
            18.741417322834646,
            18.898740157480315,
            19.056062992125984,
            19.213385826771653,
            19.37070866141732,
            19.52803149606299,
            19.685354330708662,
            19.84267716535433,
            20.0);

    private static final List<Double> HALF_RANGE =
        List.of(
            0.020000000000000004,
            0.02100301913217996,
            0.022056340633335867,
            0.02316248721539157,
            0.02432410810668714,
            0.02554398539689818,
            0.026825040700158894,
            0.028170342152347164,
            0.029583111759290133,
            0.031066733113489425,
            0.03262475949784735,
            0.03426092239580288,
            0.03597914042825903,
            0.03778352873870569,
            0.03967840884901534,
            0.04166831900951639,
            0.043758025068132526,
            0.045952531884619875,
            0.04825709531723901,
            0.05067723481057014,
            0.053218746614619034,
            0.055887717666874046,
            0.05869054017056137,
            0.061633926904013835,
            0.06472492729781917,
            0.06797094431825264,
            0.07137975219742994,
            0.07495951505264427,
            0.07871880643948095,
            0.08266662988553945,
            0.08681244045394122,
            0.09116616738826805,
            0.09573823789316571,
            0.10053960210756775,
            0.10558175933035029,
            0.11087678556122833,
            0.11643736242285462,
            0.12227680753338936,
            0.12840910640228315,
            0.13484894592566424,
            0.14161174956155131,
            0.14871371426913693,
            0.1561718493006113,
            0.1640040169384332,
            0.1722289752756139,
            0.18086642314147336,
            0.18993704728046604,
            0.19946257189706987,
            0.20946581068539888,
            0.21997072146815086,
            0.23100246357575005,
            0.24258745810310908,
            0.2547534511883252,
            0.2675295804648633,
            0.2809464448463801,
            0.2950361778113231,
            0.3098325243628233,
            0.32537092184819955,
            0.34168858483163805,
            0.3588245942233194,
            0.37681999087845436,
            0.39571787389040264,
            0.4155635038132851,
            0.4364044110613083,
            0.4582905097444192,
            0.48127421721292707,
            0.505410579597402,
            0.5307574036445197,
            0.5573753951646003,
            0.5853283044224232,
            0.6146830788195304,
            0.6455100232336937,
            0.6778829683995597,
            0.7118794477337447,
            0.7475808830278771,
            0.7850727794543244,
            0.8244449303516436,
            0.865791632280217,
            0.9092119108631357,
            0.9548097579532168,
            1.0026943806941764,
            1.052980463072456,
            1.1057884405861251,
            1.1612447886886912,
            1.219482325698642,
            1.2806405309001943,
            1.344865878597094,
            1.4123121889195385,
            1.483140996224401,
            1.5575219359710768,
            1.6356331509995246,
            1.71766171818354,
            1.8038040964810995,
            1.8942665974548556,
            1.989265879389688,
            2.089029466190719,
            2.1937962923045675,
            2.3038172749689143,
            2.41935591516094,
            2.5406889286838985,
            2.668106908903286,
            2.801915022719862,
            2.942433741446385,
            3.0899996083385135,
            3.2449660446181188,
            3.4077041959194334,
            3.578603821185289,
            3.758074226142346,
            3.946545243591004,
            4.144468262857783,
            4.3523173108757325,
            4.570590187482051,
            4.799809657651974,
            5.040524703524327,
            5.293311839217358,
            5.558776491583842,
            5.837554450212375,
            6.130313390147638,
            6.43775447097649,
            6.760614016109813,
            7.09966527628192,
            7.455720281491143,
            7.82963178581703,
            8.22229530977197,
            8.63465128507871,
            9.06768730701052,
            9.522440499688365,
            10.0);
  }
}
