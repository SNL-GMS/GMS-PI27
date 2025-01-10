#include "BeamProviderTest.hh"

void BeamProviderTest::SetUp() {
    data = GmsTestUtils::FileLoader::getJson("beamformingData.json");
};

BeamDefinition BeamProviderTest::buildBeamDefinition(std::string dataSet) {
    BeamSummationType beamSummation = BeamSummationType::COHERENT;
    BeamType beamType = BeamType::EVENT;

    SamplingType samplingType = SamplingType::NEAREST_SAMPLE;
    bool twoDimensional = false;
    BeamDescription beamDescription = BeamDescription::Builder()
        .beamSummation(beamSummation)
        .beamType(beamType)
        .phase("P")
        .samplingType(samplingType)
        .twoDimensional(twoDimensional)
        .build();
    int minWaveformsToBeam = 2;
    double horizontalAngleDeg = 1.0;
    double verticalAngleDeg = 1.0;
    auto orientationAngles = OrientationAngles(horizontalAngleDeg, verticalAngleDeg);
    double receiverToSourceAzimuthDeg = data[dataSet]["beam"]["azimuthDeg"].asDouble();
    double slownessSecPerDeg = data[dataSet]["beam"]["slownessSecPerKm"].asDouble() * KM_PER_DEGREE;
    double sampleRateHz = 40.0;
    double orientationAngleToleranceDeg = 5.0;
    double sampleRateToleranceHz = 0.001;

    BeamParameters beamParameters = BeamParameters::Builder()
        .minWaveformsToBeam(minWaveformsToBeam)
        .orientationAngles(orientationAngles)
        .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
        .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
        .sampleRateHz(sampleRateHz)
        .slownessSecPerDeg(slownessSecPerDeg)
        .sampleRateToleranceHz(sampleRateToleranceHz)
        .build();

    BeamDefinition beamDefinition = BeamDefinition(beamDescription, beamParameters);
    return beamDefinition;
}

std::vector<ChannelSegment> BeamProviderTest::buildChannelSegments(std::string dataSet) {
    std::vector<ChannelSegment> channelSegments = {};
    Json::Value channelSegmentData = data[dataSet]["channelSegments"];
    Json::ArrayIndex channelSegmentCount = channelSegmentData.size();
    TimeseriesType timeseriesType = TimeseriesType::WAVEFORM;
    Units channelSegmentUnits = Units::NANOMETERS;
    for (int i = 0; i < channelSegmentCount; i++) {
        std::vector<Waveform> timeseries;
        std::string channelName = channelSegmentData[i]["id"]["channel"]["name"].asString();
        double creationTime = 1702403100.407;
        double startTime = channelSegmentData[i]["id"]["startTime"].asDouble();
        double endTime = channelSegmentData[i]["id"]["endTime"].asDouble();
        Json::ArrayIndex timeseriesCount = channelSegmentData[i]["timeseries"].size();
        for (int j = 0; j < timeseriesCount; j++) {
            Json::ArrayIndex sampleCount = channelSegmentData[i]["timeseries"][j]["sampleCount"].asInt();
            double timeseriesStartTime = channelSegmentData[i]["timeseries"][j]["startTime"].asDouble();
            double timeseriesEndTime = channelSegmentData[i]["timeseries"][j]["endTime"].asDouble();
            double sampleRateHz = channelSegmentData[i]["timeseries"][j]["sampleRateHz"].asDouble();
            std::vector<double> samples{};
            for (int k = 0; k < sampleCount; k++) {
                samples.push_back(channelSegmentData[i]["timeseries"][j]["samples"][k].asDouble());
            }
            Waveform waveform = Waveform(samples, timeseriesStartTime, timeseriesEndTime, sampleRateHz);
            timeseries.push_back(waveform);
        }
        ChannelVersionReference channelVersionReference = ChannelVersionReference(channelName, creationTime);
        auto id = ChannelSegmentDescriptor(channelVersionReference, startTime, endTime, creationTime);

        ChannelSegment channelSegment = ChannelSegment::Builder()
            .timeseriesType(timeseriesType)
            .channelSegmentUnits(channelSegmentUnits)
            .creationTime(creationTime)
            .endTime(endTime)
            .id(id)
            .startTime(startTime)
            .timeseries(timeseries)
            .build();
        channelSegments.push_back(channelSegment);
    }

    return channelSegments;
}

Map<std::string, RelativePosition> BeamProviderTest::buildRelativePositionByChannelMap(std::string dataSet) {
    Map<std::string, RelativePosition> relativePositionsByChannel;
    Json::Value channelSegmentData = data[dataSet]["channelSegments"];
    Json::ArrayIndex channelSegmentCount = channelSegmentData.size();
    for (int i = 0; i < channelSegmentCount; i++) {
        std::string channelName = channelSegmentData[i]["id"]["channel"]["name"].asString();
        int siteStart = channelName.find_first_of('.');
        int siteEnd = channelName.find_first_of('.', siteStart + 1);
        std::string siteName = channelName.substr(siteStart + 1, siteEnd - (siteStart + 1));
        auto relativePosition = RelativePosition(
            data["sites"][siteName]["northOffsetKm"].asDouble(),
            data["sites"][siteName]["eastOffsetKm"].asDouble(),
            data["sites"][siteName]["elevationKm"].asDouble()
        );
        relativePositionsByChannel.add(channelName, relativePosition);
    }
    return relativePositionsByChannel;
}

Map<std::string, std::vector<ProcessingMask>> BeamProviderTest::buildProcessingMasks(std::string dataSet) {
    Map<std::string, std::vector<ProcessingMask>> processingMaskMap;
    Json::Value channelSegmentData = data[dataSet]["channelSegments"];
    for (int i = 0; i < channelSegmentData.size(); i++) {
        std::vector<ProcessingMask> processingMasks;
        std::string channelName = channelSegmentData[i]["id"]["channel"]["name"].asString();
        if (!channelSegmentData[i]["maskedBy"].empty()) {
            Json::Value processingMask = channelSegmentData[i]["maskedBy"];
            int maskStartSample = -1;
            bool previousSampleMasked = false;
            double channelSegmentStartTime = channelSegmentData[i]["id"]["startTime"].asDouble();
            double sampleRate = channelSegmentData[i]["timeseries"][0]["sampleRateHz"].asDouble();
            for (int k = 0; k < processingMask.size(); k++)
            {
                if (processingMask[k].asBool())
                {
                    if (!previousSampleMasked)
                    {
                        maskStartSample = k;
                        previousSampleMasked = true;
                    }
                }
                else
                {
                    if (previousSampleMasked)
                    {
                        auto appliedToRawChannel = Channel(channelName);
                        ProcessingOperation processingOperation = ProcessingOperation::EVENT_BEAM;
                        double effectiveAt = 0;
                        double startTime = channelSegmentStartTime + (maskStartSample / sampleRate);
                        double endTime = channelSegmentStartTime + ((k - 1) / sampleRate);
                        std::vector<QcSegmentVersion> maskedQcSegmentVersions = {};
                        processingMasks.emplace_back(
                            "",
                            appliedToRawChannel,
                            effectiveAt,
                            startTime,
                            endTime,
                            maskedQcSegmentVersions,
                            processingOperation
                        );
                        previousSampleMasked = false;
                    }
                }
            }
        }
        processingMaskMap.add(channelName, processingMasks);
    }
    return processingMaskMap;
}

GmsSigpro::ProcessingChannelSegment BeamProviderTest::buildExpectedBeam(std::string dataSet)
{
    GmsSigpro::ProcessingWaveform beamWaveform;

    beamWaveform.sampleCount = data[dataSet]["beam"]["samples"].size();
    beamWaveform.data = (double*)malloc(beamWaveform.sampleCount * sizeof(double));

    for (int i = 0; i < beamWaveform.sampleCount; i++)
    {
        beamWaveform.data[i] = data[dataSet]["beam"]["samples"][i].asDouble();
    }

    GmsSigpro::ProcessingChannelSegment beam;
    beam.startTime = data[dataSet]["beam"]["startTime"].asDouble();
    beam.endTime = data[dataSet]["beam"]["endTime"].asDouble();
    beam.missingInputChannelCount = 0;
    beam.missingInputChannels = (GmsSigpro::MissingInputChannelTimeRanges*) nullptr;
    beam.waveformCount = 1;
    beam.waveforms = &beamWaveform;

    return beam;
}


TEST_F(BeamProviderTest, INSUFFICIENT_CHANNEL_SEGMENTS_TEST) {

    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<ChannelSegment> channelSegments = buildChannelSegments("raw");
    Map<std::string, RelativePosition> relativePositionsByChannel = buildRelativePositionByChannelMap("raw");
    double startTime = 0.0;
    double endTime = 10.0;
    Map<std::string, std::vector<ProcessingMask>> processingMasks = buildProcessingMasks("raw");
    BeamProvider beamProvider;

    channelSegments.erase(channelSegments.begin() + 1, channelSegments.end());

    EXPECT_THROW({
        beamProvider.maskAndBeamWaveforms(beamDefinition, channelSegments, relativePositionsByChannel, startTime, endTime, 0, processingMasks, maskTaperDefinition);
        }, std::invalid_argument);
}

TEST_F(BeamProviderTest, NULLISH_CHANNEL_SEGMENTS_TEST) {
    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    Map<std::string, RelativePosition> relativePositionsByChannel = buildRelativePositionByChannelMap("raw");
    double startTime = 0.0;
    double endTime = 10.0;
    Map<std::string, std::vector<ProcessingMask>> processingMasks = buildProcessingMasks("raw");
    std::vector<ChannelSegment> channelSegments;
    BeamProvider beamProvider;

    EXPECT_THROW({
    beamProvider.maskAndBeamWaveforms(beamDefinition, channelSegments, relativePositionsByChannel, startTime, endTime, 0, processingMasks, maskTaperDefinition);
        }, std::invalid_argument);
}

TEST_F(BeamProviderTest, RAW_INPUT_CHANNELS_NO_GAPS_BEAM_TEST) {
    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<ChannelSegment> channelSegments = buildChannelSegments("raw");
    Map<std::string, RelativePosition> relativePositionsByChannel = buildRelativePositionByChannelMap("raw");
    double startTime = data["raw"]["beam"]["startTime"].asDouble();
    double endTime = data["raw"]["beam"]["endTime"].asDouble();
    Map<std::string, std::vector<ProcessingMask>> processingMasks = buildProcessingMasks("raw");
    BeamProvider beamProvider;

    TimeseriesWithMissingInputChannels actual = beamProvider.maskAndBeamWaveforms(beamDefinition, channelSegments, relativePositionsByChannel, startTime, endTime, 0, processingMasks, maskTaperDefinition);
    GmsSigpro::ProcessingChannelSegment expected = buildExpectedBeam("raw");

    ASSERT_EQ(actual.timeseries.size(), expected.waveformCount);

    for (int i = 0; i < actual.timeseries.size(); i++)
    {
        ASSERT_FLOAT_EQ(actual.timeseries[i].startTime, expected.startTime);
        ASSERT_FLOAT_EQ(actual.timeseries[i].endTime, expected.endTime);
        ASSERT_EQ(actual.missingInputChannels.size(), 0);
        for (int j = 0; j < actual.timeseries[i].sampleCount; j++)
        {
            double expectedValue = data["raw"]["beam"]["samples"][j].asDouble();
            ASSERT_NEAR(actual.timeseries[i].samples[j], expectedValue, error);
        }
    }
}

TEST_F(BeamProviderTest, MASKED_INPUT_CHANNELS_NO_GAPS_BEAM_TEST) {
    BeamDefinition beamDefinition = buildBeamDefinition("mask");
    std::vector<ChannelSegment> channelSegments = buildChannelSegments("mask");
    Map<std::string, RelativePosition> relativePositionsByChannel = buildRelativePositionByChannelMap("mask");
    double startTime = data["mask"]["beam"]["startTime"].asDouble();
    double endTime = data["mask"]["beam"]["endTime"].asDouble();
    Map<std::string, std::vector<ProcessingMask>> processingMasks = buildProcessingMasks("mask");
    BeamProvider beamProvider;

    TimeseriesWithMissingInputChannels actual = beamProvider.maskAndBeamWaveforms(beamDefinition, channelSegments, relativePositionsByChannel, startTime, endTime, 0, processingMasks, maskTaperDefinition);
    GmsSigpro::ProcessingChannelSegment expected = buildExpectedBeam("mask");

    ASSERT_EQ(actual.timeseries.size(), expected.waveformCount);

    for (int i = 0; i < actual.timeseries.size(); i++)
    {
        ASSERT_FLOAT_EQ(actual.timeseries[i].startTime, expected.startTime);
        ASSERT_FLOAT_EQ(actual.timeseries[i].endTime, expected.endTime);
        ASSERT_EQ(actual.missingInputChannels.size(), 0);
        for (int j = 0; j < actual.timeseries[i].sampleCount; j++)
        {
            double expectedValue = data["mask"]["beam"]["samples"][j].asDouble();
            ASSERT_NEAR(actual.timeseries[i].samples[j], expectedValue, error);
        }
    }
}


TEST_F(BeamProviderTest, BASIC_PERFORMANCE_TEST) {
    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<ChannelSegment> channelSegments = buildChannelSegments("raw");
    Map<std::string, RelativePosition> relativePositionsByChannel = buildRelativePositionByChannelMap("raw");
    Map<std::string, std::vector<ProcessingMask>> processingMasks = buildProcessingMasks("raw");
    double startTime = data["raw"]["beam"]["startTime"].asDouble();
    double endTime = data["raw"]["beam"]["endTime"].asDouble();
    BeamProvider beamProvider;

    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 10; ++i) {
        EXPECT_NO_THROW({
        TimeseriesWithMissingInputChannels result = beamProvider.maskAndBeamWaveforms(
            beamDefinition, channelSegments, relativePositionsByChannel, startTime, endTime, 0, processingMasks, maskTaperDefinition);
            });
    }
    auto stop = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(stop - start);
    ASSERT_LT(duration.count(), 5000);
}
