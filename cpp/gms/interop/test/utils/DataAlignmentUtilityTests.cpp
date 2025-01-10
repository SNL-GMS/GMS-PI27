#include "DataAlignmentUtilityTests.hh"

void DataAlignmentUtilityTests::SetUp() {};

TEST_F(DataAlignmentUtilityTests, FIND_EARLIEST_TIME_ASCENDING) {
    auto first = 111.1;
    auto second = 111.2;
    auto third = 111.3;
    auto actual = DataAlignmentUtility::findEarliestTime(first, second, third);
    EXPECT_EQ(actual, first);
};

TEST_F(DataAlignmentUtilityTests, FIND_EARLIEST_TIME_DESCENDING) {
    auto first = 111.3;
    auto second = 111.2;
    auto third = 111.1;
    auto actual = DataAlignmentUtility::findEarliestTime(first, second, third);
    EXPECT_EQ(actual, third);
};

TEST_F(DataAlignmentUtilityTests, FIND_EARLIEST_TIME_ERRATIC) {
    auto first = 111.2;
    auto second = 111.1;
    auto third = 111.3;
    auto actual = DataAlignmentUtility::findEarliestTime(first, second, third);
    EXPECT_EQ(actual, second);
};

TEST_F(DataAlignmentUtilityTests, FIND_LATEST_TIME_ASCENDING) {
    auto first = 111.1;
    auto second = 111.2;
    auto third = 111.3;
    auto actual = DataAlignmentUtility::findLatestTime(first, second, third);
    EXPECT_EQ(actual, third);
};

TEST_F(DataAlignmentUtilityTests, FIND_LATEST_TIME_DESCENDING) {
    auto first = 111.3;
    auto second = 111.2;
    auto third = 111.1;
    auto actual = DataAlignmentUtility::findLatestTime(first, second, third);
    EXPECT_EQ(actual, first);
};

TEST_F(DataAlignmentUtilityTests, FIND_LATEST_TIME_ERRATIC) {
    auto first = 111.2;
    auto second = 111.3;
    auto third = 111.1;
    auto actual = DataAlignmentUtility::findLatestTime(first, second, third);
    EXPECT_EQ(actual, second);
};

TEST_F(DataAlignmentUtilityTests, AlignWaveforms_SHORTENED_TO_WINDOW) {
    //arrange
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 1702428303.407;

    auto waveformLength = static_cast<int>(3 * sampleRateHz);

    std::vector<double> northData(waveformLength, 0);
    auto northWaveform = Waveform(northData, startTime, endTime, sampleRateHz);

    std::vector<double> eastData(waveformLength, 1);
    auto eastWaveform = Waveform(eastData, startTime, endTime, sampleRateHz);

    //act
    //120 sample waveforms will be trimmed by half a second at the beginning and end
    auto actual = DataAlignmentUtility::alignWaveforms(northWaveform, eastWaveform, startTime + 0.5, endTime - 0.5);

    //assert
    EXPECT_EQ(actual.at(0).startTime, startTime + 0.5);
    EXPECT_EQ(actual.at(1).startTime, startTime + 0.5);
    EXPECT_EQ(actual.at(0).endTime, endTime - 0.5);
    EXPECT_EQ(actual.at(1).endTime, endTime - 0.5);
    //ensure no sample jitter
    EXPECT_EQ(actual.at(0).samples.size(), 80);
    EXPECT_EQ(actual.at(1).samples.size(), 80);
    EXPECT_EQ(actual.at(0).samples.at(0), 0);
    EXPECT_EQ(actual.at(1).samples.at(1), 1);
};

TEST_F(DataAlignmentUtilityTests, AlignWaveforms_SYMMETRIC) {
    //arrange
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 1702428303.407;
    auto waveformLength = static_cast<int>(3 * sampleRateHz);

    std::vector<double> northData(waveformLength, 0);
    auto northWaveform = Waveform(northData, startTime, endTime, sampleRateHz);

    std::vector<double> eastData(waveformLength, 0);
    auto eastWaveform = Waveform(eastData, startTime, endTime, sampleRateHz);

    //act
    auto actual = DataAlignmentUtility::alignWaveforms(northWaveform, eastWaveform, startTime, endTime);

    //assert
    EXPECT_EQ(actual.at(0).startTime, startTime);
    EXPECT_EQ(actual.at(1).startTime, startTime);
    EXPECT_EQ(actual.at(0).endTime, endTime);
    EXPECT_EQ(actual.at(1).endTime, endTime);
};

TEST_F(DataAlignmentUtilityTests, AlignWaveforms_ASYMMETRIC_LENGTH_BEGIN) {
    //arrange
    double sampleRateHz = 40.0;
    double northStartTime = 1702428300.407;
    double northEndTime = 1702428303.407;
    double eastStartTime = 1702428300.407;
    double eastEndTime = 1702428302.407;
    auto northLength = static_cast<int>(3 * sampleRateHz);
    auto eastLength = static_cast<int>(2 * sampleRateHz);
    std::vector<double> northData(northLength, 0);
    auto northWaveform = Waveform(northData, northStartTime, northEndTime, sampleRateHz);

    std::vector<double> eastData(eastLength, 1);
    auto eastWaveform = Waveform(eastData, eastStartTime, eastEndTime, sampleRateHz);

    //act
    auto actual = DataAlignmentUtility::alignWaveforms(northWaveform, eastWaveform, northStartTime, northEndTime);

    //assert
    EXPECT_EQ(actual.at(0).startTime, northStartTime);
    EXPECT_EQ(actual.at(1).startTime, eastStartTime);
    EXPECT_EQ(actual.at(0).endTime, eastEndTime);
    EXPECT_EQ(actual.at(1).endTime, eastEndTime);
    EXPECT_EQ(actual.at(0).samples.size(), eastLength);
    EXPECT_EQ(actual.at(1).samples.size(), eastLength);
};

TEST_F(DataAlignmentUtilityTests, AlignWaveforms_ASYMMETRIC_LENGTH_END) {
    //arrange
    double sampleRateHz = 40.0;
    double northStartTime = 1702428300.407;
    double northEndTime = 1702428303.407;
    double eastStartTime = 1702428301.407;
    double eastEndTime = 1702428303.407;
    auto northLength = static_cast<int>(3 * sampleRateHz);
    auto eastLength = static_cast<int>(2 * sampleRateHz);
    std::vector<double> northData(northLength, 0);
    auto northWaveform = Waveform(northData, northStartTime, northEndTime, sampleRateHz);

    std::vector<double> eastData(eastLength, 1);
    auto eastWaveform = Waveform(eastData, eastStartTime, eastEndTime, sampleRateHz);

    //act
    auto actual = DataAlignmentUtility::alignWaveforms(northWaveform, eastWaveform, northStartTime, northEndTime);

    //assert
    EXPECT_EQ(actual.at(0).startTime, eastStartTime);
    EXPECT_EQ(actual.at(1).startTime, eastStartTime);
    EXPECT_EQ(actual.at(0).endTime, northEndTime);
    EXPECT_EQ(actual.at(1).endTime, northEndTime);
    EXPECT_EQ(actual.at(0).samples.size(), eastLength);
    EXPECT_EQ(actual.at(1).samples.size(), eastLength);
};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_SYMMETRIC) {

    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 1702428303.407;
    double northStartTime = 1702428300.407;
    double northEndTime = 1702428303.407;
    double eastStartTime = 1702428300.407;
    double eastEndTime = 1702428303.407;
    auto northLength = static_cast<int>(3 * sampleRateHz);
    auto eastLength = static_cast<int>(3 * sampleRateHz);

    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = testData["channelSegments"][0]["id"]["channel"]["name"].asString();
    auto east_timeseries = std::vector<Waveform>();
    auto east_creationTime = testData["channelSegments"][0]["id"]["creationTime"].asDouble();
    auto east_startTime = testData["channelSegments"][0]["id"]["startTime"].asDouble();
    auto east_endTime = testData["channelSegments"][0]["id"]["endTime"].asDouble();
    auto east_effectiveAt = testData["channelSegments"][0]["id"]["channel"]["effectiveAt"].asDouble();

    std::vector<double> eastData(eastLength, 1);
    auto eastWaveform = Waveform(eastData, eastStartTime, eastEndTime, sampleRateHz);
    east_timeseries.push_back(eastWaveform);

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

    std::vector<double> northData(northLength, 0);
    auto northWaveform = Waveform(northData, northStartTime, northEndTime, sampleRateHz);
    north_timeseries.push_back(northWaveform);

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

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    //ASSERT
    EXPECT_EQ(northSegment.timeseries.size(), 1);
    EXPECT_EQ(eastSegment.timeseries.size(), 1);
    EXPECT_EQ(northSegment.timeseries.at(0).samples.size(), northLength);
    EXPECT_EQ(eastSegment.timeseries.at(0).samples.size(), eastLength);

};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_2N_3E_GAPS_AND_OVERLAPS) {

    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283011.407;
    auto northLength = static_cast<int>(3 * sampleRateHz);
    auto eastLength = static_cast<int>(3 * sampleRateHz);

    auto eastChannelName = "Ralph";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428311.407;
    auto eastEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(2.5 * sampleRateHz), 1);
    auto eastWaveform1 = Waveform(eastData, eastStartTime + 1, eastStartTime + 3.5, sampleRateHz);
    auto eastWaveform2 = Waveform(eastData, eastStartTime + 4.5, eastStartTime + 7, sampleRateHz);
    auto eastWaveform3 = Waveform(eastData, eastStartTime + 8, eastStartTime + 10.5, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);
    eastTimeseries.push_back(eastWaveform2);
    eastTimeseries.push_back(eastWaveform3);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);

    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    auto northChannelName = "George";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428311.407;
    auto northEffectiveAt = 1702428300.407;

    //two 5-second waveforms with 1-second gap
    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(northLength, 0);
    auto northWaveform1 = Waveform(northData, northStartTime, northStartTime + 5, sampleRateHz);
    auto northWaveform2 = Waveform(northData, northStartTime + 6, northStartTime + 11, sampleRateHz);
    northTimeseries.push_back(northWaveform1);
    northTimeseries.push_back(northWaveform2);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    //ASSERT
    EXPECT_EQ(northSegment.timeseries.size(), 4);
    EXPECT_EQ(eastSegment.timeseries.size(), 4);
    EXPECT_EQ(northSegment.timeseries.at(0).samples.size(), 100); //trimmed by half a second
    EXPECT_EQ(eastSegment.timeseries.at(0).samples.size(), 100); //trimmed by half a second

};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_JAGGED_3E_1N) {
    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283009.407;

    auto eastChannelName = "Ralph";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428309.407;
    auto eastEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(3 * sampleRateHz), 1);
    auto eastWaveform1 = Waveform(eastData, eastStartTime, eastStartTime + 3, sampleRateHz);
    auto eastWaveform2 = Waveform(eastData, eastStartTime + 3, eastStartTime + 6, sampleRateHz);
    auto eastWaveform3 = Waveform(eastData, eastStartTime + 6, eastStartTime + 9, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);
    eastTimeseries.push_back(eastWaveform2);
    eastTimeseries.push_back(eastWaveform3);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);

    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    auto northChannelName = "George";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428303.407;
    auto northEffectiveAt = 1702428300.407;


    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(static_cast<int>(3 * sampleRateHz), 0);
    auto northWaveform1 = Waveform(northData, northStartTime, northEndTime, sampleRateHz);
    northTimeseries.push_back(northWaveform1);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    //ASSERT
    EXPECT_EQ(northSegment.timeseries.size(), 1);
    EXPECT_EQ(eastSegment.timeseries.size(), 1);
    EXPECT_EQ(northSegment.timeseries.at(0).samples.size(), 120);
    EXPECT_EQ(eastSegment.timeseries.at(0).samples.size(), 120);
};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_JAGGED_1E_3N) {
    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283009.407;

    auto northChannelName = "Ralph";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428309.407;
    auto northEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(static_cast<int>(3 * sampleRateHz), 1);
    auto northWaveform1 = Waveform(northData, northStartTime, northStartTime + 3, sampleRateHz);
    auto northWaveform2 = Waveform(northData, northStartTime + 3, northStartTime + 6, sampleRateHz);
    auto northWaveform3 = Waveform(northData, northStartTime + 6, northStartTime + 9, sampleRateHz);
    northTimeseries.push_back(northWaveform1);
    northTimeseries.push_back(northWaveform2);
    northTimeseries.push_back(northWaveform3);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);

    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    auto eastChannelName = "George";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428303.407;
    auto eastEffectiveAt = 1702428300.407;

    //two 5-second waveforms with 1-second gap
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(3 * sampleRateHz), 0);
    auto eastWaveform1 = Waveform(eastData, eastStartTime, eastEndTime, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    //ASSERT
    EXPECT_EQ(northSegment.timeseries.size(), 1);
    EXPECT_EQ(eastSegment.timeseries.size(), 1);
    EXPECT_EQ(northSegment.timeseries.at(0).samples.size(), 120);
    EXPECT_EQ(eastSegment.timeseries.at(0).samples.size(), 120);
};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_1E_ENCOMPASSES_3N) {

    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283009.407;

    auto eastChannelName = "George";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428309.407;
    auto eastEffectiveAt = 1702428300.407;

    // nine second east, single waveform
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(9 * sampleRateHz), 1);
    auto eastWaveform1 = Waveform(eastData, eastStartTime, eastStartTime + 9, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);

    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    auto northChannelName = "Ralph";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428309.407;
    auto northEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(static_cast<int>(3 * sampleRateHz), 1);
    auto northWaveform1 = Waveform(northData, northStartTime, northStartTime + 3, sampleRateHz);
    auto northWaveform2 = Waveform(northData, northStartTime + 3, northStartTime + 6, sampleRateHz);
    auto northWaveform3 = Waveform(northData, northStartTime + 6, northStartTime + 9, sampleRateHz);
    northTimeseries.push_back(northWaveform1);
    northTimeseries.push_back(northWaveform2);
    northTimeseries.push_back(northWaveform3);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);

    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    //ASSERT
    EXPECT_EQ(northSegment.timeseries.size(), 3);
    EXPECT_EQ(eastSegment.timeseries.size(), 3);
    EXPECT_EQ(northSegment.timeseries.at(0).samples.size(), 120);
    EXPECT_EQ(eastSegment.timeseries.at(0).samples.size(), 120);
};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_1N_ENCOMPASSES_3E) {

    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283009.407;

    auto northChannelName = "Ralph";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428309.407;
    auto northEffectiveAt = 1702428300.407;

    // nine second north, single waveform
    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(static_cast<int>(9 * sampleRateHz), 1);
    auto northWaveform1 = Waveform(northData, northStartTime, northStartTime + 9, sampleRateHz);
    northTimeseries.push_back(northWaveform1);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);

    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    auto eastChannelName = "George";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428309.407;
    auto eastEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(3 * sampleRateHz), 1);
    auto eastWaveform1 = Waveform(eastData, eastStartTime, eastStartTime + 3, sampleRateHz);
    auto eastWaveform2 = Waveform(eastData, eastStartTime + 3, eastStartTime + 6, sampleRateHz);
    auto eastWaveform3 = Waveform(eastData, eastStartTime + 6, eastStartTime + 9, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);
    eastTimeseries.push_back(eastWaveform2);
    eastTimeseries.push_back(eastWaveform3);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);

    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    //ASSERT
    EXPECT_EQ(northSegment.timeseries.size(), 3);
    EXPECT_EQ(eastSegment.timeseries.size(), 3);
    EXPECT_EQ(northSegment.timeseries.at(0).samples.size(), 120);
    EXPECT_EQ(eastSegment.timeseries.at(0).samples.size(), 120);
};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_JAGGED_WITH_E_GAP) {
    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283009.407;

    auto northChannelName = "Ralph";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428309.407;
    auto northEffectiveAt = 1702428300.407;

    // nine second north, single waveform
    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(static_cast<int>(9 * sampleRateHz), 1);
    auto northWaveform1 = Waveform(northData, northStartTime, northStartTime + 9, sampleRateHz);
    northTimeseries.push_back(northWaveform1);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);

    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    auto eastChannelName = "George";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428309.407;
    auto eastEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(3 * sampleRateHz), 1);
    auto eastWaveform1 = Waveform(eastData, eastStartTime, eastStartTime + 3, sampleRateHz);
    auto eastWaveform3 = Waveform(eastData, eastStartTime + 6, eastStartTime + 9, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);
    eastTimeseries.push_back(eastWaveform3);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);

    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);
    EXPECT_EQ(northSegment.timeseries.size(), 2);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(0).startTime, northStartTime);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(0).endTime, northStartTime + 3);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(1).startTime, northStartTime + 6);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(1).endTime, northStartTime + 9);

    EXPECT_EQ(eastSegment.timeseries.size(), 2);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(0).startTime, eastStartTime);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(0).endTime, eastStartTime + 3);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(1).startTime, eastStartTime + 6);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(1).endTime, eastStartTime + 9);
};

TEST_F(DataAlignmentUtilityTests, AlignChannelSegments_JAGGED_WITH_N_GAP) {
    //ASSEMBLE
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    double endTime = 17024283009.407;

    auto eastChannelName = "Ralph";
    auto eastCreationTime = 1702428300.407;
    auto eastStartTime = 1702428300.407;
    auto eastEndTime = 1702428309.407;
    auto eastEffectiveAt = 1702428300.407;

    // nine second east, single waveform
    auto eastTimeseries = std::vector<Waveform>();
    std::vector<double> eastData(static_cast<int>(9 * sampleRateHz), 1);
    auto eastWaveform1 = Waveform(eastData, eastStartTime, eastStartTime + 9, sampleRateHz);
    eastTimeseries.push_back(eastWaveform1);

    auto eastTimeseriesType = TimeseriesType::WAVEFORM;
    auto eastChannelSegmentUnits = Units::DECIBELS;
    auto eastMaskedBy = std::vector<ProcessingMask>();
    auto eastChannel = ChannelVersionReference(eastChannelName, eastEffectiveAt);

    std::vector<TimeRange> eastTimeRange{ TimeRange(eastStartTime, eastEndTime) };
    std::vector<TimeRangesByChannel> eastMissingInputChannels = { TimeRangesByChannel(eastChannel, eastTimeRange) };
    auto eastChanSegDesc = ChannelSegmentDescriptor(eastChannel, eastStartTime, eastEndTime, eastCreationTime);
    auto eastSegment = ChannelSegment::Builder()
        .timeseriesType(eastTimeseriesType)
        .channelSegmentUnits(eastChannelSegmentUnits)
        .creationTime(eastCreationTime)
        .endTime(eastEndTime)
        .id(eastChanSegDesc)
        .startTime(eastStartTime)
        .timeseries(eastTimeseries)
        .build();

    auto northChannelName = "George";
    auto northCreationTime = 1702428300.407;
    auto northStartTime = 1702428300.407;
    auto northEndTime = 1702428309.407;
    auto northEffectiveAt = 1702428300.407;

    // three 2.5-second waveforms with a 1-second gap between each
    auto northTimeseries = std::vector<Waveform>();
    std::vector<double> northData(static_cast<int>(3 * sampleRateHz), 1);
    auto northWaveform1 = Waveform(northData, northStartTime, northStartTime + 3, sampleRateHz);
    auto northWaveform3 = Waveform(northData, northStartTime + 6, northStartTime + 9, sampleRateHz);
    northTimeseries.push_back(northWaveform1);
    northTimeseries.push_back(northWaveform3);

    auto northTimeseriesType = TimeseriesType::WAVEFORM;
    auto northChannelSegmentUnits = Units::DECIBELS;
    auto northMaskedBy = std::vector<ProcessingMask>();
    auto northChannel = ChannelVersionReference(northChannelName, northEffectiveAt);

    std::vector<TimeRange> northTimeRange{ TimeRange(northStartTime, northEndTime) };
    std::vector<TimeRangesByChannel> northMissingInputChannels = { TimeRangesByChannel(northChannel, northTimeRange) };
    auto northChanSegDesc = ChannelSegmentDescriptor(northChannel, northStartTime, northEndTime, northCreationTime);
    auto northSegment = ChannelSegment::Builder()
        .timeseriesType(northTimeseriesType)
        .channelSegmentUnits(northChannelSegmentUnits)
        .creationTime(northCreationTime)
        .endTime(northEndTime)
        .id(northChanSegDesc)
        .startTime(northStartTime)
        .timeseries(northTimeseries)
        .build();

    //ACT
    DataAlignmentUtility::alignChannelSegments(northSegment, eastSegment, startTime, endTime);

    EXPECT_EQ(northSegment.timeseries.size(), 2);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(0).startTime, northStartTime);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(0).endTime, northStartTime + 3);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(1).startTime, northStartTime + 6);
    EXPECT_DOUBLE_EQ(northSegment.timeseries.at(1).endTime, northStartTime + 9);

    EXPECT_EQ(eastSegment.timeseries.size(), 2);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(0).startTime, eastStartTime);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(0).endTime, eastStartTime + 3);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(1).startTime, eastStartTime + 6);
    EXPECT_DOUBLE_EQ(eastSegment.timeseries.at(1).endTime, eastStartTime + 9);
}

TEST_F(DataAlignmentUtilityTests, ELIDE_MASKED_WAVEFORM) {
    double sampleRateHz = 40.0;
    double startTime = 1702428300.407;
    auto creationTime = 1702428300.407;
    auto effectiveAt = 1702428300.407;
    auto channelName = "Ralph";

    // nine second , single waveform
    auto timeseries = std::vector<Waveform>();

    std::vector<double> data(static_cast<int>(60 * sampleRateHz), 45);
        auto waveform = Waveform(data, startTime, startTime + 60, sampleRateHz);
    timeseries.push_back(waveform);

    std::vector<QcSegmentVersion> qmSegmentVersions;

    auto mask = ProcessingMask("immamask", Channel(channelName), effectiveAt, startTime + 20, startTime + 40, qmSegmentVersions, ProcessingOperation::ROTATION);
    std::vector<ProcessingMask> processingMasks{ mask };

    auto maskStart = static_cast<long>((mask.startTime - startTime) * sampleRateHz);
    auto maskEnd = static_cast<long>((mask.endTime - startTime) * sampleRateHz);
    for (auto i = maskStart; i <= maskEnd; i++) {
        data.at(i) = 0;
    }

    DataAlignmentUtility::elideMaskedData(&timeseries, &processingMasks);

    EXPECT_EQ(timeseries.size(), 2);

    EXPECT_EQ(timeseries.at(0).startTime, startTime);
    EXPECT_EQ(timeseries.at(0).endTime, startTime + 20);
    for (double val : timeseries.at(0).samples) {
        EXPECT_EQ(val, 45);
    }

    EXPECT_EQ(timeseries.at(1).startTime, startTime + 40);
    EXPECT_EQ(timeseries.at(1).endTime, startTime + 60);
    for (double val : timeseries.at(1).samples) {
        EXPECT_EQ(val, 45);
    }

};