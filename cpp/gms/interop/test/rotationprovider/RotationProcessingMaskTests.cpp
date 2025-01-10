#include "RotationProcessingMaskTests.hh"

void RotationProcessingMaskTests::SetUp() {
    //ASSEMBLE
    //Load expected values from SME data file
    TEST_RESULTS = GmsTestUtils::FileLoader::getJson("rotation-test-waveform-result.json");

    auto segmentIndex = 0;
    for (auto const& channelJson : TEST_RESULTS["channelSegments"]) {
        for (auto const& ts : channelJson["timeseries"]) {
            std::vector<double> tsData;
            for (auto const& dataPoint : ts["samples"]) {
                tsData.push_back(dataPoint.asDouble());
            }
            auto tsStart = ts["startTime"].asDouble();
            auto tsEnd = ts["endTime"].asDouble();
            auto waveform = Waveform(tsData, tsStart, tsEnd, ts["sampleRateHz"].asDouble());

            if (segmentIndex % 2 == 0) //east channels are first in json outputs
            {
                EXPECTED_EAST = waveform;
            }
            else {
                EXPECTED_NORTH = waveform;
            }
        }
        segmentIndex++;
    }

    ROTATION_DESCRIPTION = RotationDescription(TWO_DIMENSIONAL, PHASE, SAMPLING_TYPE);
    LOCATION = Location(LATITUDE_DEGREES, LONGITUDE_DEGREES, ELEVATION_KM, DEPTH_KM);
    ORIENTATION_ANGLES = OrientationAngles(HORIZONTAL_ANGLE_DEG, VERTICAL_ANGLE_DEG);
    ROTATION_PARAMETERS = RotationParameters::Builder()
        .receiverToSourceAzimuthDeg(RECEIVER_TO_SOURCE_AZIMUTH_DEG)
        .sampleRateHz(SAMPLE_RATE)
        .sampleRateToleranceHz(SAMPLE_RATE_TOLERANCE_HZ)
        .location(LOCATION.value())
        .locationToleranceKm(LOCATION_TOLERANCE_KM)
        .orientationAngles(ORIENTATION_ANGLES.value())
        .orientationAngleToleranceDeg(ORIENTATION_ANGLE_TOLERANCE_DEG)
        .build();

    ROTATION_DEFINITION = RotationDefinition(ROTATION_DESCRIPTION.value(), ROTATION_PARAMETERS.value());

};

TEST_F(RotationProcessingMaskTests, MASK_APPLIED_TO_MIDDLE_THIRD) {

    //ARRANGE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_timeseries = std::vector<Waveform>();
    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> east_samples;
    for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
        auto smp = eastJson.asDouble();
        east_samples.push_back(smp);
    }

    std::vector<double> eSamp1;
    std::vector<double> eSamp2;
    std::vector<double> eSamp3;

    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp1));
    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp2));
    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp3));

    auto eastTestWaveform1 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_startTime, east_endTime, SAMPLE_RATE);
    auto eastTestWaveform2 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime + 1, east_endTime + 4, SAMPLE_RATE);
    auto eastTestWaveform3 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime + 5, east_endTime + 8, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform1);
    east_timeseries.push_back(eastTestWaveform2);
    east_timeseries.push_back(eastTestWaveform3);

    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    auto east_missingInputChannels = TimeRangesByChannel(east_channel, east_timeRange);
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime + 8)
        .id(east_chanSegDesc)
        .startTime(east_startTime)
        .timeseries(east_timeseries)
        .build();

    auto north_channelName = testData["channelSegments"][1]["id"]["channel"]["name"].asString();
    auto north_timeseries = std::vector<Waveform>();
    auto north_creationTime = testData["channelSegments"][1]["id"]["creationTime"].asDouble();
    auto north_startTime = testData["channelSegments"][1]["id"]["startTime"].asDouble();
    auto north_endTime = testData["channelSegments"][1]["id"]["endTime"].asDouble();
    auto north_effectiveAt = testData["channelSegments"][1]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> north_samples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        north_samples.push_back(smp);
    }
    std::vector<double> nSamp1;
    std::vector<double> nSamp2;
    std::vector<double> nSamp3;

    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp1));
    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp2));
    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp3));

    auto northTestWaveform1 = Waveform(nSamp1, north_startTime, north_endTime, SAMPLE_RATE);
    auto northTestWaveform2 = Waveform(nSamp2, north_endTime + 1, north_endTime + 4, SAMPLE_RATE);
    auto northTestWaveform3 = Waveform(nSamp3, north_endTime + 5, north_endTime + 8, SAMPLE_RATE);

    north_timeseries.push_back(northTestWaveform1);
    north_timeseries.push_back(northTestWaveform2);
    north_timeseries.push_back(northTestWaveform3);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime + 7, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    auto north_missingInputChannels = TimeRangesByChannel(north_channel, north_timeRange);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime + 8)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };

    // create a processing mask that elides the middle waveform
    auto mask_id = "some_guid";
    auto mask_effectiveAt = north_startTime;
    auto mask_startTime = north_startTime + 4;
    auto mask_endTime = north_startTime + 7;
    auto mask_processingOperation = ProcessingOperation::ROTATION;
    auto mask_appliedToRawChannel = Channel(north_channelName);
    auto mask_maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto processingMask = ProcessingMask(mask_id, mask_appliedToRawChannel, mask_effectiveAt, mask_startTime, mask_endTime, mask_maskedQcSegmentVersions, mask_processingOperation);
    auto processingMasks = std::vector<ProcessingMask>{ processingMask };
    Map<std::string, std::vector<ProcessingMask>> processingMaskMap;
    processingMaskMap.add(northSegment.id.channel.name, processingMasks);
    std::optional<TaperDefinition> maskTaperDefinition;
    maskTaperDefinition.emplace(TaperDefinition(TaperFunction::COSINE, 1));

    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime + 8, processingMaskMap, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;

    //ASSERT
    EXPECT_EQ(radialWaveforms.size(), 2);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(0).startTime, north_startTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(0).endTime, north_endTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(1).startTime, north_endTime + 5);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(1).endTime, north_endTime + 8);

    EXPECT_EQ(transverseWaveforms.size(), 2);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(0).startTime, east_startTime);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(0).endTime, east_endTime);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(1).startTime, east_endTime + 5);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(1).endTime, east_endTime + 8);

    GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(0).samples, &EXPECTED_NORTH.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(1).samples, &EXPECTED_NORTH.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(0).samples, &EXPECTED_EAST.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(1).samples, &EXPECTED_EAST.value().samples);
};


TEST_F(RotationProcessingMaskTests, MISSING_TAPER_DEFINITION) {

    //ARRANGE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_timeseries = std::vector<Waveform>();
    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> east_samples;
    for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
        auto smp = eastJson.asDouble();
        east_samples.push_back(smp);
    }

    std::vector<double> eSamp1;
    std::vector<double> eSamp2;
    std::vector<double> eSamp3;

    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp1));
    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp2));
    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp3));

    auto eastTestWaveform1 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_startTime, east_endTime, SAMPLE_RATE);
    auto eastTestWaveform2 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime + 1, east_endTime + 4, SAMPLE_RATE);
    auto eastTestWaveform3 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime + 5, east_endTime + 8, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform1);
    east_timeseries.push_back(eastTestWaveform2);
    east_timeseries.push_back(eastTestWaveform3);

    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    auto east_missingInputChannels = TimeRangesByChannel(east_channel, east_timeRange);
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime + 8)
        .id(east_chanSegDesc)
        .startTime(east_startTime)
        .timeseries(east_timeseries)
        .build();

    auto north_channelName = testData["channelSegments"][1]["id"]["channel"]["name"].asString();
    auto north_timeseries = std::vector<Waveform>();
    auto north_creationTime = testData["channelSegments"][1]["id"]["creationTime"].asDouble();
    auto north_startTime = testData["channelSegments"][1]["id"]["startTime"].asDouble();
    auto north_endTime = testData["channelSegments"][1]["id"]["endTime"].asDouble();
    auto north_effectiveAt = testData["channelSegments"][1]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> north_samples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        north_samples.push_back(smp);
    }
    std::vector<double> nSamp1;
    std::vector<double> nSamp2;
    std::vector<double> nSamp3;

    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp1));
    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp2));
    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp3));

    auto northTestWaveform1 = Waveform(nSamp1, north_startTime, north_endTime, SAMPLE_RATE);
    auto northTestWaveform2 = Waveform(nSamp2, north_endTime + 1, north_endTime + 4, SAMPLE_RATE);
    auto northTestWaveform3 = Waveform(nSamp3, north_endTime + 5, north_endTime + 8, SAMPLE_RATE);

    north_timeseries.push_back(northTestWaveform1);
    north_timeseries.push_back(northTestWaveform2);
    north_timeseries.push_back(northTestWaveform3);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime + 7, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    auto north_missingInputChannels = TimeRangesByChannel(north_channel, north_timeRange);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime + 8)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };

    // create a processing mask that elides the middle waveform
    auto mask_id = "some_guid";
    auto mask_effectiveAt = north_startTime;
    auto mask_startTime = north_startTime + 4;
    auto mask_endTime = north_startTime + 7;
    auto mask_processingOperation = ProcessingOperation::ROTATION;
    auto mask_appliedToRawChannel = Channel(north_channelName);
    auto mask_maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto processingMask = ProcessingMask(mask_id, mask_appliedToRawChannel, mask_effectiveAt, mask_startTime, mask_endTime, mask_maskedQcSegmentVersions, mask_processingOperation);
    auto processingMasks = std::vector<ProcessingMask>{ processingMask };
    Map<std::string, std::vector<ProcessingMask>> processingMaskMap;
    processingMaskMap.add(northSegment.id.channel.name, processingMasks);

    std::optional<TaperDefinition> maskTaperDefinition;

    //ACT
    RotationProvider classUnderTest;

    //ASSERT
    EXPECT_THROW({
        auto actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime + 8, processingMaskMap, maskTaperDefinition);
        }, std::invalid_argument);
};