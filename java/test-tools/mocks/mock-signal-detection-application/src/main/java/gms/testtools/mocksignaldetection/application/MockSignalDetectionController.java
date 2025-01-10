package gms.testtools.mocksignaldetection.application;

import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.testtools.mocksignaldetection.ChannelSegmentCreator;
import gms.testtools.mocksignaldetection.MockSignalDetectionService;
import gms.testtools.mocksignaldetection.SignalDetectionCreator;
import java.util.List;

public class MockSignalDetectionController implements MockSignalDetectionService {

  private final SignalDetectionCreator signalDetectionCreator;

  private final ChannelSegmentCreator channelSegmentCreator;

  public MockSignalDetectionController(
      SignalDetectionCreator signalDetectionCreator, ChannelSegmentCreator channelSegmentCreator) {
    this.signalDetectionCreator = signalDetectionCreator;
    this.channelSegmentCreator = channelSegmentCreator;
  }

  public static MockSignalDetectionController create() {
    return new MockSignalDetectionController(
        SignalDetectionCreator.create(), ChannelSegmentCreator.create());
  }

  @Override
  public SignalDetectionsWithChannelSegments findDetectionsWithSegmentsByStationsAndTime(
      DetectionsWithSegmentsByStationsAndTimeRequest request) {

    if (request == null) {
      throw new IllegalArgumentException("Request parameter may not be null");
    }

    // Pass in the request time range.
    List<SignalDetection> derivedSignalDetections =
        signalDetectionCreator.createDerivedChannelDetections(
            request.getStartTime(), request.getEndTime(), request.getStations());

    // Create a list of raw channel SDs (no channel segments) and add the derived SDs to it
    List<SignalDetection> rawAndDerivedChannelSignalDetections =
        signalDetectionCreator.createRawChannelDetections(
            request.getStartTime(), request.getEndTime(), request.getStations());
    rawAndDerivedChannelSignalDetections.addAll(derivedSignalDetections);

    // Return the signal detections with the derived SDs have a channel segment set
    return SignalDetectionsWithChannelSegments.builder()
        .setSignalDetections(rawAndDerivedChannelSignalDetections)
        .setChannelSegments(
            channelSegmentCreator.modifyChannelSegments(rawAndDerivedChannelSignalDetections))
        .build();
  }
}
