#include "ProcessingMaskUtilityTests.hh"

void ProcessingMaskUtilityTests::SetUp()
{
};

TEST_F(ProcessingMaskUtilityTests, ApplyProcessingMasks_Interop_Nominal) {
    auto channelSegment = buildChannelSegment();
    double startTime = 1702428300.407;
    auto maskStartIndex = 10;
    auto maskEndIndex = 100;

    auto channel = Channel(channelSegment.id.channel.name);

    // create a processing mask that masks the middle waveform
    auto mask_id = "some_guid";
    auto mask_effectiveAt = startTime;
    auto mask_startTime = startTime + maskStartIndex;
    auto mask_endTime = startTime + maskEndIndex;
    auto mask_processingOperation = ProcessingOperation::ROTATION;
    auto const& mask_appliedToRawChannel = channel;
    auto mask_maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto processingMask = ProcessingMask(mask_id, mask_appliedToRawChannel, mask_effectiveAt, mask_startTime, mask_endTime, mask_maskedQcSegmentVersions, mask_processingOperation);
    auto processingMasks = std::vector<ProcessingMask>{ processingMask };

    std::optional<TaperDefinition> maskTaperDefinition;
    maskTaperDefinition.emplace(TaperDefinition(TaperFunction::COSINE, 1));

    ProcessingMaskUtility::applyProcessingMasks(&channelSegment, &processingMasks, &maskTaperDefinition);

    auto maskedStartSample = static_cast<long>((mask_startTime - channelSegment.timeseries.at(0).startTime) * channelSegment.timeseries.at(0).sampleRateHz);
    auto maskedEndSample = static_cast<long>((mask_endTime - channelSegment.timeseries.at(0).startTime) * channelSegment.timeseries.at(0).sampleRateHz);
    auto taperSize = 1;
    EXPECT_GT(channelSegment.timeseries.at(0).samples.at(maskedStartSample - taperSize -1), 0);
    for (auto maskCounter = maskedStartSample; maskCounter < maskedEndSample; maskCounter++) {
        EXPECT_EQ(channelSegment.timeseries.at(0).samples.at(maskCounter), 0);
    }
    EXPECT_GT(channelSegment.timeseries.at(0).samples.at(maskedEndSample + taperSize + 1), 0);
};

TEST_F(ProcessingMaskUtilityTests, ApplyProcessingMasks_Interop_MiddleMask) {
    auto channelSegment = buildChannelSegment();
    double startTime = 1702428300.407;
    auto maskStartIndex = 100;
    auto maskEndIndex = 200;

    auto channel = Channel(channelSegment.id.channel.name);

    // create a processing mask that masks the middle waveform
    auto mask_id = "some_guid";
    auto mask_effectiveAt = startTime;
    auto mask_startTime = startTime + maskStartIndex;
    auto mask_endTime = startTime + maskEndIndex;
    auto mask_processingOperation = ProcessingOperation::ROTATION;
    auto const& mask_appliedToRawChannel = channel;
    auto mask_maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto processingMask = ProcessingMask(mask_id, mask_appliedToRawChannel, mask_effectiveAt, mask_startTime, mask_endTime, mask_maskedQcSegmentVersions, mask_processingOperation);
    auto processingMasks = std::vector<ProcessingMask>{ processingMask };

    auto taperSize = 1;
    std::optional<TaperDefinition> maskTaperDefinition;
    maskTaperDefinition.emplace(TaperDefinition(TaperFunction::COSINE, 1));

    ProcessingMaskUtility::applyProcessingMasks(&channelSegment, &processingMasks, &maskTaperDefinition);

    auto maskedStartSample = static_cast<long>((mask_startTime - channelSegment.timeseries.at(0).startTime) * channelSegment.timeseries.at(0).sampleRateHz);
    auto maskedEndSample = static_cast<long>((mask_endTime - channelSegment.timeseries.at(0).startTime) * channelSegment.timeseries.at(0).sampleRateHz);
    
    //TODO:: the taper size should be all I need here, right?
    // auto maskedAndTaperStartSample = static_cast<long>((mask_startTime - channelSegment.timeseries.at(0).startTime -taperSize) * channelSegment.timeseries.at(0).sampleRateHz);
    // auto maskedAndTaperEndSample = static_cast<long>((mask_endTime - channelSegment.timeseries.at(0).startTime + taperSize) * channelSegment.timeseries.at(0).sampleRateHz);
    
    auto maskedAndTaperStartSample = static_cast<long>((mask_startTime - channelSegment.timeseries.at(0).startTime -taperSize - 1) * channelSegment.timeseries.at(0).sampleRateHz);
    auto maskedAndTaperEndSample = static_cast<long>((mask_endTime - channelSegment.timeseries.at(0).startTime + taperSize + 1) * channelSegment.timeseries.at(0).sampleRateHz);
    
    EXPECT_EQ(channelSegment.timeseries.at(0).samples.at(maskedAndTaperStartSample), 1);
    for (auto maskCounter = maskedStartSample; maskCounter < maskedEndSample; maskCounter++) {
        EXPECT_EQ(channelSegment.timeseries.at(0).samples.at(maskCounter), 0);
    }
    EXPECT_EQ(channelSegment.timeseries.at(0).samples.at(maskedAndTaperEndSample), 1);
};


ChannelSegment ProcessingMaskUtilityTests::buildChannelSegment() const {
    double sampleRateHz = 40.0;
    auto seconds = 2 * 60 * 60;
    double startTime = 1702428300.407;
    double endTime = startTime + seconds;

    auto channelName = "Ralph";
    auto creationTime = startTime;
    auto effectiveAt = startTime;

    auto timeseries = std::vector<Waveform>();
    std::vector<double> data(static_cast<int>(seconds * sampleRateHz), 1);
    auto waveform = Waveform(data, startTime, endTime, sampleRateHz);
    timeseries.push_back(waveform);

    auto timeseriesType = TimeseriesType::WAVEFORM;
    auto channelSegmentUnits = Units::DECIBELS;
    auto maskedBy = std::vector<ProcessingMask>();
    auto channel = ChannelVersionReference(channelName, effectiveAt);

    std::vector<TimeRange> timeRange{ TimeRange(startTime, endTime) };
    std::vector<TimeRangesByChannel> missingInputChannels = { TimeRangesByChannel(channel, timeRange) };
    auto chanSegDesc = ChannelSegmentDescriptor(channel, startTime, endTime, creationTime);
    return ChannelSegment::Builder()
        .timeseriesType(timeseriesType)
        .channelSegmentUnits(channelSegmentUnits)
        .creationTime(creationTime)
        .endTime(endTime)
        .id(chanSegDesc)
        .startTime(startTime)
        .timeseries(timeseries)
        .build();
};