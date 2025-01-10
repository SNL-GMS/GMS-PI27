#include "TaperTest.hh"

void TaperTest::SetUp()
{
};

TEST_F(TaperTest, BLACKMAN_TAPER_TEST_0_SAMPLES)
{
    double* inputSignal = (double*) malloc(100 * sizeof(double));

    for (int i = 0; i < 100; i++)
    {
        inputSignal[i] = 1.0;
    }

    double percentTapered = blackmanTaper(inputSignal, 0);
    ASSERT_DOUBLE_EQ(percentTapered, 1.0);

    for (int i = 0; i < 100; i++)
    {
        ASSERT_DOUBLE_EQ(inputSignal[i], 1.0);
    }

    free(inputSignal);
}

TEST_F(TaperTest, BLACKMAN_TAPER_TEST)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("blackmanTaperData.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double taperPercent = data["percentTapered"].asDouble();

    double actualTaperPercent = blackmanTaper(inputSignal, sampleCount);

    EXPECT_NEAR(actualTaperPercent, taperPercent, error);
    for (int i = 0; i < sampleCount; i++)
    {
        EXPECT_NEAR(inputSignal[i], outputSignal[i], error);
    }

    free(inputSignal);
    free(outputSignal);
}

TEST_F(TaperTest, COSINE_TAPER_TEST_100_SAMPLES_2_TO_3)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("cosineTaperData2.0To3.0.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));
    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double startValue = data["startValue"].asDouble();
    double endValue = data["endValue"].asDouble();

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));
    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double expectedPercentTapered = data["percentTapered"].asDouble();

    double percentTapered = cosineTaper(inputSignal, sampleCount, startValue, endValue);

    ASSERT_NEAR(percentTapered, expectedPercentTapered, error);

    for (int i = 0; i < sampleCount; i++)
    {
        ASSERT_NEAR(inputSignal[i], outputSignal[i], error);
    }

    free(inputSignal);
    free(outputSignal);
}

TEST_F(TaperTest, COSINE_TAPER_TEST_100_SAMPLES_0_25_TO_0_75)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("cosineTaperData0.25To0.75.json");
    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));
    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double startValue = data["startValue"].asDouble();
    double endValue = data["endValue"].asDouble();

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));
    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double expectedPercentTapered = data["percentTapered"].asDouble();

    double percentTapered = cosineTaper(inputSignal, sampleCount, startValue, endValue);

    ASSERT_NEAR(percentTapered, expectedPercentTapered, error);

    for (int i = 0; i < sampleCount; i++)
    {
        ASSERT_NEAR(inputSignal[i], outputSignal[i], error);
    }

    free(inputSignal);
    free(outputSignal);
}

TEST_F(TaperTest, COSINE_TAPER_TEST_100_SAMPLES_0_75_TO_3)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("cosineTaperData0.75To3.0.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));
    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double startValue = data["startValue"].asDouble();
    double endValue = data["endValue"].asDouble();

    double* expected = (double*) malloc(sampleCount * sizeof(double));
    for (int i = 0; i < sampleCount; i++)
    {
        expected[i] = data["taperedSignal"][i].asDouble();
    }

    double expectedPercentTapered = data["percentTapered"].asDouble();

    double percentTapered = cosineTaper(inputSignal, sampleCount, startValue, endValue);

    ASSERT_NEAR(percentTapered, expectedPercentTapered, error);

    for (int i = 0; i < sampleCount; i++)
    {
        ASSERT_NEAR(inputSignal[i], expected[i], error);
    }

    free(inputSignal);
    free(expected);
}

TEST_F(TaperTest, COSINE_TAPER_TEST_0_SAMPLES)
{
    double* inputSignal = (double*) malloc(100 * sizeof(double));

    for (int i = 0; i < 100; i++)
    {
        inputSignal[i] = 1.0;
    }

    double percentTapered = cosineTaper(inputSignal, 0, 0.25, 0.75);
    ASSERT_DOUBLE_EQ(percentTapered, 1.0);

    for (int i = 0; i < 100; i++)
    {
        ASSERT_DOUBLE_EQ(inputSignal[i], 1.0);
    }

    free(inputSignal);
}

TEST_F(TaperTest, HAMMING_TAPER_TEST_0_SAMPLES)
{
    double* inputSignal = (double*) malloc(100 * sizeof(double));

    for (int i = 0; i < 100; i++)
    {
        inputSignal[i] = 1.0;
    }

    double percentTapered = hammingTaper(inputSignal, 0);
    ASSERT_DOUBLE_EQ(percentTapered, 1.0);

    for (int i = 0; i < 100; i++)
    {
        ASSERT_DOUBLE_EQ(inputSignal[i], 1.0);
    }

    free(inputSignal);
}

TEST_F(TaperTest, HAMMING_TAPER_TEST_100_SAMPLES)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("hammingTaperData.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double taperPercent = data["percentTapered"].asDouble();

    double actualTaperPercent = hammingTaper(inputSignal, sampleCount);

    EXPECT_NEAR(actualTaperPercent, taperPercent, error);
    for (int i = 0; i < sampleCount; i++)
    {
        EXPECT_NEAR(inputSignal[i], outputSignal[i], error);
    }

    free(inputSignal);
    free(outputSignal);
}

TEST_F(TaperTest, HANNING_TAPER_TEST_0_SAMPLES)
{
    double* inputSignal = (double*) malloc(100 * sizeof(double));

    for (int i = 0; i < 100; i++)
    {
        inputSignal[i] = 1.0;
    }

    double percentTapered = hanningTaper(inputSignal, 0);
    ASSERT_DOUBLE_EQ(percentTapered, 1.0);

    for (int i = 0; i < 100; i++)
    {
        ASSERT_DOUBLE_EQ(inputSignal[i], 1.0);
    }

    free(inputSignal);
}

TEST_F(TaperTest, HANNING_TAPER_TEST_100_SAMPLES)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("hanningTaperData.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double taperPercent = data["percentTapered"].asDouble();

    double actualTaperPercent = cosineTaper(inputSignal, sampleCount, 0.5, 0.5);

    EXPECT_NEAR(actualTaperPercent, taperPercent, error);
    for (int i = 0; i < sampleCount; i++)
    {
        EXPECT_NEAR(inputSignal[i], outputSignal[i], error);
    }      

    free(inputSignal);
    free(outputSignal);
}

TEST_F(TaperTest, PARZEN_TAPER_ZERO_SAMPLES_TEST)
{
    double* inputSignal = (double*) malloc(100 * sizeof(double));

    for (int i = 0; i < 100; i++)
    {
        inputSignal[i] = 1.0;
    }

    double percentTapered = parzenTaper(inputSignal, 0);
    ASSERT_DOUBLE_EQ(percentTapered, 1.0);

    for (int i = 0; i < 100; i++)
    {
        ASSERT_DOUBLE_EQ(inputSignal[i], 1.0);
    }

    free(inputSignal);
}

TEST_F(TaperTest, PARZEN_TAPER_100_SAMPLES_TEST)
{
    Json::Value data = GmsTestUtils::FileLoader::getJson("parzenTaperData.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double taperPercent = data["percentTapered"].asDouble();

    double actualTaperPercent = parzenTaper(inputSignal, sampleCount);

    EXPECT_NEAR(actualTaperPercent, taperPercent, error);
    for (int i = 0; i < sampleCount; i++)
    {
        EXPECT_NEAR(inputSignal[i], outputSignal[i], error);
    }  

    free(inputSignal);
    free(outputSignal);
}

TEST_F(TaperTest, WELCH_TAPER_ZERO_SAMPLES_TEST)
{
    double* inputSignal = (double*) malloc(100 * sizeof(double));

    for (int i = 0; i < 100; i++)
    {
        inputSignal[i] = 1.0;
    }

    double percentTapered = welchTaper(inputSignal, 0);
    ASSERT_DOUBLE_EQ(percentTapered, 1.0);

    for (int i = 0; i < 100; i++)
    {
        ASSERT_DOUBLE_EQ(inputSignal[i], 1.0);
    }

    free(inputSignal);
}

TEST_F(TaperTest, WELCH_TAPER_100_SAMPLES_TEST)
{
    Json::Value data = GmsTestUtils::FileLoader::getJson("welchTaperData.json");

    int sampleCount = data["sampleCount"].asInt();

    double* inputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        inputSignal[i] = data["inputSignal"][i].asDouble();
    }

    double* outputSignal = (double*) malloc(sampleCount * sizeof(double));

    for (int i = 0; i < sampleCount; i++)
    {
        outputSignal[i] = data["taperedSignal"][i].asDouble();
    }

    double taperPercent = data["percentTapered"].asDouble();

    double actualTaperPercent = welchTaper(inputSignal, sampleCount);

    EXPECT_NEAR(actualTaperPercent, taperPercent, error);
    for (int i = 0; i < sampleCount; i++)
    {
        EXPECT_NEAR(inputSignal[i], outputSignal[i], error);
    }  

    free(inputSignal);
    free(outputSignal);
}