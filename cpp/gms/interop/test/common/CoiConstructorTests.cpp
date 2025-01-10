#include "CoiConstructorTests.hh"

void CoiConstructorTest::SetUp()
{
};

/**
 * DoubleValue
*/
TEST_F(CoiConstructorTest, DoubleValue_CTOR) {
    auto standardDeviation = 0.025;
    auto units = Units::DECIBELS;
    auto value = 666;
    auto actual = DoubleValue(standardDeviation, units, value);
    EXPECT_EQ(actual.standardDeviation, standardDeviation);
    EXPECT_EQ(actual.units, units);
    EXPECT_EQ(actual.value, value);
}



/**
 * OrientationAngles
*/
TEST_F(CoiConstructorTest, OrientationAngles_CTOR) {
    auto horizontalAngle = 35.5;
    auto verticalAngle = 36.6;
    auto actual = OrientationAngles(horizontalAngle, verticalAngle);
    EXPECT_EQ(actual.horizontalAngleDeg, horizontalAngle);
    EXPECT_EQ(actual.verticalAngleDeg, verticalAngle);
}

/**
 * ProcessingMask
*/
TEST_F(CoiConstructorTest, ProcessingMask_CTOR) {
    auto id = "some_guid";
    auto channelName = "RALPH";
    auto effectiveAt = 31536000.123456789;
    auto startTime = 31536010.123456789;
    auto endTime = 31536020.123456789;
    auto processingOperation = ProcessingOperation::FK_SPECTRA;
    auto appliedToRawChannel = Channel(channelName);
    auto maskedQcSegmentVersions = std::vector<QcSegmentVersion>();

    auto actual = ProcessingMask(id, appliedToRawChannel, effectiveAt, startTime, endTime, maskedQcSegmentVersions, processingOperation);
    EXPECT_EQ(actual.id, id);
    EXPECT_EQ(actual.effectiveAt, effectiveAt);
    EXPECT_EQ(actual.startTime, startTime);
    EXPECT_EQ(actual.endTime, endTime);
    EXPECT_EQ(actual.processingOperation, processingOperation);
}

/**
 * QcSegmentCategoryAndType
*/
TEST_F(CoiConstructorTest, QcSegmentCategoryAndType_CTOR) {
    auto category = QcSegmentCategory::ANALYST_DEFINED;
    auto type = QcSegmentType::NOISY;
    auto actual = QcSegmentCategoryAndType(category, type);
    EXPECT_EQ(actual.category, category);
    EXPECT_EQ(actual.type, type);
}



/**
 * SlownessGrid
*/
TEST_F(CoiConstructorTest, SlownessGrid_CTOR) {
    auto maxSlowness = 15.5;
    auto numPoints = 15000;
    auto actual = SlownessGrid(maxSlowness, numPoints);
    EXPECT_EQ(actual.maxSlowness, maxSlowness);
    EXPECT_EQ(actual.numPoints, numPoints);
}



/**
 * TaperDefinition
*/
TEST_F(CoiConstructorTest, TaperDefinition_CTOR) {
    auto taperLengthSamples = 15;
    auto actual = TaperDefinition(TaperFunction::COSINE, taperLengthSamples);
    EXPECT_EQ(actual.taperLengthSamples, taperLengthSamples);
    EXPECT_EQ(actual.taperFunction, TaperFunction::COSINE);
}



/**
 * Timeseries
*/
TEST_F(CoiConstructorTest, Timeseries_CTOR) {
    auto effectiveAt = 31536000.123456789;
    auto startTime = 31536010.123456789;
    auto endTime = 31536020.123456789;
    auto sampleRateHz = 40.0;
    auto sampleCount = 15000;
    auto actual = Timeseries(startTime, endTime, sampleRateHz, sampleCount);
    EXPECT_EQ(actual.startTime, startTime);
    EXPECT_EQ(actual.endTime, endTime);
    EXPECT_EQ(actual.sampleRateHz, sampleRateHz);
    EXPECT_EQ(actual.sampleCount, sampleCount);
}



/**
 * FkAttributes
*/
TEST_F(CoiConstructorTest, FkAttributes_CTOR) {
    auto peakFstat = 80.5;
    auto standardDeviation = 0.025;
    auto units = Units::DECIBELS;
    auto value = 666;
    auto slowness = DoubleValue(standardDeviation, units, value);
    auto receiverToSourceAzimuth = DoubleValue(standardDeviation, units, value);
    auto actual = FkAttributes(peakFstat, slowness, receiverToSourceAzimuth);
    EXPECT_EQ(actual.peakFstat, peakFstat);
    EXPECT_EQ(actual.slowness.standardDeviation, standardDeviation);
    EXPECT_EQ(actual.slowness.units, units);
    EXPECT_EQ(actual.slowness.value, value);
    EXPECT_EQ(actual.receiverToSourceAzimuth.standardDeviation, standardDeviation);
    EXPECT_EQ(actual.receiverToSourceAzimuth.units, units);
    EXPECT_EQ(actual.receiverToSourceAzimuth.value, value);
}



/**
 * FkFrequencyRange
*/
TEST_F(CoiConstructorTest, FkFrequencyRange_CTOR) {
    auto lowFrequencyHz = 25.5;
    auto highFrequencyHz = 65.5;
    auto actual = FkFrequencyRange(lowFrequencyHz, highFrequencyHz);
    EXPECT_EQ(actual.lowFrequencyHz, lowFrequencyHz);
    EXPECT_EQ(actual.highFrequencyHz, highFrequencyHz);
}



/**
 * FkSpectra
*/
TEST_F(CoiConstructorTest, FkSpectra_CTOR) {
    auto duration = 5;
    auto lead = 6;
    auto spectrumWindow = FkSpectrumWindow(duration, lead);

    auto phase = "S";

    auto maxSlowness = 22.2;
    auto numPoints = 15000;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);

    auto metadata = FkSpectraMetadata(spectrumWindow, phase, slownessGrid);
    auto samples = std::vector<FkSpectrum>();
    auto effectiveAt = 31536000.123456789;
    auto startTime = 31536010.123456789;
    auto endTime = 31536020.123456789;
    auto sampleRateHz = 40.5;
    auto sampleCount = 15000;

    auto actual = FkSpectra(samples, metadata, startTime, endTime, sampleRateHz, sampleCount);

    EXPECT_EQ(actual.startTime, startTime);
    EXPECT_EQ(actual.endTime, endTime);
    EXPECT_EQ(actual.sampleRateHz, sampleRateHz);
    EXPECT_EQ(actual.sampleCount, sampleCount);
    EXPECT_EQ(actual.fkSpectraMetadata->phase, phase);
    EXPECT_EQ(actual.fkSpectraMetadata->fkSpectrumWindow.lead, lead);
    EXPECT_EQ(actual.fkSpectraMetadata->fkSpectrumWindow.duration, duration);
    EXPECT_EQ(actual.fkSpectraMetadata->slownessGrid.maxSlowness, maxSlowness);
    EXPECT_EQ(actual.fkSpectraMetadata->slownessGrid.numPoints, numPoints);
}



/**
 * FkSpectraMetadata
*/
TEST_F(CoiConstructorTest, FkSpectraMetadata_CTOR) {
    auto duration = 5;
    auto lead = 6;
    auto spectrumWindow = FkSpectrumWindow(duration, lead);

    auto phase = "S";

    auto maxSlowness = 22.2;
    auto numPoints = 15000;
    auto slownessGrid = SlownessGrid(maxSlowness, numPoints);

    auto actual = FkSpectraMetadata(spectrumWindow, phase, slownessGrid);
    EXPECT_EQ(actual.phase, phase);
    EXPECT_EQ(actual.fkSpectrumWindow.duration, duration);
    EXPECT_EQ(actual.fkSpectrumWindow.lead, lead);
    EXPECT_EQ(actual.slownessGrid.maxSlowness, maxSlowness);
    EXPECT_EQ(actual.slownessGrid.numPoints, numPoints);
}



/**
 * FkSpectrum
*/
TEST_F(CoiConstructorTest, FkSpectrum_CTOR) {
    auto peakFstat = 80.5;
    auto standardDeviation = 0.025;
    auto units = Units::DECIBELS;
    auto value = 666;
    auto slowness = DoubleValue(standardDeviation, units, value);
    auto receiverToSourceAzimuth = DoubleValue(standardDeviation, units, value);
    auto fkAttr = FkAttributes(peakFstat, slowness, receiverToSourceAzimuth);
    std::vector<FkAttributes> fkAttributes = { fkAttr };
    auto fstat = std::vector<std::vector<double>>();
    auto power = std::vector<std::vector<double>>();
    auto fkQual = 45.4;
    auto actual = FkSpectrum(fstat, power, fkAttributes, fkQual);
    EXPECT_EQ(actual.fkQual, fkQual);
    EXPECT_EQ(actual.fkAttributes->at(0).peakFstat, peakFstat);
}



/**
 * FkSpectrumWindow
*/
TEST_F(CoiConstructorTest, FkSpectrumWindow_CTOR) {
    int duration = 500;
    int lead = 10;
    auto actual = FkSpectrumWindow(duration, lead);
    EXPECT_EQ(actual.duration, duration);
    EXPECT_EQ(actual.lead, lead);
}



/**
 * FkWaveformSampleRate
*/
TEST_F(CoiConstructorTest, FkWaveformSampleRate_CTOR) {
    double waveformSampleRateHz = 40.5;
    double waveformSampleRateToleranceHz = .5;
    auto actual = FkWaveformSampleRate(waveformSampleRateHz, waveformSampleRateToleranceHz);
    EXPECT_EQ(actual.waveformSampleRateHz, waveformSampleRateHz);
    EXPECT_EQ(actual.waveformSampleRateToleranceHz, waveformSampleRateToleranceHz);
}



/**
 * QcSegment
*/
TEST_F(CoiConstructorTest, QcSegment_CTOR) {
    auto id = "some_guid";
    auto channel = Channel("RALPH");

    auto parentQcSegmentId = "Jerry";
    auto effectiveAt = 31536000.123456789;
    auto startTime = 31536010.123456789;
    auto endTime = 31536020.123456789;
    auto qcSegmentVersionId = QcSegmentVersionId(parentQcSegmentId, effectiveAt);
    auto channelName = "RALPH";
    auto creationTime = effectiveAt;
    auto category = QcSegmentCategory::ANALYST_DEFINED; // optional

    auto channelVR = ChannelVersionReference(channelName, creationTime);
    std::vector<ChannelVersionReference> channels = { channelVR };

    auto type = QcSegmentType::AGGREGATE;  //optional
    auto createdBy = "Bob";
    auto rejected = false;
    auto rationale = "None";
    auto stageIdName = "Gary";
    auto stageIdEffectiveAt = effectiveAt;
    auto stageId = WorkflowDefinitionId(stageIdName, stageIdEffectiveAt);
    auto channelSegDescStartTime = startTime;
    auto channelSegDescEndTime = endTime;
    auto channelSegDescCreationTime = creationTime;

    auto discoveredOnChannelSegDesc = ChannelSegmentDescriptor(
        channelVR,
        channelSegDescStartTime,
        channelSegDescEndTime,
        channelSegDescCreationTime);

    std::vector<ChannelSegmentDescriptor> discoveredOn = { discoveredOnChannelSegDesc }; // optional

    // TODO : bad_optional_access error if all optional params aren't passed to test
    auto qcSegmentVersion = QcSegmentVersion::Builder()
        .id(qcSegmentVersionId)
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

    auto actual = QcSegment(id, channel, qcSegmentVersion);
    EXPECT_EQ(actual.id, id);
    EXPECT_EQ(actual.channel.channelName, channel.channelName);
}

/**
 * Station
*/
TEST_F(CoiConstructorTest, Station_CTOR) {
    auto stationName = "Johnny";
    auto effectiveAt = 31536000.123456789;
    auto startTime = 31536010.123456789;
    auto endTime = 31536020.123456789;
    auto stationVersionReference = StationVersionReference(stationName, effectiveAt);
    auto channel = Channel("RALPH");
    auto northDisplacementKm = 100;
    auto eastDisplacementKm = 100;
    auto verticalDisplacementKm = 100;
    auto relPos = RelativePosition(northDisplacementKm, eastDisplacementKm, verticalDisplacementKm);
    auto relativePosition = RelativePosition(relPos);
    Map<std::string, RelativePosition> relativePositionsByChannel;
    relativePositionsByChannel.add(channel.channelName, relativePosition);
    auto actual = Station(stationVersionReference, relativePositionsByChannel);

    EXPECT_EQ(actual.stationVersionReference.name, stationName);
    EXPECT_EQ(actual.stationVersionReference.effectiveAt, effectiveAt);
    EXPECT_EQ(actual.relativePositionsByChannel.get(channel.channelName).northDisplacementKm, relPos.northDisplacementKm);
    EXPECT_EQ(actual.relativePositionsByChannel.get(channel.channelName).eastDisplacementKm, relPos.eastDisplacementKm);
    EXPECT_EQ(actual.relativePositionsByChannel.get(channel.channelName).verticalDisplacementKm, relPos.verticalDisplacementKm);
}