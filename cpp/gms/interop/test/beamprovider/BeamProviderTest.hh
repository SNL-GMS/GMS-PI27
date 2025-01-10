#ifndef BEAM_PROVIDER_TEST_H
#define BEAM_PROVIDER_TEST_H

#include "gtest/gtest.h"
#include <json/json.h>
#include <cstdlib>
#include <optional>
#include <string>
#include <vector>
#include <memory>
#include <fstream>
#include <chrono>
#include <queue>
#include <thread>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <iostream>

#include "FileLoader.hh"

#include "common/AmplitudeMeasurementValue.hh"
#include "beamprovider/definitions/BeamDefinition.hh"
#include "beamprovider/parameters/BeamParameters.hh"
#include "beamprovider/BeamSummationType.hh"
#include "beamprovider/BeamProvider.hh"
#include "beamprovider/BeamType.hh"
#include "common/Channel.hh"
#include "common/ChannelSegment.hh"
#include "common/ChannelSegmentDescriptor.hh"
#include "common/ChannelVersionReference.hh"
#include "common/DoubleValue.hh"
#include "common/EventHypothesis.hh"
#include "common/EventHypothesisId.hh"
#include "common/EventLocation.hh"
#include "common/FeatureMeasurementType.hh"
#include "common/FeatureMeasurementWrapper.hh"
#include "common/FeaturePrediction.hh"
#include "common/Location.hh"
#include "common/LocationRestraint.hh"
#include "common/LocationSolution.hh"
#include "common/MagnitudeModel.hh"
#include "common/MagnitudeType.hh"
#include "common/NetworkMagnitudeBehavior.hh"
#include "common/NetworkMagnitudeSolution.hh"
#include "common/OrientationAngles.hh"
#include "common/ProcessingMask.hh"
#include "common/ProcessingOperation.hh"
#include "common/QcSegmentVersion.hh"
#include "common/RelativePosition.hh"
#include "common/RestraintType.hh"
#include "common/SamplingType.hh"
#include "common/SignalDetectionHypothesis.hh"
#include "common/SignalDetectionHypothesisId.hh"
#include "common/SignalDetectionHypothesisFaceted.hh"
#include "common/Station.hh"
#include "common/ScalingFactorType.hh"
#include "common/StationMagnitudeSolution.hh"
#include "common/StationVersionReference.hh"
#include "common/TaperFunction.hh"
#include "common/TaperDefinition.hh"
#include "common/TimeRange.hh"
#include "common/TimeRangesByChannel.hh"
#include "common/TimeseriesType.hh"
#include "common/Units.hh"
#include "common/ValueTypeWrapper.hh"
#include "common/Waveform.hh"

extern "C"
{
#include "common/enums.h"
#include "common/structs.h"
#include "beam/structs.h"
#include "beam/beam.h"
}

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class BeamProviderTest : public ::testing::Test
{
public:
    void SetUp() override;
    Json::Value data;
    BeamDefinition buildBeamDefinition(std::string dataSet);
    std::vector<ChannelSegment> buildChannelSegments(std::string dataSet);
    Map<std::string, RelativePosition> buildRelativePositionByChannelMap(std::string dataSet);
    Map<std::string, std::vector<ProcessingMask>> buildProcessingMasks(std::string dataSet);
    GmsSigpro::ProcessingChannelSegment buildExpectedBeam(std::string dataSet);
    TaperDefinition maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 0);
    double error = 0.000001;
};

#endif // BEAM_PROVIDER_TEST_H