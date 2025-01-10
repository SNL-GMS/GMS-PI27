package gms.shared.waveform.coi.fk;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.fk.FkSpectrum.FkAttributes;
import java.util.Optional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class FkSpectrumTest {

  private static double[][] arr;

  private static DoubleValue slowness;
  private static DoubleValue receiverToSourceAzimuth;
  private static FkAttributes fkAttributes;

  @BeforeAll
  static void setup() {
    arr = new double[2][2];
    arr[0][0] = 22.32;

    slowness = DoubleValue.from(1.2, Optional.of(3.2), Units.SECONDS_PER_KILOMETER);
    receiverToSourceAzimuth = DoubleValue.from(54.3, Optional.of(2.7), Units.RADIANS);

    fkAttributes = new FkAttributes(0, slowness, receiverToSourceAzimuth);
  }

  @Test
  void testEquality() {

    var spectrum = new FkSpectrum(arr, arr, 3.14, fkAttributes);
    var spectrum2 = new FkSpectrum(arr, arr, 3.14, fkAttributes);
    assertEquals(spectrum, spectrum2);
  }

  @Test
  void testSerializes() {

    var spectrum = new FkSpectrum(arr, arr, 3.14, fkAttributes);
    JsonTestUtilities.assertSerializes(spectrum, FkSpectrum.class);
  }

  @Test
  void testSerializesNoAttributes() {

    var spectrum = new FkSpectrum(arr, arr, null, null);
    JsonTestUtilities.assertSerializes(spectrum, FkSpectrum.class);
  }

  @Test
  void testRowColumn() {

    var arr2 = new double[2][4];
    var arr3 = new double[4][2];

    assertThrows(
        IllegalArgumentException.class, () -> new FkSpectrum(arr2, arr, 3.14, fkAttributes));
    assertThrows(
        IllegalArgumentException.class, () -> new FkSpectrum(arr3, arr, 3.14, fkAttributes));
  }

  @Test
  void testNegativeValues() {

    var negVal = DoubleValue.from(1.2, Optional.of(-3.2), Units.SECONDS_PER_KILOMETER);
    assertThrows(
        IllegalArgumentException.class, () -> new FkAttributes(0, negVal, receiverToSourceAzimuth));

    assertThrows(IllegalArgumentException.class, () -> new FkAttributes(0, slowness, negVal));
    var negVal2 = DoubleValue.from(-1.2, Optional.of(3.2), Units.SECONDS_PER_KILOMETER);
    assertThrows(IllegalArgumentException.class, () -> new FkAttributes(0, slowness, negVal2));
  }
}
