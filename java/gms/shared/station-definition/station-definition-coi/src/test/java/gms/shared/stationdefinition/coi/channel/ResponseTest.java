package gms.shared.stationdefinition.coi.channel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.fail;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class ResponseTest {

  private static final Logger LOGGER = LoggerFactory.getLogger(ResponseTest.class);
  private final UUID testUUID = UUID.nameUUIDFromBytes("test".getBytes());

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(UtilsTestFixtures.RESPONSE_1, Response.class);
  }

  @Test
  void testSerializationEntityReference() {
    JsonTestUtilities.assertSerializes(Response.createEntityReference(testUUID), Response.class);
  }

  @Test
  void testDataBuildValidationException() {
    var exceptionString =
        "Either all FacetedDataClass fields must be populated or none of them can be populated";

    // validate builder with unset calibration
    var responseDataBuilder1 =
        Response.Data.builder()
            .setFapResponse(UtilsTestFixtures.fapResponse)
            .setEffectiveUntil(Instant.now().plusSeconds(10));

    var exception = assertThrows(IllegalStateException.class, () -> responseDataBuilder1.build());
    assertEquals(exceptionString, exception.getMessage());

    // validate builder with unset setFapResponse
    var responseDataBuilder2 =
        Response.Data.builder()
            .setCalibration(UtilsTestFixtures.calibration)
            .setEffectiveUntil(Instant.now().plusSeconds(10));

    exception = assertThrows(IllegalStateException.class, () -> responseDataBuilder2.build());
    assertEquals(exceptionString, exception.getMessage());
  }

  @Test
  void testResponseCreate() {
    final Instant now = Instant.now();
    Response response =
        Response.builder()
            .setId(UUID.nameUUIDFromBytes(UtilsTestFixtures.CHANNEL_NAME.getBytes()))
            .setEffectiveAt(now)
            .setData(
                Response.Data.builder()
                    .setCalibration(UtilsTestFixtures.calibration)
                    .setFapResponse(UtilsTestFixtures.fapResponse)
                    .setEffectiveUntil(now.plusSeconds(10))
                    .build())
            .build();

    assertEquals(
        UUID.nameUUIDFromBytes(UtilsTestFixtures.CHANNEL_NAME.getBytes()), response.getId());
    response.getEffectiveAt().ifPresentOrElse(instant -> assertEquals(now, instant), () -> fail());
    Assertions.assertEquals(UtilsTestFixtures.calibration, response.getCalibration());
    Assertions.assertEquals(UtilsTestFixtures.fapResponse, response.getFapResponse());
    Assertions.assertEquals(now.plusSeconds(10), response.getEffectiveUntil().get());
  }

  @Test
  void testResponseCompare() {
    final Instant now = Instant.now();
    Response responseSame =
        Response.builder()
            .setId(UtilsTestFixtures.RESPONSE_1.getId())
            .setEffectiveAt(UtilsTestFixtures.RESPONSE_1.getEffectiveAt())
            .setData(
                Response.Data.builder()
                    .setCalibration(UtilsTestFixtures.RESPONSE_1.getCalibration())
                    .setFapResponse(UtilsTestFixtures.RESPONSE_1.getFapResponse())
                    .build())
            .build();
    Response responseDifferent1 =
        Response.builder()
            .setId(UUID.nameUUIDFromBytes("different".getBytes()))
            .setEffectiveAt(UtilsTestFixtures.RESPONSE_1.getEffectiveAt())
            .setData(
                Response.Data.builder()
                    .setCalibration(UtilsTestFixtures.RESPONSE_1.getCalibration())
                    .setFapResponse(UtilsTestFixtures.RESPONSE_1.getFapResponse())
                    .build())
            .build();
    Response responseDifferent2 =
        Response.builder()
            .setId(UtilsTestFixtures.RESPONSE_1.getId())
            .setEffectiveAt(now)
            .setData(
                Response.Data.builder()
                    .setCalibration(UtilsTestFixtures.RESPONSE_1.getCalibration())
                    .setFapResponse(UtilsTestFixtures.RESPONSE_1.getFapResponse())
                    .build())
            .build();
    Assertions.assertEquals(0, UtilsTestFixtures.RESPONSE_1.compareTo(responseSame));
    Assertions.assertNotEquals(0, UtilsTestFixtures.RESPONSE_1.compareTo(responseDifferent1));
    Assertions.assertNotEquals(0, UtilsTestFixtures.RESPONSE_1.compareTo(responseDifferent2));
  }

  @Test
  void testResponseCreateEntityReferencePresent() {
    Response response = getResponseWithOnlyId(testUUID);
    assertFalse(response.isPresent());
  }

  @Test
  void testResponseCreateEntityReferenceSerializeToAndFrom() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(UtilsTestFixtures.RESPONSE_1, Response.class);
  }

  @Test
  void testResponseCreateEntityReference() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000127");
    var expected = getResponseWithOnlyId(uuid);
    var response = Response.createEntityReference(expected);
    assertEquals(expected, response);
  }

  @Test
  void testResponseCreateVersionReference() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000128");
    var instant = Instant.parse("2019-06-06T17:26:00Z");
    var expected = getResponseWithIdTime(uuid, instant);
    var response = Response.createVersionReference(expected);
    assertEquals(expected, response);
  }

  private Response getResponseWithOnlyId(UUID id) {
    return Response.createEntityReference(id);
  }

  private Response getResponseWithIdTime(UUID id, Instant time) {
    return Response.createVersionReference(id, time);
  }
}
