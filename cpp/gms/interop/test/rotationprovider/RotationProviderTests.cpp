#include "RotationProviderTests.hh"

void RotationProviderTests::SetUp() {
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


TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_CHANNEL_SEGMENTS_TOO_FEW) {
    std::optional<TaperDefinition> maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 1);
    std::vector<ChannelSegment> tooFew;
    auto start = 1702403100.407;
    auto end = 1702403103.407;
    auto masksByChannel = Map<std::string, std::vector<ProcessingMask>>();
    RotationProvider classUnderTest;
    EXPECT_THROW({
        auto actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), tooFew, start, end, masksByChannel, maskTaperDefinition);
        }, std::invalid_argument);
}

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_CHANNEL_SEGMENTS_TOO_MANY) {
    //ASSEMBLE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    std::vector<Waveform> east_timeseries;
    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> east_samples;
    for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
        auto smp = eastJson.asDouble();
        east_samples.push_back(smp);
    }
    auto eastTestWaveform = Waveform(east_samples, east_startTime, east_endTime, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform);

    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };

    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime)
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
    auto northTestWaveform = Waveform(north_samples, north_startTime, north_endTime, SAMPLE_RATE);
    north_timeseries.push_back(northTestWaveform);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> tooMany{ northSegment,eastSegment,northSegment,eastSegment };
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    auto start = 1702403100.407;
    auto end = 1702403103.407;
    std::optional<TaperDefinition> maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 1);

    RotationProvider classUnderTest;
    EXPECT_THROW({
       auto actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), tooMany, start, end, masksByChannel, maskTaperDefinition);
        }, std::invalid_argument);
}

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_VERIFIED) {

    //ASSEMBLE
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
    auto eastTestWaveform = Waveform(east_samples, east_startTime, east_endTime, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform);

    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime)
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
    auto northTestWaveform = Waveform(north_samples, north_startTime, north_endTime, SAMPLE_RATE);
    north_timeseries.push_back(northTestWaveform);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    std::optional<TaperDefinition> maskTaperDefinition;
    maskTaperDefinition.emplace(TaperDefinition(TaperFunction::COSINE, 1));
    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime, masksByChannel, maskTaperDefinition);

    //ASSERT
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;

    for (Waveform waveform : radialWaveforms) {
        GmsTestUtils::Comparisons::precisionCompare(&waveform.samples, &EXPECTED_NORTH.value().samples);
    }

    for (Waveform waveform : transverseWaveforms) {
        GmsTestUtils::Comparisons::precisionCompare(&waveform.samples, &EXPECTED_EAST.value().samples);
    }
};

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_2HR_VERIFIED) {

    //ASSEMBLE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");

    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = east_startTime + 7200;

    auto east_timeseries = std::vector<Waveform>();
    std::vector<double> east_samples;
    int twoHourCount = 800;
    int cloneCount = 0;
    while (cloneCount < twoHourCount) {
        for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
            auto smp = eastJson.asDouble();
            east_samples.push_back(smp);
        }
        cloneCount++;
    }

    auto eastTestWaveform1 = Waveform(east_samples, east_startTime, east_startTime + 2400, SAMPLE_RATE);
    auto eastTestWaveform2 = Waveform(east_samples, east_startTime + 2400, east_startTime + 4800, SAMPLE_RATE);
    auto eastTestWaveform3 = Waveform(east_samples, east_startTime + 4800, east_startTime + 7200, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform1);
    east_timeseries.push_back(eastTestWaveform2);
    east_timeseries.push_back(eastTestWaveform3);

    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime)
        .id(east_chanSegDesc)
        .startTime(east_startTime)
        .timeseries(east_timeseries)
        .build();

    auto north_channelName = testData["channelSegments"][1]["id"]["channel"]["name"].asString();
    auto north_effectiveAt = testData["channelSegments"][1]["id"]["channel"]["effectiveAt"].asDouble();
    auto north_creationTime = testData["channelSegments"][1]["id"]["creationTime"].asDouble();
    auto north_startTime = testData["channelSegments"][1]["id"]["startTime"].asDouble();
    auto north_endTime = testData["channelSegments"][1]["id"]["endTime"].asDouble();
    auto north_timeseries = std::vector<Waveform>();

    std::vector<double> north_samples;
    twoHourCount = 800;
    cloneCount = 0;
    while (cloneCount < twoHourCount) {
        for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
            auto smp = northJson.asDouble();
            north_samples.push_back(smp);
        }
        cloneCount++;
    }
    auto northTestWaveform1 = Waveform(north_samples, north_startTime, north_startTime + 2400, SAMPLE_RATE);
    auto northTestWaveform2 = Waveform(north_samples, north_startTime + 2400, north_startTime + 4800, SAMPLE_RATE);
    auto northTestWaveform3 = Waveform(north_samples, north_startTime + 4800, north_startTime + 7200, SAMPLE_RATE);
    north_timeseries.push_back(northTestWaveform1);
    north_timeseries.push_back(northTestWaveform2);
    north_timeseries.push_back(northTestWaveform3);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    std::optional<TaperDefinition> maskTaperDefinition;
    maskTaperDefinition.emplace(TaperDefinition(TaperFunction::COSINE, 1));
    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_startTime + 7200, masksByChannel, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;
    //ASSERT
    EXPECT_EQ(radialWaveforms.size(), 3);
    EXPECT_EQ(transverseWaveforms.size(), 3);

    auto segmentSize = EXPECTED_NORTH.value().samples.size();
    auto waveformCount = 0;
    while (waveformCount < radialWaveforms.size()) {
        auto numberOfSegments = radialWaveforms.at(waveformCount).samples.size() / segmentSize;
        for (auto i = 0; i < numberOfSegments; i++) {
            auto beginMarker = i * segmentSize;
            auto endMarker = beginMarker + segmentSize;
            auto northSubVector = std::vector<double>(radialWaveforms.at(waveformCount).samples.begin() + beginMarker, radialWaveforms.at(waveformCount).samples.begin() + endMarker);
            GmsTestUtils::Comparisons::precisionCompare(&northSubVector, &EXPECTED_NORTH.value().samples);
        }
        waveformCount++;
    }

    segmentSize = EXPECTED_EAST.value().samples.size();
    waveformCount = 0;
    while (waveformCount < transverseWaveforms.size()) {
        auto numberOfSegments = transverseWaveforms.at(waveformCount).samples.size() / segmentSize;
        for (auto i = 0; i < numberOfSegments; i++) {
            auto beginMarker = i * segmentSize;
            auto endMarker = beginMarker + segmentSize;
            auto transverseSubVector = std::vector<double>(transverseWaveforms.at(waveformCount).samples.begin() + beginMarker, transverseWaveforms.at(waveformCount).samples.begin() + endMarker);
            GmsTestUtils::Comparisons::precisionCompare(&transverseSubVector, &EXPECTED_EAST.value().samples);
        }
        waveformCount++;
    }
};

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_JAGGED_3E_1N) {
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
    auto eastTestWaveform2 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime, east_endTime + 3, SAMPLE_RATE);
    auto eastTestWaveform3 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime + 3, east_endTime + 6, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform1);
    east_timeseries.push_back(eastTestWaveform2);
    east_timeseries.push_back(eastTestWaveform3);

    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
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
    auto northTestWaveform1 = Waveform(north_samples, north_startTime, north_endTime, SAMPLE_RATE);
    north_timeseries.push_back(northTestWaveform1);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime + 7, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
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
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    std::optional<TaperDefinition> maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 1);

    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime, masksByChannel, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;

    // ASSERT
    EXPECT_EQ(radialWaveforms.size(), 1);
    EXPECT_EQ(transverseWaveforms.size(), 1);
};

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_1E_ENCOMPASSES_3N) {

    //ASSEMBLE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_timeseries = std::vector<Waveform>();

    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> eSamp;
    std::vector<double> eastSamples;
    for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
        auto smp = eastJson.asDouble();
        eastSamples.push_back(smp);
    }

    std::copy(eastSamples.begin(), eastSamples.end(), std::back_inserter(eSamp));
    std::copy(eastSamples.begin(), eastSamples.end(), std::back_inserter(eSamp));
    std::copy(eastSamples.begin(), eastSamples.end(), std::back_inserter(eSamp));

    auto eastTestWaveform = Waveform(eSamp, east_startTime, east_endTime + 6, SAMPLE_RATE);

    east_timeseries.push_back(eastTestWaveform);

    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime)
        .id(east_chanSegDesc)
        .startTime(east_startTime)
        .timeseries(east_timeseries)
        .build();

    auto north_channelName = testData["channelSegments"][1]["id"]["channel"]["name"].asString();
    auto north_startTime = testData["channelSegments"][1]["id"]["startTime"].asDouble();
    auto north_endTime = testData["channelSegments"][1]["id"]["endTime"].asDouble();
    auto north_effectiveAt = testData["channelSegments"][1]["id"]["channel"]["effectiveAt"].asDouble();
    auto north_timeseries = std::vector<Waveform>();

    std::vector<double> northSamples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        northSamples.push_back(smp);
    }

    std::vector<double> nSamp1;
    std::vector<double> nSamp2;
    std::vector<double> nSamp3;

    std::copy(northSamples.begin(), northSamples.end(), std::back_inserter(nSamp1));
    std::copy(northSamples.begin(), northSamples.end(), std::back_inserter(nSamp2));
    std::copy(northSamples.begin(), northSamples.end(), std::back_inserter(nSamp3));

    auto northTestWaveform1 = Waveform(nSamp1, north_startTime, north_endTime, SAMPLE_RATE);
    auto northTestWaveform2 = Waveform(nSamp2, north_endTime, north_endTime + 3, SAMPLE_RATE);
    auto northTestWaveform3 = Waveform(nSamp3, north_endTime + 3, north_endTime + 6, SAMPLE_RATE);

    north_timeseries.push_back(northTestWaveform1);
    north_timeseries.push_back(northTestWaveform2);
    north_timeseries.push_back(northTestWaveform3);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_creationTime = testData["channelSegments"][1]["id"]["creationTime"].asDouble();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    std::optional<TaperDefinition> maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 1);

    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime + 6, masksByChannel, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;

    // ASSERT
    EXPECT_EQ(radialWaveforms.size(), 3);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(0).startTime, north_startTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(0).endTime, north_endTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(1).startTime, north_endTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(1).endTime, north_endTime + 3);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(2).startTime, north_endTime + 3);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(2).endTime, north_endTime + 6);

    GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(0).samples, &EXPECTED_NORTH.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(1).samples, &EXPECTED_NORTH.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(2).samples, &EXPECTED_NORTH.value().samples);

    EXPECT_EQ(transverseWaveforms.size(), 3);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(0).startTime, east_startTime);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(0).endTime, east_startTime + 3);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(1).startTime, east_startTime + 3);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(1).endTime, east_startTime + 6);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(2).startTime, east_startTime + 6);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(2).endTime, east_startTime + 9);

    GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(0).samples, &EXPECTED_EAST.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(1).samples, &EXPECTED_EAST.value().samples);
    GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(2).samples, &EXPECTED_EAST.value().samples);
};

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_JAGGED_WITH_E_GAP) {

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
    std::vector<double> eSamp3;

    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp1));
    std::copy(east_samples.begin(), east_samples.end(), std::back_inserter(eSamp3));

    auto eastTestWaveform1 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_startTime, east_endTime, SAMPLE_RATE);
    auto eastTestWaveform3 = Waveform(std::vector<double>(east_samples.begin(), east_samples.end()), east_endTime + 3, east_endTime + 6, SAMPLE_RATE);
    east_timeseries.push_back(eastTestWaveform1);
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
        .endTime(east_endTime + 9)
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

    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp1));
    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp1));
    std::copy(north_samples.begin(), north_samples.end(), std::back_inserter(nSamp1));

    auto northTestWaveform1 = Waveform(nSamp1, north_startTime, north_startTime + 9, SAMPLE_RATE);
    north_timeseries.push_back(northTestWaveform1);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime + 6, north_creationTime);
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
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;

    std::optional<TaperDefinition> maskTaperDefinition;
    maskTaperDefinition.emplace(TaperDefinition(TaperFunction::COSINE, 1));

    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime + 6, masksByChannel, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;

    EXPECT_EQ(radialWaveforms.size(), 2);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(0).startTime, north_startTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(0).endTime, north_endTime);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(1).startTime, north_endTime + 3);
    EXPECT_DOUBLE_EQ(radialWaveforms.at(1).endTime, north_endTime + 6);

    EXPECT_EQ(transverseWaveforms.size(), 2);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(0).startTime, east_startTime);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(0).endTime, east_endTime);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(1).startTime, east_endTime + 3);
    EXPECT_DOUBLE_EQ(transverseWaveforms.at(1).endTime, east_endTime + 6);
};

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_1N_ENCOMPASSES_3E) {

    //ASSEMBLE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_timeseries = std::vector<Waveform>();

    std::vector<double> east1_samples;
    for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
        auto smp = eastJson.asDouble();
        east1_samples.push_back(smp);
    }
    auto east1TestWaveformStart = testData["channelSegments"][0]["timeseries"][0]["startTime"].asDouble();
    auto east1TestWaveformEnd = testData["channelSegments"][0]["timeseries"][0]["endTime"].asDouble();
    auto east1TestWaveform = Waveform(east1_samples, east1TestWaveformStart, east1TestWaveformEnd, SAMPLE_RATE);

    east_timeseries.push_back(east1TestWaveform);

    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();
    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime)
        .id(east_chanSegDesc)
        .startTime(east_startTime)
        .timeseries(east_timeseries)
        .build();

    auto north_channelName = testData["channelSegments"][1]["id"]["channel"]["name"].asString();
    auto north_timeseries = std::vector<Waveform>();

    std::vector<double> north1Samples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        north1Samples.push_back(smp);
    }
    auto north1TestWaveformStart = testData["channelSegments"][1]["timeseries"][0]["startTime"].asDouble();
    auto north1TestWaveformEnd = testData["channelSegments"][1]["timeseries"][0]["endTime"].asDouble();
    auto north1TestWaveform = Waveform(north1Samples, north1TestWaveformStart, north1TestWaveformEnd, SAMPLE_RATE);

    std::vector<double> north2Samples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        north2Samples.push_back(smp);
    }
    auto north2TestWaveformStart = testData["channelSegments"][1]["timeseries"][0]["startTime"].asDouble();
    auto north2TestWaveformEnd = testData["channelSegments"][1]["timeseries"][0]["endTime"].asDouble();
    auto north2TestWaveform = Waveform(north2Samples, north2TestWaveformStart, north2TestWaveformEnd, SAMPLE_RATE);

    north_timeseries.push_back(north1TestWaveform);
    north_timeseries.push_back(north2TestWaveform);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_creationTime = testData["channelSegments"][1]["id"]["creationTime"].asDouble();
    auto north_startTime = testData["channelSegments"][1]["id"]["startTime"].asDouble();
    auto north_endTime = testData["channelSegments"][1]["id"]["endTime"].asDouble();
    auto north_effectiveAt = testData["channelSegments"][1]["id"]["channel"]["effectiveAt"].asDouble();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    std::optional<TaperDefinition> maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 1);

    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime, masksByChannel, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;
    // ASSERT

    for (auto timeseriesCount = 6; timeseriesCount < radialWaveforms.size(); timeseriesCount++) {
        GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(timeseriesCount).samples, &EXPECTED_NORTH.value().samples);
        GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(timeseriesCount).samples, &EXPECTED_EAST.value().samples);
    }
};

TEST_F(RotationProviderTests, MASK_AND_ROTATE_2D_JAGGED_NORTH_WITH_GAP) {

    //ASSEMBLE
    //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_timeseries = std::vector<Waveform>();

    std::vector<double> east1_samples;
    for (auto const& eastJson : testData["channelSegments"][0]["timeseries"][0]["samples"]) {
        auto smp = eastJson.asDouble();
        east1_samples.push_back(smp);
    }
    auto east1TestWaveformStart = testData["channelSegments"][0]["timeseries"][0]["startTime"].asDouble();
    auto east1TestWaveformEnd = testData["channelSegments"][0]["timeseries"][0]["endTime"].asDouble();
    auto east1TestWaveform = Waveform(east1_samples, east1TestWaveformStart, east1TestWaveformEnd, SAMPLE_RATE);

    east_timeseries.push_back(east1TestWaveform);

    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();
    auto east_timeseriesType = TimeseriesType::WAVEFORM;
    auto east_channelSegmentUnits = Units::DECIBELS;
    auto east_maskedBy = std::vector<ProcessingMask>();
    auto east_channel = ChannelVersionReference(east_channelName, east_effectiveAt);
    std::vector<TimeRange> east_timeRange{ TimeRange(east_startTime, east_endTime) };
    std::vector<TimeRangesByChannel> east_missingInputChannels = { TimeRangesByChannel(east_channel, east_timeRange) };
    auto east_chanSegDesc = ChannelSegmentDescriptor(east_channel, east_startTime, east_endTime, east_creationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(east_timeseriesType)
        .channelSegmentUnits(east_channelSegmentUnits)
        .creationTime(east_creationTime)
        .endTime(east_endTime)
        .id(east_chanSegDesc)
        .startTime(east_startTime)
        .timeseries(east_timeseries)
        .build();

    auto north_channelName = testData["channelSegments"][1]["id"]["channel"]["name"].asString();
    auto north_timeseries = std::vector<Waveform>();

    std::vector<double> north1Samples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        north1Samples.push_back(smp);
    }
    auto north1TestWaveformStart = testData["channelSegments"][1]["timeseries"][0]["startTime"].asDouble();
    auto north1TestWaveformEnd = testData["channelSegments"][1]["timeseries"][0]["endTime"].asDouble();
    auto north1TestWaveform = Waveform(north1Samples, north1TestWaveformStart, north1TestWaveformEnd, SAMPLE_RATE);

    std::vector<double> north2Samples;
    for (auto const& northJson : testData["channelSegments"][1]["timeseries"][0]["samples"]) {
        auto smp = northJson.asDouble();
        north2Samples.push_back(smp);
    }
    auto north2TestWaveformStart = testData["channelSegments"][1]["timeseries"][0]["startTime"].asDouble();
    auto north2TestWaveformEnd = testData["channelSegments"][1]["timeseries"][0]["endTime"].asDouble();
    auto north2TestWaveform = Waveform(north2Samples, north2TestWaveformStart, north2TestWaveformEnd, SAMPLE_RATE);

    north_timeseries.push_back(north1TestWaveform);
    north_timeseries.push_back(north2TestWaveform);

    auto north_timeseriesType = TimeseriesType::WAVEFORM;
    auto north_channelSegmentUnits = Units::DECIBELS;
    auto north_maskedBy = std::vector<ProcessingMask>();
    auto north_creationTime = testData["channelSegments"][1]["id"]["creationTime"].asDouble();
    auto north_startTime = testData["channelSegments"][1]["id"]["startTime"].asDouble();
    auto north_endTime = testData["channelSegments"][1]["id"]["endTime"].asDouble();
    auto north_effectiveAt = testData["channelSegments"][1]["id"]["channel"]["effectiveAt"].asDouble();
    auto north_channel = ChannelVersionReference(north_channelName, north_effectiveAt);
    auto north_chanSegDesc = ChannelSegmentDescriptor(north_channel, north_startTime, north_endTime, north_creationTime);
    std::vector<TimeRange> north_timeRange{ TimeRange(north_startTime, north_endTime) };
    std::vector<TimeRangesByChannel> north_missingInputChannels = { TimeRangesByChannel(north_channel, north_timeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(north_timeseriesType)
        .channelSegmentUnits(north_channelSegmentUnits)
        .creationTime(north_creationTime)
        .endTime(north_endTime)
        .id(north_chanSegDesc)
        .startTime(north_startTime)
        .timeseries(north_timeseries)
        .build();

    std::vector<ChannelSegment> channelSegments{ northSegment,eastSegment };
    Map<std::string, std::vector<ProcessingMask>> masksByChannel;
    std::optional<TaperDefinition> maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 1);
    //ACT
    RotationProvider classUnderTest;
    Map<std::string, TimeseriesWithMissingInputChannels> actual = classUnderTest.maskAndRotate2d(ROTATION_DEFINITION.value(), channelSegments, north_startTime, north_endTime, masksByChannel, maskTaperDefinition);
    std::vector<Waveform> radialWaveforms = actual.get(northSegment.id.channel.name).timeseries;
    std::vector<Waveform> transverseWaveforms = actual.get(eastSegment.id.channel.name).timeseries;
    // ASSERT
    // Starts at 2 to skip uniformed results, only need jagged
    // MUST END UP WITH THE SAME RESULT AS THE EAST GAP
    for (auto timeseriesCount = 4; timeseriesCount < radialWaveforms.size(); timeseriesCount++) {
        GmsTestUtils::Comparisons::precisionCompare(&radialWaveforms.at(timeseriesCount).samples, &EXPECTED_NORTH.value().samples);
        GmsTestUtils::Comparisons::precisionCompare(&transverseWaveforms.at(timeseriesCount).samples, &EXPECTED_EAST.value().samples);
    }
};