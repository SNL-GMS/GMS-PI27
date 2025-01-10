#include "common/enums.h"
#include "common/structs.h"
#include "structs.h"

extern RETURN_CODE iirButterworthFilterDesign(IirFilterDescription *iirFilterDescription);

extern RETURN_CODE filterDesign(FilterDefinition *filterDefinition);

extern RETURN_CODE iirButterworthFilterApply(IirFilterDescription *filterParameters, ProcessingWaveform *waveform, const TaperDefinition *taperDefinition);

extern RETURN_CODE filterApply(FilterDefinition *filterDescription, ProcessingWaveform *waveform, const TaperDefinition *taperDefinition);

extern RETURN_CODE applyGroupDelay(const FilterDefinition *definition, ProcessingWaveform *waveform);