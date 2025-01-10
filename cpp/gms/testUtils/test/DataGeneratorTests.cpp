#include "DataGeneratorTests.hh"

void DataGeneratorTests::SetUp()
{
};

TEST_F(DataGeneratorTests, VERIFY_GENERATED_WAVEFORM)
{
    auto lengthInSeconds = 720;
    auto sampleRateHz = 40.0;
    auto amplitude = 55;
    auto expectedWaveformSampleSize = lengthInSeconds * sampleRateHz;

    auto waveform = GmsTestUtils::DataGenerator::generateSine(lengthInSeconds, sampleRateHz, amplitude);
    EXPECT_EQ(waveform.size(), expectedWaveformSampleSize);
    //ensure every ninth sample is zero
    int sampleCount = 0;
    for(double sample : waveform){
        if(sampleCount % 9 == 0){
            EXPECT_EQ(sample, 0);
        }
        sampleCount++;
    }

}