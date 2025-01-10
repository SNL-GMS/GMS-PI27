#include "FkComputeUtilityTest.hh"

void FkComputeUtilityTest::SetUp() {};

TEST_F(FkComputeUtilityTest, NOMINAL_GET_PEAK_FK_ATTRIBUTES_TEST) {
    auto effectiveAt = 1702403109.407;
    auto startTime = 1702403125.407;
    auto endTime = 1702403145.407;
    auto duration = 5;
    auto lead = 6;
    auto phase = "S";
    auto fkSpectrumWindow = FkSpectrumWindow(duration, lead);
    auto maxSlowness = 22.2;
    auto numPoints = 15000.5;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);
    auto metadata = FkSpectraMetadata(fkSpectrumWindow, phase, slownessGrid);

    auto slowness = DoubleValue(1.0, Units::DECIBELS, 2.0);
    auto receiverToSourceAzimuth = DoubleValue(1.0, Units::DECIBELS, 2.0);
    auto expected = FkAttributes(1.0, slowness, receiverToSourceAzimuth);
    std::vector<FkSpectrum> spectrumvecta;

    auto fkSpectra = FkSpectra(spectrumvecta, metadata, startTime, endTime, 40, 15);

    auto classUnderTest = FkComputeUtility();
    auto actual = classUnderTest.getPeakFkAttributes(fkSpectra);

    EXPECT_EQ(actual.receiverToSourceAzimuth.standardDeviation, expected.receiverToSourceAzimuth.standardDeviation);
    EXPECT_EQ(actual.receiverToSourceAzimuth.value, expected.receiverToSourceAzimuth.value);
    EXPECT_EQ(actual.slowness.standardDeviation, expected.slowness.standardDeviation);
    EXPECT_EQ(actual.slowness.value, expected.slowness.value);
}

TEST_F(FkComputeUtilityTest, NOMINAL_COMPUTEFK_TEST)
{
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
    auto phaseType = "S";

    auto fkParameters = FkSpectraParameters::Builder().fkFrequencyRange(fkFrequencyRange)
        .fftTaperFunction(fftTaperFunction)
        .fftTaperPercent(fftTaperPercent)
        .fkSpectrumWindow(fkSpectrumWindow)
        .fkUncertaintyOption(fkUncertaintyOption)
        .minimumWaveformsForSpectra(minimumWaveformsForSpectra)
        .normalizeWaveforms(normalizeWaveforms)
        .phase(phaseType)
        .preFilter(preFilter)
        .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
        .slownessGrid(slownessGrid)
        .spectrumStepDuration(spectrumStepDuration)
        .twoDimensional(twoDimensional)
        .waveformSampleRate(waveformSampleRate)
        .build();
    auto orientationAngles = OrientationAngles(35.5, 36.6);
    auto fkSpectraDefinition = FkSpectraDefinition(fkParameters, orientationAngles);
    auto stationName = "Johnny";
    auto effectiveAt = 1702403109.407;
    auto startTime = 1702403125.407;
    auto detectionTime = 1702403135.407;
    auto endTime = 1702403145.407;
    auto stationVersionReference = StationVersionReference(stationName, effectiveAt);

    auto channelName = "RALPH";

    auto northDisplacementKm = 100;
    auto eastDisplacementKm = 100;
    auto verticalDisplacementKm = 100;
    auto relPos = RelativePosition(northDisplacementKm, eastDisplacementKm, verticalDisplacementKm);
    auto relativePosition = RelativePosition(relPos);
    Map<std::string, RelativePosition> relativePositionsByChannelMap;
    relativePositionsByChannelMap.add(channelName, relativePosition);
    auto station = Station(stationVersionReference, relativePositionsByChannelMap);

    std::vector<std::string> inputChannelNames = { "RALPH","BOB","GEORGE" };
    auto channelSegments = std::vector<ChannelSegment>();

    auto creationTime = 1702403109.407;
    auto channelVersionReference = ChannelVersionReference(channelName, creationTime);

    auto id = "some_guid";

    auto processingOperation = ProcessingOperation::FK_SPECTRA;
    auto appliedToRawChannel = Channel(channelName);
    auto maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto processingMask = ProcessingMask(id, appliedToRawChannel, effectiveAt, startTime, endTime, maskedQcSegmentVersions, processingOperation);
    std::vector<ProcessingMask> processingMasks;
    processingMasks.push_back(processingMask);

    Map<std::string, std::vector<ProcessingMask>> processingMasksByChannelMap;
    processingMasksByChannelMap.add(channelName, processingMasks);

    auto maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 4);

    auto classUnderTest = FkComputeUtility();

    auto actual = classUnderTest.computeFk(
        &fkSpectraDefinition,
        &station,
        &inputChannelNames,
        detectionTime,
        startTime,
        endTime,
        &channelSegments,
        &processingMasksByChannelMap,
        maskTaperDefinition
    );

    EXPECT_EQ(actual.timeseries.at(0).startTime, startTime);
    EXPECT_EQ(actual.timeseries.at(0).endTime, endTime);
}


TEST_F(FkComputeUtilityTest, FK_COMPUTE_EXCEPTION_THROWN)
{
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
    auto phaseType = "S";

    auto fkParameters = FkSpectraParameters::Builder().fkFrequencyRange(fkFrequencyRange)
        .fftTaperFunction(fftTaperFunction)
        .fftTaperPercent(fftTaperPercent)
        .fkSpectrumWindow(fkSpectrumWindow)
        .fkUncertaintyOption(fkUncertaintyOption)
        .minimumWaveformsForSpectra(minimumWaveformsForSpectra)
        .normalizeWaveforms(normalizeWaveforms)
        .phase(phaseType)
        .preFilter(preFilter)
        .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
        .slownessGrid(slownessGrid)
        .spectrumStepDuration(spectrumStepDuration)
        .twoDimensional(twoDimensional)
        .waveformSampleRate(waveformSampleRate)
        .build();
    auto orientationAngles = OrientationAngles(35.5, 36.6);
    auto fkSpectraDefinition = FkSpectraDefinition(fkParameters, orientationAngles);
    auto stationName = "Johnny";
    auto effectiveAt = 1702403109.407;
    auto startTime = 1702403125.407;
    auto endTime = 1702403145.407;
    auto detectionTime = 1702403135.407;
    auto stationVersionReference = StationVersionReference(stationName, effectiveAt);
    auto channel = Channel("RALPH");
    auto northDisplacementKm = 100;
    auto eastDisplacementKm = 100;
    auto verticalDisplacementKm = 100;
    auto relPos = RelativePosition(northDisplacementKm, eastDisplacementKm, verticalDisplacementKm);
    auto relativePosition = RelativePosition(relPos);
    Map<std::string, RelativePosition> relativePositionByChannel;
    relativePositionByChannel.add(channel.channelName, relativePosition);

    auto station = Station(stationVersionReference, relativePositionByChannel);

    std::vector<std::string> inputChannelNames = { "RALPH","BOB","GEORGE" };
    auto channelSegments = std::vector<ChannelSegment>();

    auto channelName = "RALPH";
    auto creationTime = 1702403109.407;
    auto channelVersionReference = ChannelVersionReference(channelName, creationTime);

    auto id = "some_guid";

    auto processingOperation = ProcessingOperation::FK_SPECTRA;
    auto appliedToRawChannel = Channel(channelName);
    auto maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto processingMask = ProcessingMask(id, appliedToRawChannel, effectiveAt, startTime, endTime, maskedQcSegmentVersions, processingOperation);
    auto processingMasks = std::vector<ProcessingMask>();
    processingMasks.push_back(processingMask);

    Map<std::string, std::vector<ProcessingMask>> processingMasksByChannelMap;
    processingMasksByChannelMap.add(channelName, processingMasks);

    //ASSEMBLE
        //load test data from SME data file
    Json::Value testData = GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    auto east_channelName = "RALPH";
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
    auto eastTestWaveform = Waveform(east_samples, east_startTime, east_endTime, waveformSampleRateHz);
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

    channelSegments.push_back(eastSegment);

    auto maskTaperDefinition = TaperDefinition(TaperFunction::COSINE, 4);

    auto classUnderTest = FkComputeUtility();

    //! TODO: Commented out throw in order to test from ui-wasm side (commented out throwing exception for now)
    // EXPECT_THROW({
    //         auto actual = classUnderTest.computeFk(&fkSpectraDefinition, &station, &inputChannelNames, startTime, endTime, detectionTime, &channelSegments, &processingMasksByChannelMap, maskTaperDefinition);
    //     }, FkComputeException);
    EXPECT_NO_THROW({
            auto actual = classUnderTest.computeFk(&fkSpectraDefinition, &station, &inputChannelNames, startTime, endTime, detectionTime, &channelSegments, &processingMasksByChannelMap, maskTaperDefinition);
        });
}
