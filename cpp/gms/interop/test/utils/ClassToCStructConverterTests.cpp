#include "ClassToCStructConverterTests.hh"

void ClassToCStructConverterTests::SetUp()
{
};


TEST_F(ClassToCStructConverterTests, CONVERT_FK_SPECTRA_DEFINITION)
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

    GmsSigpro::FkSpectraDefinition def = ClassToCStructConverter::convertToStruct(fkParameters, orientationAngles);

    EXPECT_EQ(def.fftTaperPercent, fftTaperPercent);
    EXPECT_EQ(def.highFrequencyHz, highFrequencyHz);
    EXPECT_EQ(def.horizontalAngleDeg, orientationAngles.horizontalAngleDeg);
    EXPECT_EQ(def.lead, lead);
    EXPECT_EQ(def.lowFrequencyHz, lowFrequencyHz);
    EXPECT_EQ(def.maxSlowness, maxSlowness);
    EXPECT_EQ(def.minimumWaveformsForSpectrum, minimumWaveformsForSpectra);
    EXPECT_EQ(def.normalizeWaveforms, normalizeWaveforms);
    EXPECT_EQ(def.numPoints, numPoints);
    EXPECT_EQ(def.spectrumDurationMs, spectrumStepDuration);
    EXPECT_EQ(def.spectrumStepDuration, spectrumStepDuration);
    EXPECT_EQ(def.taperFunction, GmsSigpro::TAPER_FUNCTION::COSINE);
    EXPECT_EQ(def.twoDimensional, twoDimensional);
    EXPECT_EQ(def.uncertaintyOption, GmsSigpro::FK_UNCERTAINTY_OPTION::PERFECT_SIGNAL_COHERENCE);
    EXPECT_EQ(def.verticalAngleDeg, orientationAngles.verticalAngleDeg);
    EXPECT_EQ(def.waveformSampleRateHz, waveformSampleRateHz);
    EXPECT_EQ(def.waveformSampleRateToleranceHz, waveformSampleRateToleranceHz);
};

TEST_F(ClassToCStructConverterTests, CONVERT_WAVEFORM)
{
    std::vector<double> samples;
    auto effectiveAt = 1702403109.407;
    auto startTime = 1702403125.407;
    auto endTime = 1702403145.407;
    auto sampleRate = 40.001;
    auto waveform = Waveform(samples, startTime, endTime, sampleRate);

    auto relativePosition = RelativePosition(90, 90, 90);
    const RelativePosition* relPos = &relativePosition;
    std::string channelName = "RALPH";
    GmsSigpro::ProcessingWaveform def = ClassToCStructConverter::convertToStruct(waveform, *relPos, channelName, {});
    EXPECT_EQ(def.eastDisplacementKm, 90);
    EXPECT_DOUBLE_EQ(def.endTime, endTime);
    EXPECT_EQ(def.northDisplacementKm, 90);
    EXPECT_EQ(def.sampleCount, 0);
    EXPECT_EQ(def.sampleRateHz, sampleRate);
    EXPECT_DOUBLE_EQ(def.startTime, startTime);
    EXPECT_EQ(def.verticalDisplacementKm, 90);

};