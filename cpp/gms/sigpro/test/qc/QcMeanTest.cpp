#include "QcMeanTest.hh"

void QcMeanTest::SetUp(){}


ProcessingChannelSegment QcMeanTest::buildChannelSegment(std::vector<ProcessingWaveform>& waveforms) {
    return {
        .channelName = "Test",
        .startTime = 1.0,
        .endTime = 11.0 - (1.0 / 40.0),
        .processingMaskCount = 0,
        .northDisplacementKm = 0.0,
        .eastDisplacementKm = 0.0,
        .verticalDisplacementKm = 0.0,
        .waveformCount = static_cast<int>(waveforms.size()),
        .waveforms = waveforms.data()
    };
};

ProcessingWaveform QcMeanTest::buildWaveform(std::vector<double>& waveformData, std::vector<ProcessingMask>& maskedBy) {
    ProcessingWaveform waveform = {
                .channelName = "Test",
                .processingMaskCount = 0,
                .maskedBy = maskedBy.data(),
                .northDisplacementKm = 0.0,
                .eastDisplacementKm = 0.0,
                .verticalDisplacementKm = 0.0,
                .sampleRateHz = 40.0,
                .startTime = 1.0,
                .endTime = 11.0 - (1.0 / 40.0),
                .sampleCount = 10 * 40,
                .data = waveformData.data()
    };
    return waveform;
};

std::vector<ProcessingWaveform> QcMeanTest::buildWaveforms(std::vector<double>& waveformData, std::vector<ProcessingMask>& maskedBy, int waveformCount) {
    std::vector<ProcessingWaveform> waveforms;
    for (int i = 0; i < waveformCount; i++) {
        waveforms.push_back(buildWaveform(waveformData, maskedBy));
    }
    return waveforms;
};

std::vector<double> QcMeanTest::buildWaveformData() {
    std::vector<double> waveformData;
    for (int i = 0; i < waveformSampleCount; i++)
    {
        waveformData.push_back(i % 10);
    }
    return waveformData;
};


TEST_F(QcMeanTest, QC_MEAN_SINGLE_WAVEFORM_NO_MASKS)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,1);
    auto channelSegment = buildChannelSegment(waveforms);
    double mean = qcMean(&channelSegment);

    ASSERT_FLOAT_EQ(mean, 4.5);
}

TEST_F(QcMeanTest, QC_MEAN_SINGLE_WAVEFORM_SINGLE_MASK_NO_OVERLAP)
{

    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,1);
    auto channelSegment = buildChannelSegment(waveforms);

    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 0.25,
       .endTime = 0.75,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);
    ASSERT_FLOAT_EQ(mean, 4.5);
}

TEST_F(QcMeanTest, QC_MEAN_SINGLE_WAVEFORM_SINGLE_MASK_START_OVERLAP)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,1);
    auto channelSegment = buildChannelSegment(waveforms);

    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 0.25,
       .endTime = 1.95,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);
    ASSERT_FLOAT_EQ(mean, 4.512465374);
}

TEST_F(QcMeanTest, QC_MEAN_SINGLE_WAVEFORM_SINGLE_MASK_FULLY_CONTAINED)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,1);
    auto channelSegment = buildChannelSegment(waveforms);

    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 1.95,
       .endTime = 2.25,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);
    ASSERT_FLOAT_EQ(mean, 4.490956072);
}

TEST_F(QcMeanTest, QC_MEAN_SINGLE_WAVEFORM_SINGLE_MASK_END_OVERLAP)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,1);
    auto channelSegment = buildChannelSegment(waveforms);

    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 10.30,
       .endTime = 12.0,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);
    ASSERT_FLOAT_EQ(mean, 4.478494623655914);
}

TEST_F(QcMeanTest, QC_MEAN_TWO_WAVEFORMS_NO_MASKS)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,2);
    auto channelSegment = buildChannelSegment(waveforms);

    long sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    std::vector<double> waveform2Data;
    for (int i = 0; i < sampleCount; i++)
    {
        waveform2Data.push_back(i % 10);
    }

    waveforms[1].startTime = 12.0;
    waveforms[1].endTime = 14.525;
    waveforms[1].sampleRateHz = 40.0;
    waveforms[1].sampleCount = sampleCount;
    waveforms[1].data = waveform2Data.data();

    double mean = qcMean(&channelSegment);

    ASSERT_FLOAT_EQ(mean, 4.484063745);
}

TEST_F(QcMeanTest, QC_MEAN_TWO_WAVEFORMS_SINGLE_MASK_BOTH_OVERLAP)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,2);
    auto channelSegment = buildChannelSegment(waveforms);

    long sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    std::vector<double> waveform2Data;
    for (int i = 0; i < sampleCount; i++)
    {
        waveform2Data.push_back(i % 10);
    }

    channelSegment.waveforms[1].startTime = 12.0;
    channelSegment.waveforms[1].endTime = 14.525;
    channelSegment.waveforms[1].sampleRateHz = 40.0;
    channelSegment.waveforms[1].sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    channelSegment.waveforms[1].data = waveform2Data.data();

    channelSegment.processingMaskCount = 1;
    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 10.30,
       .endTime = 12.50,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);

    ASSERT_FLOAT_EQ(mean, 4.474613687);
}

TEST_F(QcMeanTest, QC_MEAN_TWO_WAVEFORMS_ONE_MASK_ON_FIRST)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,2);
    auto channelSegment = buildChannelSegment(waveforms);

    channelSegment.waveforms[1].startTime = 12.0;
    channelSegment.waveforms[1].endTime = 14.525;
    channelSegment.waveforms[1].sampleRateHz = 40.0;
    channelSegment.waveforms[1].sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    channelSegment.waveformCount = 2;

    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 1.95,
       .endTime = 2.25,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);

    ASSERT_FLOAT_EQ(mean, 4.476482618);
}

TEST_F(QcMeanTest, QC_MEAN_TWO_WAVEFORMS_ONE_MASK_ON_SECOND)
{
    std::vector<ProcessingMask> maskedBy;
    auto waveformData = buildWaveformData();
    auto waveforms = buildWaveforms(waveformData,maskedBy,2);
    auto channelSegment = buildChannelSegment(waveforms);
    channelSegment.waveforms[1].startTime = 12.0;
    channelSegment.waveforms[1].endTime = 14.525;
    channelSegment.waveforms[1].sampleRateHz = 40.0;
    channelSegment.waveforms[1].sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    channelSegment.waveformCount = 2;

    std::vector<ProcessingMask> masksToApply;
    ProcessingMask maskToApply = {
       .processingOperation = PROCESSING_OPERATION::EVENT_BEAM,
       .startTime = 12.95,
       .endTime = 13.25,
       .isFixed = 0
    };
    masksToApply.push_back(maskToApply);
    channelSegment.masksToApply = masksToApply.data();
    channelSegment.processingMaskCount = 1;

    double mean = qcMean(&channelSegment);

    ASSERT_FLOAT_EQ(mean, 4.476482618);
}