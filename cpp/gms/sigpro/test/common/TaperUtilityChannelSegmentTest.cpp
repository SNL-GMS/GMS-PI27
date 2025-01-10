#include "TaperUtilityChannelSegmentTest.hh"

void TaperUtilityChannelSegmentTest::SetUp()
{
}

void TaperUtilityChannelSegmentTest::createValidationCaseData()
{
    taperDefinition.taperLength = 1.0;
    taperDefinition.taperFunction = COSINE;

    channelSegment.channelName = "Test Channel";
    channelSegment.processingMaskCount = 0;
    channelSegment.masksToApply = (ProcessingMask*)NULL;
    channelSegment.startTime = 1.0;
    channelSegment.endTime = 11.0;
    channelSegment.northDisplacementKm = 0.0;
    channelSegment.eastDisplacementKm = 0.0;
    channelSegment.verticalDisplacementKm = 0.0;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = 40.0;
    channelSegment.waveforms[0].startTime = 1.0;
    channelSegment.waveforms[0].endTime = 11.0;
    channelSegment.waveforms[0].sampleCount = 40.0 * 10.0;
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) NULL;
    
    channelSegment.waveforms[0].data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = (double)(i % 10);
    }
};

void TaperUtilityChannelSegmentTest::TearDown()
{
    if (channelSegment.masksToApply)
    {
        free(channelSegment.masksToApply);
    }

    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        free(channelSegment.waveforms[i].data);

        if (channelSegment.waveforms[i].maskedBy)
        {
            free(channelSegment.waveforms[i].maskedBy);
        }
    }

    free(channelSegment.waveforms);
}

TEST_F(TaperUtilityChannelSegmentTest, NO_MASK_TEST)
{
    createValidationCaseData();
    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], (double)(i % 10), error);
    }
}

TEST_F(TaperUtilityChannelSegmentTest, NO_OVERLAP_TEST)
{
    createValidationCaseData();

    ProcessingMask mask;
    mask.processingOperation = EVENT_BEAM;
    mask.startTime = 11.5;
    mask.endTime = 12.0;
    mask.isFixed = 0;
    channelSegment.waveforms[0].processingMaskCount = 1;
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*)malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = mask;

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], (double)(i % 10), error);
    }
}

TEST_F(TaperUtilityChannelSegmentTest, FULL_OVERLAP_TEST)
{
    createValidationCaseData();

    ProcessingMask mask;
    mask.processingOperation = EVENT_BEAM;
    mask.startTime = 0.0;
    mask.endTime = 12.0;
    mask.isFixed = 0;
    channelSegment.waveforms[0].processingMaskCount = 1;
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = mask;

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = 0;
    }

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], 0.0, error);
    }
}

TEST_F(TaperUtilityChannelSegmentTest, SINGLE_FIXED_MASK_TEST)
{
    createValidationCaseData();
    channelSegment.waveforms[0].processingMaskCount = 1;

    ProcessingMask mask;
    mask.processingOperation = EVENT_BEAM;
    mask.startTime = 2.25;
    mask.endTime = 2.5;
    mask.isFixed = 1;
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = mask;

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], (double)(i % 10), error);
    }
}

TEST_F(TaperUtilityChannelSegmentTest, SINGLE_MASK_START_OVERLAP_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("startOverlapTaperUtilityTest.json");

    channelSegment.channelName = data["waveform"]["channelName"].asCString();
    channelSegment.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    channelSegment.masksToApply = (ProcessingMask*) malloc(channelSegment.processingMaskCount * sizeof(ProcessingMask));

    channelSegment.masksToApply[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    channelSegment.masksToApply[0].startTime = data["waveform"]["maskedBy"][0]["startTime"].asDouble();
    channelSegment.masksToApply[0].endTime = data["waveform"]["maskedBy"][0]["endTime"].asDouble();
    channelSegment.masksToApply[0].isFixed = data["waveform"]["maskedBy"][0]["isFixed"].asInt();

    channelSegment.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    channelSegment.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    channelSegment.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();

    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    channelSegment.waveforms[0].startTime = data["waveform"]["startTime"].asDouble();
    channelSegment.waveforms[0].endTime = data["waveform"]["endTime"].asDouble();
    channelSegment.waveforms[0].sampleCount = data["waveform"]["sampleCount"].asDouble();
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = channelSegment.masksToApply[0];
    channelSegment.waveforms[0].data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = data["waveform"]["data"][i].asDouble();
    }

    taperDefinition.taperLength = data["taperDefinition"]["taperLength"].asDouble();
    taperDefinition.taperFunction = (TAPER_FUNCTION)data["taperDefinition"]["taperFunction"].asInt();

    ProcessingWaveform result;
    result.channelName = data["outputWaveform"]["channelName"].asCString();
    result.processingMaskCount = data["outputWaveform"]["processingMaskCount"].asInt();
    result.maskedBy = (ProcessingMask*)malloc(result.processingMaskCount * sizeof(ProcessingMask));

    result.maskedBy[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    result.maskedBy[0].startTime = data["outputWaveform"]["maskedBy"][0]["startTime"].asDouble();
    result.maskedBy[0].endTime = data["outputWaveform"]["maskedBy"][0]["endTime"].asDouble();
    result.maskedBy[0].isFixed = data["outputWaveform"]["maskedBy"][0]["isFixed"].asInt();

    result.northDisplacementKm = data["outputWaveform"]["northDisplacementKm"].asDouble();
    result.eastDisplacementKm = data["outputWaveform"]["eastDisplacementKm"].asDouble();
    result.verticalDisplacementKm = data["outputWaveform"]["verticalDisplacementKm"].asDouble();
    result.sampleRateHz = data["outputWaveform"]["sampleRateHz"].asDouble();
    result.startTime = data["outputWaveform"]["startTime"].asDouble();
    result.endTime = data["outputWaveform"]["endTime"].asDouble();
    result.sampleCount = data["outputWaveform"]["sampleCount"].asDouble();
    result.data = (double*)malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        double actual = channelSegment.waveforms[0].data[i];
        double expected = result.data[i];
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}

TEST_F(TaperUtilityChannelSegmentTest, SINGLE_MASK_END_OVERLAP_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("endOverlapTaperUtilityTest.json");

    channelSegment.channelName = data["waveform"]["channelName"].asCString();
    channelSegment.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    channelSegment.masksToApply = (ProcessingMask*) malloc(channelSegment.processingMaskCount * sizeof(ProcessingMask));

    channelSegment.masksToApply[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    channelSegment.masksToApply[0].startTime = data["waveform"]["maskedBy"][0]["startTime"].asDouble();
    channelSegment.masksToApply[0].endTime = data["waveform"]["maskedBy"][0]["endTime"].asDouble();
    channelSegment.masksToApply[0].isFixed = data["waveform"]["maskedBy"][0]["isFixed"].asInt();

    channelSegment.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    channelSegment.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    channelSegment.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    channelSegment.waveforms[0].startTime = data["waveform"]["startTime"].asDouble();
    channelSegment.waveforms[0].endTime = data["waveform"]["endTime"].asDouble();
    channelSegment.waveforms[0].sampleCount = data["waveform"]["sampleCount"].asDouble();
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = channelSegment.masksToApply[0];
    channelSegment.waveforms[0].data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = data["waveform"]["data"][i].asDouble();
    }

    taperDefinition.taperLength = data["taperDefinition"]["taperLength"].asDouble();
    taperDefinition.taperFunction = (TAPER_FUNCTION)data["taperDefinition"]["taperFunction"].asInt();

    ProcessingWaveform result;
    result.channelName = data["outputWaveform"]["channelName"].asCString();
    result.processingMaskCount = data["outputWaveform"]["processingMaskCount"].asInt();
    result.maskedBy = (ProcessingMask*) nullptr;

    result.sampleRateHz = data["outputWaveform"]["sampleRateHz"].asDouble();
    result.startTime = data["outputWaveform"]["startTime"].asDouble();
    result.endTime = data["outputWaveform"]["endTime"].asDouble();
    result.sampleCount = data["outputWaveform"]["sampleCount"].asDouble();
    result.data = (double*)malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}

TEST_F(TaperUtilityChannelSegmentTest, SINGLE_MASK_FULLY_CONTAINED_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("fullyContainedTaperUtilityTest.json");

    channelSegment.channelName = data["waveform"]["channelName"].asCString();
    channelSegment.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    channelSegment.masksToApply = (ProcessingMask*)malloc(channelSegment.processingMaskCount * sizeof(ProcessingMask));

    channelSegment.masksToApply[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    channelSegment.masksToApply[0].startTime = data["waveform"]["maskedBy"][0]["startTime"].asDouble();
    channelSegment.masksToApply[0].endTime = data["waveform"]["maskedBy"][0]["endTime"].asDouble();
    channelSegment.masksToApply[0].isFixed = data["waveform"]["maskedBy"][0]["isFixed"].asInt();

    channelSegment.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    channelSegment.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    channelSegment.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    channelSegment.waveforms[0].startTime = data["waveform"]["startTime"].asDouble();
    channelSegment.waveforms[0].endTime = data["waveform"]["endTime"].asDouble();
    channelSegment.waveforms[0].sampleCount = data["waveform"]["sampleCount"].asDouble();
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = channelSegment.masksToApply[0];
    channelSegment.waveforms[0].data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = data["waveform"]["data"][i].asDouble();
    }

    taperDefinition.taperLength = data["taperDefinition"]["taperLength"].asDouble();
    taperDefinition.taperFunction = (TAPER_FUNCTION)data["taperDefinition"]["taperFunction"].asInt();

    ProcessingWaveform result;
    result.channelName = data["outputWaveform"]["channelName"].asCString();
    result.processingMaskCount = data["outputWaveform"]["processingMaskCount"].asInt();
    result.maskedBy = (ProcessingMask*)malloc(result.processingMaskCount * sizeof(ProcessingMask));

    result.sampleRateHz = data["outputWaveform"]["sampleRateHz"].asDouble();
    result.startTime = data["outputWaveform"]["startTime"].asDouble();
    result.endTime = data["outputWaveform"]["endTime"].asDouble();
    result.sampleCount = data["outputWaveform"]["sampleCount"].asDouble();
    result.data = (double*)malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}

TEST_F(TaperUtilityChannelSegmentTest, THREE_MASK_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("threeMaskTaperUtilityTest.json");

    channelSegment.channelName = data["waveform"]["channelName"].asCString();
    channelSegment.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    channelSegment.masksToApply = (ProcessingMask*) malloc(channelSegment.processingMaskCount * sizeof(ProcessingMask));

    for (int i = 0; i < channelSegment.processingMaskCount; i++)
    {
        channelSegment.masksToApply[i].startTime = data["waveform"]["maskedBy"][i]["startTime"].asDouble();
        channelSegment.masksToApply[i].endTime = data["waveform"]["maskedBy"][i]["endTime"].asDouble();
        channelSegment.masksToApply[i].isFixed = data["waveform"]["maskedBy"][i]["isFixed"].asInt();
    }

    channelSegment.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    channelSegment.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    channelSegment.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    channelSegment.waveforms[0].startTime = data["waveform"]["startTime"].asDouble();
    channelSegment.waveforms[0].endTime = data["waveform"]["endTime"].asDouble();
    channelSegment.waveforms[0].sampleCount = data["waveform"]["sampleCount"].asDouble();
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.waveforms[0].maskedBy[0] = channelSegment.masksToApply[0];
    channelSegment.waveforms[0].data = (double*)malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = data["waveform"]["data"][i].asDouble();
    }

    taperDefinition.taperLength = data["taperDefinition"]["taperLength"].asDouble();
    taperDefinition.taperFunction = (TAPER_FUNCTION)data["taperDefinition"]["taperFunction"].asInt();

    ProcessingWaveform result;
    result.channelName = data["outputWaveform"]["channelName"].asCString();
    result.processingMaskCount = data["outputWaveform"]["processingMaskCount"].asInt();
    result.maskedBy = (ProcessingMask*)malloc(result.processingMaskCount * sizeof(ProcessingMask));

    result.sampleRateHz = data["outputWaveform"]["sampleRateHz"].asDouble();
    result.startTime = data["outputWaveform"]["startTime"].asDouble();
    result.endTime = data["outputWaveform"]["endTime"].asDouble();
    result.sampleCount = data["outputWaveform"]["sampleCount"].asDouble();
    result.data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaperChannelSegment(&taperDefinition, &channelSegment);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_NEAR(channelSegment.waveforms[0].data[i], result.data[i], error);
    }    

    free(result.maskedBy);
    free(result.data);
}