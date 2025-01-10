package gms.shared.signalfeaturemeasurement.controller;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.BDDMockito.given;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Table;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementConditioningTemplateRequest;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementTypeRequest;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplate;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplateByStationByType;
import gms.shared.signalfeaturemeasurement.service.SignalFeatureMeasurementConfigurationService;
import gms.shared.spring.utilities.framework.SpringTestBase;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

@WebMvcTest(SignalFeatureMeasurementConfigurationController.class)
@Import(SignalFeatureMeasurementConfigurationControllerTestConfig.class)
class SignalFeatureMeasurementConfigurationControllerTest extends SpringTestBase {

  private static final String DEFAULT_STATIONS__BY_AMPLITUDE_TYPE_URL =
      "/signal-feature-measurement-configuration/default-stations-by-amplitude-type";
  private static final String AMPLITUDE_MEASUREMENT_DEFINITION_URL =
      "/signal-feature-measurement-configuration/amplitude-measurement-definition";
  private static final String AMPLITUDE_MEASUREMENT_CONDITIONING_TEMPLATE_URL =
      "/signal-feature-measurement-configuration/amplitude-measurement-conditioning-template";

  private static final String EMPTY_STATIONS_LIST_RESPONSE_MSG =
      "{\"errorMessage\":\"Provided Stations List must not be empty\"}";
  private static final String EMPTY_MEASUREMENT_LIST_RESPONSE_MSG =
      "{\"errorMessage\":\"Provided AmplitudeMeasurementTypes List must not be empty\"}";

  private AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest;
  private AmplitudeMeasurementTypeRequest incorrectAmplitudeMeasurementTypeRequest;
  private AmplitudeMeasurementTypeRequest invalidFeatureMeasurementTypeRequest;
  private AmplitudeMeasurementConditioningTemplate amcTemplate;

  @MockBean
  private SignalFeatureMeasurementConfigurationService signalFeatureMeasurementConfigurationService;

  @BeforeEach
  void setup() {
    amplitudeMeasurementTypeRequest =
        new AmplitudeMeasurementTypeRequest(
            ImmutableList.of(FeatureMeasurementTypes.AMPLITUDE_ALR_OVER_2));

    incorrectAmplitudeMeasurementTypeRequest =
        new AmplitudeMeasurementTypeRequest(
            ImmutableList.of(AmplitudeMeasurementType.from("SLOWNESS")));

    invalidFeatureMeasurementTypeRequest =
        new AmplitudeMeasurementTypeRequest(
            ImmutableList.of(AmplitudeMeasurementType.from("BADINPUT")));

    amcTemplate =
        new AmplitudeMeasurementConditioningTemplate(
            FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
            DefaultCoiTestFixtures.getDefaultStation().toEntityReference(),
            Optional.empty(),
            Optional.of(DefaultCoiTestFixtures.getDefaultChannel().toEntityReference()),
            Optional.of(FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL),
            Optional.empty());
  }

  @Test
  void testDefaultStationsByAmplitudeTypeEmptyList() throws Exception {
    MockHttpServletResponse response =
        postResult(
            DEFAULT_STATIONS__BY_AMPLITUDE_TYPE_URL,
            new AmplitudeMeasurementTypeRequest(ImmutableList.of()),
            HttpStatus.BAD_REQUEST);

    Assertions.assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    Assertions.assertEquals(EMPTY_MEASUREMENT_LIST_RESPONSE_MSG, response.getContentAsString());
  }

  @Test
  void testDefaultStationsByAmplitudeTypeSuccess() throws Exception {
    MockHttpServletResponse response =
        postResult(
            DEFAULT_STATIONS__BY_AMPLITUDE_TYPE_URL,
            amplitudeMeasurementTypeRequest,
            HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());
  }

  @Test
  void testDefaultStationsByAmplitudeTypeIncorrectMeasurementType() throws Exception {
    MockHttpServletResponse response =
        postResult(
            DEFAULT_STATIONS__BY_AMPLITUDE_TYPE_URL,
            incorrectAmplitudeMeasurementTypeRequest,
            HttpStatus.BAD_REQUEST);

    Assertions.assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    Assertions.assertEquals(
        "{\"errorMessage\":\"Encountered type [SLOWNESS] that isn't a recognized"
            + " AmplitudeMeasurementType\"}",
        response.getContentAsString());
  }

  @Test
  void testDefaultStationsByAmplitudeTypeInvalidMeasurementType() throws Exception {
    MockHttpServletResponse response =
        postResult(
            DEFAULT_STATIONS__BY_AMPLITUDE_TYPE_URL,
            invalidFeatureMeasurementTypeRequest,
            HttpStatus.BAD_REQUEST);

    Assertions.assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    Assertions.assertEquals(
        "{\"errorMessage\":\"Could not parse request, check your inputs and try again\"}",
        response.getContentAsString());
  }

  @Test
  void testAmplitudeMeasurementDefinitionEmptyList() throws Exception {
    MockHttpServletResponse response =
        postResult(
            AMPLITUDE_MEASUREMENT_DEFINITION_URL,
            new AmplitudeMeasurementTypeRequest(ImmutableList.of()),
            HttpStatus.BAD_REQUEST);

    Assertions.assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    Assertions.assertEquals(EMPTY_MEASUREMENT_LIST_RESPONSE_MSG, response.getContentAsString());
  }

  @Test
  void testAmplitudeMeasurementDefinitionSuccess() throws Exception {
    MockHttpServletResponse response =
        postResult(
            AMPLITUDE_MEASUREMENT_DEFINITION_URL, amplitudeMeasurementTypeRequest, HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());
  }

  @Test
  void testAmplitudeMeasurementConditioningTemplateEmptyStationList() throws Exception {

    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(), ImmutableList.of(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2));
    MockHttpServletResponse response =
        postResult(
            AMPLITUDE_MEASUREMENT_CONDITIONING_TEMPLATE_URL, request, HttpStatus.BAD_REQUEST);

    Assertions.assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    Assertions.assertEquals(EMPTY_STATIONS_LIST_RESPONSE_MSG, response.getContentAsString());
  }

  @Test
  void testAmplitudeMeasurementConditioningTemplateEmptyMeasurementList() throws Exception {

    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(DefaultCoiTestFixtures.getDefaultStation()), ImmutableList.of());

    MockHttpServletResponse response =
        postResult(
            AMPLITUDE_MEASUREMENT_CONDITIONING_TEMPLATE_URL, request, HttpStatus.BAD_REQUEST);

    Assertions.assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatus());
    Assertions.assertEquals(EMPTY_MEASUREMENT_LIST_RESPONSE_MSG, response.getContentAsString());
  }

  @Test
  void testAmplitudeMeasurementConditioningTemplateSuccess() throws Exception {
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(DefaultCoiTestFixtures.getDefaultStation()),
            ImmutableList.of(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2));

    Table<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate> table =
        HashBasedTable.create();

    table.put(
        FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
        DefaultCoiTestFixtures.getDefaultStation().toEntityReference(),
        amcTemplate);

    var output = new AmplitudeMeasurementConditioningTemplateByStationByType(table);

    given(
            signalFeatureMeasurementConfigurationService
                .getAmplitudeMeasurementConditioningTemplates(request))
        .willReturn(output);

    MockHttpServletResponse response =
        postResult(AMPLITUDE_MEASUREMENT_CONDITIONING_TEMPLATE_URL, request, HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());
  }

  @Test
  void testAmplitudeMeasurementConditioningTemplate209Success() throws Exception {
    Station finesStation =
        DefaultCoiTestFixtures.getDefaultStation().toBuilder().setName("FINES").build();
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(DefaultCoiTestFixtures.getDefaultStation(), finesStation),
            ImmutableList.of(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2));

    Table<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate> table =
        HashBasedTable.create();

    table.put(
        FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
        DefaultCoiTestFixtures.getDefaultStation().toEntityReference(),
        amcTemplate);

    var output = new AmplitudeMeasurementConditioningTemplateByStationByType(table);

    given(
            signalFeatureMeasurementConfigurationService
                .getAmplitudeMeasurementConditioningTemplates(request))
        .willReturn(output);

    MockHttpServletResponse response =
        postResult(AMPLITUDE_MEASUREMENT_CONDITIONING_TEMPLATE_URL, request, 209);

    Assertions.assertEquals(209, response.getStatus());
  }

  @Test
  @Disabled("Disabled so it doesn't run in the pipeline. Re-enable locally to generate dump")
  void testDumpAmplitudeMeasurementConditioningTemplateRequestJSON() throws IOException {
    var request =
        new AmplitudeMeasurementConditioningTemplateRequest(
            ImmutableList.of(DefaultCoiTestFixtures.getDefaultStation()),
            ImmutableList.of(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2));
    try (FileOutputStream outputStream =
        new FileOutputStream(
            "build/mock-amplitude-measurement-conditioning-template-request.json")) {
      assertDoesNotThrow(
          () ->
              outputStream.write(
                  ObjectMappers.jsonWriter()
                      .withDefaultPrettyPrinter()
                      .writeValueAsBytes(request)));
    }
  }
}
