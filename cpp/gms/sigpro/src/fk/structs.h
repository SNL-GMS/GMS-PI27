/*
 * FK Structures
 *
 * Structures to support FK Calculations
*/

#ifndef GMS_FK_STRUCTS_H
#define GMS_FK_STRUCTS_H
#include "common/enums.h"
#include "enums.h"

typedef struct {
    double  horizontalAngleDeg;
    double  verticalAngleDeg;
    double  spectrumStepDuration;
    int  minimumWaveformsForSpectrum;
    int  normalizeWaveforms;
    int  twoDimensional;
    double  fftTaperPercent;
    double  maxSlowness;
    int  numPoints;
    double  spectrumDurationMs;
    double  lead;
    double  lowFrequencyHz; 
    double  highFrequencyHz;
    double  waveformSampleRateHz;
    double  waveformSampleRateToleranceHz;
    enum FK_UNCERTAINTY_OPTION  uncertaintyOption;
    enum TAPER_FUNCTION  taperFunction;
    const char * phaseType;
} FkSpectraDefinition;

typedef struct {
    double peakFstat;
    double slowness;
    enum UNITS slownessUnits;
    double slownessUncertainty;
    double azimuth; // Receiver to source
    enum UNITS azimuthUnits;
    double azimuthUncertainty;
} FkAttributes;

typedef struct {
    double** power;
    double** fstat;
    double fkQual;
    FkAttributes attributes;
} FkSpectrum;

typedef struct {
    int sampleCount;
    FkSpectrum* spectrums;
} FkSpectra;


#endif