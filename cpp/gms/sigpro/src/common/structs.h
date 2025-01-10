#ifndef GMS_COMMON_STRUCTS_H
#define GMS_COMMON_STRUCTS_H

#include "enums.h"

typedef struct 
{
    double taperLength;
    enum TAPER_FUNCTION taperFunction;
} TaperDefinition;

typedef struct {
    enum FIX_TYPE fixType;
    int fixThreshold;
} ProcessingMaskDefinition;

typedef struct 
{
    enum PROCESSING_OPERATION processingOperation;
    double startTime;
    double endTime;
    int isFixed;
} ProcessingMask;

typedef struct
{
    double latitudeDegrees;
    double longitudeDegrees;
    double depthKm;
    double elevationKm;
} Location;

typedef struct 
{
    // TODO: remove channelName - verticalDisplacementKm once everyone has moved to ProcessingChannelSegment
    const char * channelName;
    int processingMaskCount;
    ProcessingMask* maskedBy;
    double northDisplacementKm;
    double eastDisplacementKm;
    double verticalDisplacementKm;
    double sampleRateHz;
    double startTime;
    double endTime;
    long sampleCount;
    double* data;
} ProcessingWaveform;

typedef struct
{
    double startTime;
    double endTime;
} TimeRange;

typedef struct
{
    const char *channelName;
    int timeRangeCount;
    TimeRange *timeRanges;
} MissingInputChannelTimeRanges;

typedef struct
{
    const char *channelName;
    double startTime;
    double endTime;
    int processingMaskCount;
    ProcessingMask *masksToApply;
    double northDisplacementKm;
    double eastDisplacementKm;
    double verticalDisplacementKm;
    int missingInputChannelCount;
    MissingInputChannelTimeRanges* missingInputChannels;
    int waveformCount;
    ProcessingWaveform *waveforms;
} ProcessingChannelSegment;

#endif // GMS_COMMON_STRUCTS_H
