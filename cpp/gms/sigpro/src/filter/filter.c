#include "filter.h"
#include "filter_iir.h"
#include "constants.h"
#include "common/taper.h"

RETURN_CODE iirButterworthFilterDesign(IirFilterDescription *iirFilterDescription)
{
    if (iirFilterDescription->parameters.sosCoefficientsSize > MAX_SOS)
    {
        return INVALID_CONFIGURATION;
    }   
    
    int *sosCoefficientsSize = (int*) malloc(sizeof(int));
    filter_design_iir(BUTTERWORTH, 
                      iirFilterDescription->bandType, 
                      iirFilterDescription->lowFrequencyHz, 
                      iirFilterDescription->highFrequencyHz,
                      iirFilterDescription->parameters.sampleRateHz,
                      iirFilterDescription->order,
                      iirFilterDescription->parameters.sosNumeratorCoefficients,
                      iirFilterDescription->parameters.sosDenominatorCoefficients,
                      sosCoefficientsSize);

    iirFilterDescription->parameters.sosCoefficientsSize = 3 * *sosCoefficientsSize;
    iirFilterDescription->parameters.groupDelaySec = 0;
    
    free(sosCoefficientsSize);
    
    return SUCCESS;
}

RETURN_CODE filterDesign(FilterDefinition *filterDefinition)
{
    if (filterDefinition->isDesigned)
    {
        return SUCCESS;
    }

    if (filterDefinition->filterType == CASCADE)
    {
        double groupDelay = 0;
        CascadeFilterDescription filterDescription = filterDefinition->filterDescription.cascadeFilterDescription;
        for (int i = 0; i < filterDescription.filterDescriptionCount; i++)
        {            
            RETURN_CODE status = iirButterworthFilterDesign(&(filterDescription.filterDescriptions[i].iirFilterDescription));
            
            if (status == SUCCESS)
            {
                groupDelay += filterDescription.filterDescriptions[i].iirFilterDescription.parameters.groupDelaySec;
            }
            else
            {
                return status;
            }
        }
    }
    else if (filterDefinition->filterType == IIR_BUTTERWORTH)
    {
        iirButterworthFilterDesign(&(filterDefinition->filterDescription.nonCascadeFilterDescription.iirFilterDescription));
    }
    else
    {
        return NOT_YET_IMPLEMENTED;
    }

    filterDefinition->isDesigned = 1;

    return SUCCESS;
}

RETURN_CODE iirButterworthFilterApply(IirFilterDescription *filterDescription, ProcessingWaveform *waveform, const TaperDefinition *taperDefinition)
{
    if (taperDefinition)
    {
        endpointTaper(waveform, taperDefinition, FORWARD);
    }

    filter_iir(waveform->data, 
               (int) waveform->sampleCount, 
               0, 
               1, 
               0, 
               filterDescription->parameters.sosNumeratorCoefficients, 
               filterDescription->parameters.sosDenominatorCoefficients, 
               filterDescription->parameters.sosCoefficientsSize / 3);

    if (filterDescription->zeroPhase)
    {
        if (taperDefinition)
        {
            endpointTaper(waveform, taperDefinition, REVERSE);
        }

        filter_iir(waveform->data, 
                   (int) waveform->sampleCount, 
                   0, 
                   1, 
                   1, 
                   filterDescription->parameters.sosNumeratorCoefficients, 
                   filterDescription->parameters.sosDenominatorCoefficients, 
                   filterDescription->parameters.sosCoefficientsSize / 3);
    }

    return SUCCESS;
}

RETURN_CODE filterApply(FilterDefinition *filterDefinition, ProcessingWaveform *waveform, const TaperDefinition *taperDefinition)
{
    if (!filterDefinition->isDesigned)
    {
        return INVALID_CONFIGURATION;
    }

    if (filterDefinition->filterType == CASCADE)
    {
        for (int i = 0; i < filterDefinition->filterDescription.cascadeFilterDescription.filterDescriptionCount; i++)
        {
            // given that this does an in-place transformation, we might want to consider sending in
            // a data copy so that failures don't modify the waveform
            RETURN_CODE status = iirButterworthFilterApply(&(filterDefinition->filterDescription.cascadeFilterDescription.filterDescriptions[i].iirFilterDescription), waveform, taperDefinition);
            if (status != SUCCESS)
            {
                return status;
            }
        }

        return SUCCESS;
    }
    else if (filterDefinition->filterType == IIR_BUTTERWORTH)
    {
        return iirButterworthFilterApply(&(filterDefinition->filterDescription.nonCascadeFilterDescription.iirFilterDescription), waveform, taperDefinition);
    }
    else
    {
        return NOT_YET_IMPLEMENTED;
    }
}

RETURN_CODE applyGroupDelay(const FilterDefinition *definition, ProcessingWaveform *waveform)
{
    if (!definition->isDesigned)
    {
        return INVALID_CONFIGURATION;
    }

    double groupDelay = 0.0;
    if (definition->filterType == CASCADE)
    {
        groupDelay = definition->filterDescription.cascadeFilterDescription.parameters.groupDelaySec;
    }
    else if (definition->filterType == IIR_BUTTERWORTH)
    {
        groupDelay = definition->filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.groupDelaySec;
    }
    else
    {
        return NOT_YET_IMPLEMENTED;
    }

    if (groupDelay != 0.0)
    {
        long groupDelaySamples = (long) (groupDelay * waveform->sampleRateHz);        
        long shiftSamples = waveform->sampleCount - groupDelaySamples;
        memmove(waveform->data, &(waveform->data[groupDelaySamples]), shiftSamples * sizeof(double));
        memset(&(waveform->data[shiftSamples]), 0, groupDelaySamples * sizeof(double));
    }

    return SUCCESS;
}
