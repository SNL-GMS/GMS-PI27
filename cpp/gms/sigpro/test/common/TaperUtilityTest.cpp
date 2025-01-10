#include "TaperUtilityTest.hh"

void TaperUtilityTest::SetUp()
{
}

void TaperUtilityTest::createValidationCaseData()
{
    taperDefinition.taperLength = 1.0;
    taperDefinition.taperFunction = COSINE;

    waveform.channelName = "Test Channel";
    waveform.processingMaskCount = 0;
    waveform.maskedBy = (ProcessingMask*)NULL;
    waveform.northDisplacementKm = 0.0;
    waveform.eastDisplacementKm = 0.0;
    waveform.verticalDisplacementKm = 0.0;
    waveform.sampleRateHz = 40.0;
    waveform.startTime = 1.0;
    waveform.endTime = 11.0;
    waveform.sampleCount = 40.0 * 10.0;

    waveform.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = (double)(i % 10);
    }
};

void TaperUtilityTest::TearDown()
{
    free(waveform.data);
    if (waveform.maskedBy)
    {
        free(waveform.maskedBy);
    }
}

TEST_F(TaperUtilityTest, NO_MASK_TEST)
{
    createValidationCaseData();
    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], (double)(i % 10), error);
    }
}

TEST_F(TaperUtilityTest, NO_OVERLAP_TEST)
{
    createValidationCaseData();

    ProcessingMask mask;
    mask.processingOperation = EVENT_BEAM;
    mask.startTime = 11.5;
    mask.endTime = 12.0;
    mask.isFixed = 0;
    waveform.processingMaskCount = 1;
    waveform.maskedBy = (ProcessingMask*)malloc(sizeof(ProcessingMask));
    waveform.maskedBy[0] = mask;

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], (double)(i % 10), error);
    }
}

TEST_F(TaperUtilityTest, FULL_OVERLAP_TEST)
{
    createValidationCaseData();

    ProcessingMask mask;
    mask.processingOperation = EVENT_BEAM;
    mask.startTime = 0.0;
    mask.endTime = 12.0;
    mask.isFixed = 0;
    waveform.processingMaskCount = 1;
    waveform.maskedBy = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    waveform.maskedBy[0] = mask;

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = 0;
    }

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], 0.0, error);
    }
}

TEST_F(TaperUtilityTest, SINGLE_FIXED_MASK_TEST)
{
    createValidationCaseData();
    waveform.processingMaskCount = 1;

    ProcessingMask mask;
    mask.processingOperation = EVENT_BEAM;
    mask.startTime = 2.25;
    mask.endTime = 2.5;
    mask.isFixed = 1;
    waveform.maskedBy = (ProcessingMask*)malloc(sizeof(ProcessingMask));
    waveform.maskedBy[0] = mask;

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], (double)(i % 10), error);
    }
}

TEST_F(TaperUtilityTest, SINGLE_MASK_START_OVERLAP_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("startOverlapTaperUtilityTest.json");

    waveform.channelName = data["waveform"]["channelName"].asCString();
    waveform.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    waveform.maskedBy = (ProcessingMask*)malloc(waveform.processingMaskCount * sizeof(ProcessingMask));

    waveform.maskedBy[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    waveform.maskedBy[0].startTime = data["waveform"]["maskedBy"][0]["startTime"].asDouble();
    waveform.maskedBy[0].endTime = data["waveform"]["maskedBy"][0]["endTime"].asDouble();
    waveform.maskedBy[0].isFixed = data["waveform"]["maskedBy"][0]["isFixed"].asInt();

    waveform.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    waveform.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    waveform.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    waveform.sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    waveform.startTime = data["waveform"]["startTime"].asDouble();
    waveform.endTime = data["waveform"]["endTime"].asDouble();
    waveform.sampleCount = data["waveform"]["sampleCount"].asDouble();
    waveform.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = data["waveform"]["data"][i].asDouble();
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
    result.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        double actual = waveform.data[i];
        double expected = result.data[i];
        ASSERT_NEAR(waveform.data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}

TEST_F(TaperUtilityTest, SINGLE_MASK_END_OVERLAP_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("endOverlapTaperUtilityTest.json");

    waveform.channelName = data["waveform"]["channelName"].asCString();
    waveform.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    waveform.maskedBy = (ProcessingMask*)malloc(waveform.processingMaskCount * sizeof(ProcessingMask));

    waveform.maskedBy[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    waveform.maskedBy[0].startTime = data["waveform"]["maskedBy"][0]["startTime"].asDouble();
    waveform.maskedBy[0].endTime = data["waveform"]["maskedBy"][0]["endTime"].asDouble();
    waveform.maskedBy[0].isFixed = data["waveform"]["maskedBy"][0]["isFixed"].asInt();

    waveform.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    waveform.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    waveform.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    waveform.sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    waveform.startTime = data["waveform"]["startTime"].asDouble();
    waveform.endTime = data["waveform"]["endTime"].asDouble();
    waveform.sampleCount = data["waveform"]["sampleCount"].asDouble();
    waveform.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = data["waveform"]["data"][i].asDouble();
    }

    taperDefinition.taperLength = data["taperDefinition"]["taperLength"].asDouble();
    taperDefinition.taperFunction = (TAPER_FUNCTION)data["taperDefinition"]["taperFunction"].asInt();

    ProcessingWaveform result;
    result.channelName = data["outputWaveform"]["channelName"].asCString();
    result.processingMaskCount = data["outputWaveform"]["processingMaskCount"].asInt();
    result.maskedBy = (ProcessingMask*)malloc(waveform.processingMaskCount * sizeof(ProcessingMask));

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
    result.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}

TEST_F(TaperUtilityTest, SINGLE_MASK_FULLY_CONTAINED_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("fullyContainedTaperUtilityTest.json");

    waveform.channelName = data["waveform"]["channelName"].asCString();
    waveform.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    waveform.maskedBy = (ProcessingMask*)malloc(waveform.processingMaskCount * sizeof(ProcessingMask));

    waveform.maskedBy[0].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][0]["processingOperation"].asInt();
    waveform.maskedBy[0].startTime = data["waveform"]["maskedBy"][0]["startTime"].asDouble();
    waveform.maskedBy[0].endTime = data["waveform"]["maskedBy"][0]["endTime"].asDouble();
    waveform.maskedBy[0].isFixed = data["waveform"]["maskedBy"][0]["isFixed"].asInt();

    waveform.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    waveform.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    waveform.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    waveform.sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    waveform.startTime = data["waveform"]["startTime"].asDouble();
    waveform.endTime = data["waveform"]["endTime"].asDouble();
    waveform.sampleCount = data["waveform"]["sampleCount"].asDouble();
    waveform.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = data["waveform"]["data"][i].asDouble();
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
    result.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}

TEST_F(TaperUtilityTest, THREE_MASK_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("threeMaskTaperUtilityTest.json");

    waveform.channelName = data["waveform"]["channelName"].asCString();
    waveform.processingMaskCount = data["waveform"]["processingMaskCount"].asInt();
    waveform.maskedBy = (ProcessingMask*)malloc(waveform.processingMaskCount * sizeof(ProcessingMask));

    for (int i = 0; i < waveform.processingMaskCount; i++)
    {
        waveform.maskedBy[i].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][i]["processingOperation"].asInt();
        waveform.maskedBy[i].startTime = data["waveform"]["maskedBy"][i]["startTime"].asDouble();
        waveform.maskedBy[i].endTime = data["waveform"]["maskedBy"][i]["endTime"].asDouble();
        waveform.maskedBy[i].isFixed = data["waveform"]["maskedBy"][i]["isFixed"].asInt();
    }

    waveform.northDisplacementKm = data["waveform"]["northDisplacementKm"].asDouble();
    waveform.eastDisplacementKm = data["waveform"]["eastDisplacementKm"].asDouble();
    waveform.verticalDisplacementKm = data["waveform"]["verticalDisplacementKm"].asDouble();
    waveform.sampleRateHz = data["waveform"]["sampleRateHz"].asDouble();
    waveform.startTime = data["waveform"]["startTime"].asDouble();
    waveform.endTime = data["waveform"]["endTime"].asDouble();
    waveform.sampleCount = data["waveform"]["sampleCount"].asDouble();
    waveform.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = data["waveform"]["data"][i].asDouble();
    }

    taperDefinition.taperLength = data["taperDefinition"]["taperLength"].asDouble();
    taperDefinition.taperFunction = (TAPER_FUNCTION)data["taperDefinition"]["taperFunction"].asInt();

    ProcessingWaveform result;
    result.channelName = data["outputWaveform"]["channelName"].asCString();
    result.processingMaskCount = data["outputWaveform"]["processingMaskCount"].asInt();
    result.maskedBy = (ProcessingMask*)malloc(result.processingMaskCount * sizeof(ProcessingMask));

    for (int i = 0; i < result.processingMaskCount; i++)
    {
        result.maskedBy[i].processingOperation = (PROCESSING_OPERATION)data["waveform"]["maskedBy"][i]["processingOperation"].asInt();
        result.maskedBy[i].startTime = data["outputWaveform"]["maskedBy"][i]["startTime"].asDouble();
        result.maskedBy[i].endTime = data["outputWaveform"]["maskedBy"][i]["endTime"].asDouble();
        result.maskedBy[i].isFixed = data["outputWaveform"]["maskedBy"][i]["isFixed"].asInt();
    }

    result.northDisplacementKm = data["outputWaveform"]["northDisplacementKm"].asDouble();
    result.eastDisplacementKm = data["outputWaveform"]["eastDisplacementKm"].asDouble();
    result.verticalDisplacementKm = data["outputWaveform"]["verticalDisplacementKm"].asDouble();
    result.sampleRateHz = data["outputWaveform"]["sampleRateHz"].asDouble();
    result.startTime = data["outputWaveform"]["startTime"].asDouble();
    result.endTime = data["outputWaveform"]["endTime"].asDouble();
    result.sampleCount = data["outputWaveform"]["sampleCount"].asDouble();
    result.data = (double*)malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        result.data[i] = data["outputWaveform"]["data"][i].asDouble();
    }

    int status = qcTaper(&waveform, &taperDefinition);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        ASSERT_NEAR(waveform.data[i], result.data[i], error);
    }

    free(result.maskedBy);
    free(result.data);
}