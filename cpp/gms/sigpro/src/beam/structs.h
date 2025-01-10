#ifndef GMS_BEAM_STRUCTS_H
#define GMS_BEAM_STRUCTS_H

#include "common/structs.h"
#include "filter/enums.h"
#include "filter/structs.h"
#include "enums.h"

typedef struct
{
    BEAM_TYPE beamType;
    SAMPLING_TYPE samplingType;
    BEAM_SUMMATION_TYPE beamSummation;
    Location location;
    int twoDimensional;
    double receiverToSourceAzimuthDeg;
    double slownessSecPerDeg;
    double sampleRateHz;
    double horizontalAngleDeg;
    double verticalAngleDeg;
    double sampleRateToleranceHz;
    double orientationAngleToleranceDeg;
    int minWaveformsToBeam;
    FilterDefinition* preFilterDefinition;
} BeamDefinition;


typedef struct
{
  char* channelName; // just for reference
  double dnorth;
  double deast;
  double hang;
  double vang;
  double weight; // weighting factor for beam element (0.0 to 1.0)
  double shift; // for input = specified time shift if shift_method = specified
                // for output = computed time shift
  ProcessingMask* mask;
  ProcessingWaveform* waveform;

} BeamElement;


typedef struct
{
  int numBeamElement;
  int* beamElementUsed; // binary vector matching input beam_elements (0=no, 1=yes)
  BeamElement* element;  // processed beam elements
  ProcessingWaveform* beam;
  ProcessingWaveform* ufbeam;
  ProcessingWaveform* norm;
  ProcessingWaveform* power;
  ProcessingWaveform* semblance;
  ProcessingWaveform* fstat;
  ProcessingWaveform* fprob;

} BeamOut;

#endif // GMS_BEAM_STRUCTS_H