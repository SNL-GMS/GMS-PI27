#include "CoiBuilderTests.hh"

void CoiBuilderTest::SetUp()
{
};

/**
 * ChannelSegment
*/
TEST_F(CoiBuilderTest, ChannelSegment_BLDR) {
    auto channelName = "RALPH";
    auto timeseries = std::vector<Waveform>();
    auto creationTime = 1702403100.407;
    auto startTime = 1702403100.407;
    auto endTime = 1702403103.407;
    auto timeseriesType = TimeseriesType::FK_SPECTRA;
    auto channelSegmentUnits = Units::DECIBELS;
    auto maskedBy = std::vector<ProcessingMask>();
    auto channel = ChannelVersionReference(channelName, creationTime);
    auto chanSegDesc = ChannelSegmentDescriptor(channel, startTime, endTime, creationTime);
    auto timeRange = TimeRange(startTime, endTime);
    std::vector<TimeRange> timeRanges = { timeRange };
    std::vector<TimeRangesByChannel> missingInputChannels = { TimeRangesByChannel(channel, timeRanges) };

    auto actual = ChannelSegment::Builder()
        .timeseriesType(timeseriesType)
        .channelSegmentUnits(channelSegmentUnits)
        .creationTime(creationTime)
        .endTime(endTime)
        .id(chanSegDesc)
        .startTime(startTime)
        .timeseries(timeseries)
        .build();
    EXPECT_EQ(actual.id.startTime, startTime);
    EXPECT_EQ(actual.id.endTime, endTime);
    EXPECT_EQ(actual.id.creationTime, creationTime);
    EXPECT_EQ(actual.channelSegmentUnits, channelSegmentUnits);
}

TEST_F(CoiBuilderTest, ChannelSegment_BLDR_EXCEPTION) {
    auto channelName = "RALPH";
    auto timeseries = std::vector<Waveform>();
    auto creationTime = 1702403100.407;
    auto startTime = 1702403100.407;
    auto endTime = 1702403103.407;
    auto timeseriesType = TimeseriesType::FK_SPECTRA;
    auto channelSegmentUnits = Units::DECIBELS;
    auto maskedBy = std::vector<ProcessingMask>();
    auto channel = ChannelVersionReference(channelName, creationTime);
    auto chanSegDesc = ChannelSegmentDescriptor(channel, startTime, endTime, creationTime);
    auto timeRange = TimeRange(startTime, endTime);
    std::vector<TimeRange> timeRanges = { timeRange };

    EXPECT_THROW({
        try
        {
            auto actual = ChannelSegment::Builder()
                                    .timeseriesType(timeseriesType)
                                    .channelSegmentUnits(channelSegmentUnits)
                                    .creationTime(creationTime)
                                    .endTime(endTime)
                                    .timeseries(timeseries)
                                    .build();
        }
        catch (const RequiredPropertyException& e)
        {
            // and this tests that it has the correct message
            EXPECT_STREQ("Required property is missing: [id, false]", e.what());
            throw;
        }
        }, RequiredPropertyException);
}




/**
 * FkSpectraDefinition
*/
TEST_F(CoiBuilderTest, FkSpectraDefinition_BLDR) {
    auto lowFrequencyHz = 20.5;
    auto highFrequencyHz = 60.5;
    auto fkFrequencyRange = FkFrequencyRange(lowFrequencyHz, highFrequencyHz);

    auto duration = 5;
    auto lead = 6;
    auto fkSpectrumWindow = FkSpectrumWindow(duration, lead);

    auto preFilter = BaseFilterDefinition();

    auto maxSlowness = 22.2;
    auto numPoints = 15000;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);

    auto waveformSampleRateHz = 40.0;
    auto waveformSampleRateToleranceHz = 0.05;
    auto waveformSampleRate = FkWaveformSampleRate(waveformSampleRateHz, waveformSampleRateToleranceHz);

    auto fftTaperPercent = 10.5;
    auto minimumWaveformsForSpectra = 11;
    auto spectrumStepDuration = .0345;
    auto normalizeWaveforms = true;
    auto orientationAngleToleranceDeg = 35.5;
    auto twoDimensional = true;
    auto fkUncertaintyOption = FkUncertaintyOption::PERFECT_SIGNAL_COHERENCE;
    auto fftTaperFunction = TaperFunction::COSINE;
    auto phase = "S";

    auto fkParameters = FkSpectraParameters::Builder().fkFrequencyRange(fkFrequencyRange)
        .fftTaperFunction(fftTaperFunction)
        .fftTaperPercent(fftTaperPercent)
        .fkSpectrumWindow(fkSpectrumWindow)
        .fkUncertaintyOption(fkUncertaintyOption)
        .minimumWaveformsForSpectra(minimumWaveformsForSpectra)
        .normalizeWaveforms(normalizeWaveforms)
        .phase(phase)
        .preFilter(preFilter)
        .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
        .slownessGrid(slownessGrid)
        .spectrumStepDuration(spectrumStepDuration)
        .twoDimensional(twoDimensional)
        .waveformSampleRate(waveformSampleRate)
        .build();

    auto horizontalAngle = 35.5;
    auto verticalAngle = 36.6;
    auto orientationAngles = OrientationAngles(horizontalAngle, verticalAngle);

    auto actual = FkSpectraDefinition(fkParameters, orientationAngles);

    EXPECT_EQ(actual.fkParameters.spectrumStepDuration, spectrumStepDuration);
    EXPECT_EQ(actual.fkParameters.fkUncertaintyOption, fkUncertaintyOption);
    EXPECT_EQ(actual.fkParameters.fftTaperFunction, fftTaperFunction);
    EXPECT_EQ(actual.fkParameters.phase, phase);
    EXPECT_EQ(actual.fkParameters.fkFrequencyRange.lowFrequencyHz, lowFrequencyHz);
    EXPECT_EQ(actual.fkParameters.fkFrequencyRange.highFrequencyHz, highFrequencyHz);
    EXPECT_EQ(actual.fkParameters.fkSpectrumWindow.duration, duration);
    EXPECT_EQ(actual.fkParameters.fkSpectrumWindow.lead, lead);
    EXPECT_EQ(actual.fkParameters.slownessGrid.maxSlowness, maxSlowness);
    EXPECT_EQ(actual.fkParameters.slownessGrid.numPoints, numPoints);
    EXPECT_EQ(actual.fkParameters.waveformSampleRate.waveformSampleRateHz, waveformSampleRateHz);
    EXPECT_EQ(actual.fkParameters.waveformSampleRate.waveformSampleRateToleranceHz, waveformSampleRateToleranceHz);
    EXPECT_EQ(actual.orientationAngles.horizontalAngleDeg, horizontalAngle);
    EXPECT_EQ(actual.orientationAngles.verticalAngleDeg, verticalAngle);
}

TEST_F(CoiBuilderTest, FkSpectraDefinition_BLDR_EXCEPTION) {
    auto lowFrequencyHz = 20.5;
    auto highFrequencyHz = 60.5;
    auto fkFrequencyRange = FkFrequencyRange(lowFrequencyHz, highFrequencyHz);

    auto duration = 5;
    auto lead = 6;
    auto fkSpectrumWindow = FkSpectrumWindow(duration, lead);

    auto preFilter = BaseFilterDefinition();

    auto maxSlowness = 22.2;
    auto numPoints = 15000.5;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);

    auto waveformSampleRateHz = 40.0;
    auto waveformSampleRateToleranceHz = 0.05;
    auto waveformSampleRate = FkWaveformSampleRate(waveformSampleRateHz, waveformSampleRateToleranceHz);

    auto fftTaperPercent = 10.5;
    auto minimumWaveformsForSpectra = 11;
    auto spectrumStepDuration = .0345;
    auto normalizeWaveforms = true;
    auto orientationAngleToleranceDeg = 35.5;
    auto twoDimensional = true;
    auto fkUncertaintyOption = FkUncertaintyOption::PERFECT_SIGNAL_COHERENCE;
    auto fftTaperFunction = TaperFunction::COSINE;
    auto phase = "S";

    EXPECT_THROW({
        try
        {
            auto fkParameters = FkSpectraParameters::Builder().fkFrequencyRange(fkFrequencyRange)
                                                    .fftTaperFunction(fftTaperFunction)
                                                    .fftTaperPercent(fftTaperPercent)
                                                    .fkSpectrumWindow(fkSpectrumWindow)
                                                    .fkUncertaintyOption(fkUncertaintyOption)
                                                    .minimumWaveformsForSpectra(minimumWaveformsForSpectra)
                                                    .normalizeWaveforms(normalizeWaveforms)
                                                    .phase(phase)
                                                    .preFilter(preFilter)
                                                    .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
                                                    .slownessGrid(slownessGrid)
                                                    .spectrumStepDuration(spectrumStepDuration)
                                                    .twoDimensional(twoDimensional)
                                                    .build();
        }
        catch (const RequiredPropertyException& e)
        {
            // and this tests that it has the correct message
            EXPECT_STREQ("Required property is missing: [waveformSampleRate, false]", e.what());
            throw;
        }
        }, RequiredPropertyException);

}




/**
 * FkSpectraParameters
*/
TEST_F(CoiBuilderTest, FkSpectraParameters_BLDR) {
    auto lowFrequencyHz = 20.5;
    auto highFrequencyHz = 60.5;
    auto fkFrequencyRange = FkFrequencyRange(lowFrequencyHz, highFrequencyHz);

    auto duration = 5;
    auto lead = 6;
    auto fkSpectrumWindow = FkSpectrumWindow(duration, lead);

    auto preFilter = BaseFilterDefinition();

    auto maxSlowness = 22.2;
    auto numPoints = 15000;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);

    auto waveformSampleRateHz = 40.0;
    auto waveformSampleRateToleranceHz = 0.05;
    auto waveformSampleRate = FkWaveformSampleRate(waveformSampleRateHz, waveformSampleRateToleranceHz);

    auto fftTaperPercent = 10.5;
    auto minimumWaveformsForSpectra = 11;
    auto spectrumStepDuration = .0345;
    auto normalizeWaveforms = true;
    auto orientationAngleToleranceDeg = 35.5;
    auto twoDimensional = true;
    auto fkUncertaintyOption = FkUncertaintyOption::PERFECT_SIGNAL_COHERENCE;
    auto fftTaperFunction = TaperFunction::COSINE;
    auto phase = "S";

    auto actual = FkSpectraParameters::Builder().fkFrequencyRange(fkFrequencyRange)
        .fftTaperFunction(fftTaperFunction)
        .fftTaperPercent(fftTaperPercent)
        .fkSpectrumWindow(fkSpectrumWindow)
        .fkUncertaintyOption(fkUncertaintyOption)
        .minimumWaveformsForSpectra(minimumWaveformsForSpectra)
        .normalizeWaveforms(normalizeWaveforms)
        .phase(phase)
        .preFilter(preFilter)
        .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
        .slownessGrid(slownessGrid)
        .spectrumStepDuration(spectrumStepDuration)
        .twoDimensional(twoDimensional)
        .waveformSampleRate(waveformSampleRate)
        .build();

    EXPECT_EQ(actual.spectrumStepDuration, spectrumStepDuration);
    EXPECT_EQ(actual.fkUncertaintyOption, fkUncertaintyOption);
    EXPECT_EQ(actual.fftTaperFunction, fftTaperFunction);
    EXPECT_EQ(actual.phase, phase);
    EXPECT_EQ(actual.fkFrequencyRange.lowFrequencyHz, lowFrequencyHz);
    EXPECT_EQ(actual.fkFrequencyRange.highFrequencyHz, highFrequencyHz);
    EXPECT_EQ(actual.fkSpectrumWindow.duration, duration);
    EXPECT_EQ(actual.fkSpectrumWindow.lead, lead);
    EXPECT_EQ(actual.slownessGrid.maxSlowness, maxSlowness);
    EXPECT_EQ(actual.slownessGrid.numPoints, numPoints);
    EXPECT_EQ(actual.waveformSampleRate.waveformSampleRateHz, waveformSampleRateHz);
    EXPECT_EQ(actual.waveformSampleRate.waveformSampleRateToleranceHz, waveformSampleRateToleranceHz);
}

TEST_F(CoiBuilderTest, FkSpectraParameters_BLDR_EXCEPTION) {
    auto lowFrequencyHz = 20.5;
    auto highFrequencyHz = 60.5;
    auto fkFrequencyRange = FkFrequencyRange(lowFrequencyHz, highFrequencyHz);

    auto duration = 5;
    auto lead = 6;
    auto fkSpectrumWindow = FkSpectrumWindow(duration, lead);

    auto preFilter = BaseFilterDefinition();

    auto maxSlowness = 22.2;
    auto numPoints = 15000.5;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);

    auto fftTaperPercent = 10.5;
    auto minimumWaveformsForSpectra = 11;
    auto spectrumStepDuration = .0345;
    auto normalizeWaveforms = true;
    auto orientationAngleToleranceDeg = 35.5;
    auto twoDimensional = true;
    auto fkUncertaintyOption = FkUncertaintyOption::PERFECT_SIGNAL_COHERENCE;
    auto fftTaperFunction = TaperFunction::COSINE;
    auto phase = "S";

    EXPECT_THROW({
        try
        {
            auto actual = FkSpectraParameters::Builder().fkFrequencyRange(fkFrequencyRange)
                                                    .fftTaperFunction(fftTaperFunction)
                                                    .fftTaperPercent(fftTaperPercent)
                                                    .fkSpectrumWindow(fkSpectrumWindow)
                                                    .fkUncertaintyOption(fkUncertaintyOption)
                                                    .minimumWaveformsForSpectra(minimumWaveformsForSpectra)
                                                    .normalizeWaveforms(normalizeWaveforms)
                                                    .phase(phase)
                                                    .preFilter(preFilter)
                                                    .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
                                                    .slownessGrid(slownessGrid)
                                                    .spectrumStepDuration(spectrumStepDuration)
                                                    .twoDimensional(twoDimensional)
                                                    .build();
        }
        catch (const RequiredPropertyException& e)
        {
            // and this tests that it has the correct message
            EXPECT_STREQ("Required property is missing: [waveformSampleRate, false]", e.what());
            throw;
        }
        }, RequiredPropertyException);

}


/**
 * QcSegmentVersion
*/
TEST_F(CoiBuilderTest, QcSegmentVersion_BLDR) {
    auto parentQcSegmentId = "Jerry";
    auto creationTime = 1702403100.407;
    auto startTime = 1702403100.407;
    auto endTime = 1702403103.407;

    auto id = QcSegmentVersionId(parentQcSegmentId, creationTime);
    auto channelName = "RALPH";
    auto category = QcSegmentCategory::ANALYST_DEFINED; // optional
    auto channel = ChannelVersionReference(channelName, creationTime);
    std::vector<ChannelVersionReference> channels = { channel };
    auto type = QcSegmentType::AGGREGATE;  //optional
    auto createdBy = "Bob";
    auto rejected = false;
    auto rationale = "None";
    auto stageIdName = "Gary";
    auto stageIdEffectiveAt = creationTime;
    auto stageId = WorkflowDefinitionId(stageIdName, stageIdEffectiveAt);

    auto channelSegDescStartTime = startTime;
    auto channelSegDescEndTime = endTime;
    auto channelSegDescCreationTime = creationTime;

    auto discoveredOnChannelSegDesc = ChannelSegmentDescriptor(channel, channelSegDescStartTime, channelSegDescEndTime, channelSegDescCreationTime);
    std::vector<ChannelSegmentDescriptor> discoveredOn = { discoveredOnChannelSegDesc }; // optional

    // TODO : bad_optional_access error if all optional params aren't passed to test
    auto actualWithOptionals = QcSegmentVersion::Builder()
        .id(id)
        .category(category)
        .channels(channels)
        .type(type)
        .startTime(startTime)
        .endTime(endTime)
        .createdBy(createdBy)
        .rejected(rejected)
        .rationale(rationale)
        .stageId(stageId)
        .discoveredOn(discoveredOn)
        .build();


    EXPECT_EQ(actualWithOptionals.category, category);
    EXPECT_EQ(actualWithOptionals.type, type);
    EXPECT_EQ(actualWithOptionals.stageId.name, stageIdName);
    EXPECT_EQ(actualWithOptionals.stageId.effectiveAt, stageIdEffectiveAt);
    EXPECT_EQ(actualWithOptionals.discoveredOn.at(0).channel.name, channel.name);
    EXPECT_EQ(actualWithOptionals.discoveredOn.at(0).channel.effectiveAt, channel.effectiveAt);
    EXPECT_EQ(actualWithOptionals.discoveredOn.at(0).creationTime, creationTime);
    EXPECT_EQ(actualWithOptionals.discoveredOn.at(0).startTime, startTime);
    EXPECT_EQ(actualWithOptionals.discoveredOn.at(0).endTime, endTime);
}

TEST_F(CoiBuilderTest, QcSegmentVersion_BLDR_EXCEPTION) {
    auto parentQcSegmentId = "Jerry";
    auto creationTime = 1702403100.407;
    auto startTime = 1702403100.407;
    auto endTime = 1702403103.407;

    auto qcSegmentVersionId = QcSegmentVersionId(parentQcSegmentId, creationTime);
    auto channelName = "RALPH";
    auto category = QcSegmentCategory::ANALYST_DEFINED; // optional
    auto channel = ChannelVersionReference(channelName, creationTime);
    std::vector<ChannelVersionReference> channels = { channel };
    auto type = QcSegmentType::AGGREGATE;  //optional
    auto createdBy = "Bob";
    auto rejected = false;
    auto stageIdName = "Gary";
    auto stageIdEffectiveAt = creationTime;
    auto stageId = WorkflowDefinitionId(stageIdName, stageIdEffectiveAt);

    auto channelSegDescStartTime = startTime;
    auto channelSegDescEndTime = endTime;
    auto channelSegDescCreationTime = creationTime;

    auto discoveredOnChannelSegDesc = ChannelSegmentDescriptor(channel, channelSegDescStartTime, channelSegDescEndTime, channelSegDescCreationTime);
    std::vector<ChannelSegmentDescriptor> discoveredOn = { discoveredOnChannelSegDesc }; // optional

    EXPECT_THROW({
        try
        {
            auto actual = QcSegmentVersion::Builder()
                                    .id(qcSegmentVersionId)
                                    .category(category)
                                    .channels(channels)
                                    .type(type)
                                    .startTime(startTime)
                                    .endTime(endTime)
                                    .createdBy(createdBy)
                                    .rejected(rejected)
                                    .stageId(stageId)
                                    .discoveredOn(discoveredOn)
                                    .build();
        }
        catch (const RequiredPropertyException& e)
        {
            // and this tests that it has the correct message
            EXPECT_STREQ("Required property is missing: [rationale, false]", e.what());
            throw;
        }
        }, RequiredPropertyException);
}
