#ifndef GMS_FILTER_STRUCTS_H
#define GMS_FILTER_STRUCTS_H

#include "enums.h"

typedef struct
{    
    double sampleRateHz;
    double sampleRateToleranceHz;
    double groupDelaySec; 
    int sosCoefficientsSize;
    double* sosNumeratorCoefficients;
    double* sosDenominatorCoefficients;
} IirFilterParameters;

typedef struct 
{
    double lowFrequencyHz;
    double highFrequencyHz;
    int order;
    int zeroPhase;
    int causal;
    FILTER_BAND_TYPE bandType;
    IirFilterParameters parameters;
} IirFilterDescription;

typedef union
{   
    IirFilterDescription iirFilterDescription;
    // Other filter descriptions (except cascade) will go here as they are added
} NonCascadeFilterDescription;

typedef struct {
    double sampleRateHz;
    double sampleRateToleranceHz;
    double groupDelaySec;
} CascadeFilterParameters;

typedef struct {
    CascadeFilterParameters parameters;
    int filterDescriptionCount;
    NonCascadeFilterDescription* filterDescriptions;
} CascadeFilterDescription;

typedef union
{
    NonCascadeFilterDescription nonCascadeFilterDescription;
    CascadeFilterDescription cascadeFilterDescription;
    // Future filter descriptions will go here
} FilterDescription;

typedef struct 
{
    int causal;
    FILTER_TYPE filterType;
    int isDesigned;
    FilterDescription filterDescription;
} FilterDefinition;

#endif // GMS_FILTER_STRUCTS_H