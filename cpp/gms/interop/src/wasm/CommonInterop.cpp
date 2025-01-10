#include "CommonInterop.hh"

void iirFilterApply(LinearIIRFilterDescription *filterDescription, double *data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInc)
{
  FilterProvider::filterApply(filterDescription, data, numberOfData, taper, removeGroupDelay, indexOffset, indexInc);
};

void firFilterApply(LinearFIRFilterDescription *filterDescription, double *data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude)
{
  FilterProvider::filterApply(filterDescription, data, numberOfData, taper, removeGroupDelay, indexOffset, indexInclude);
};

void cascadeFilterApply(CascadeFilterDescription *filterDescription, double *data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInc)
{
  FilterProvider::filterApply(filterDescription, data, numberOfData, taper, removeGroupDelay, indexOffset, indexInc);
};

CascadeFilterDescription cascadeFilterDesign(CascadeFilterDescription filterDescription)
{
  FilterDesigner::filterDesign(&filterDescription);
  return filterDescription;
};

LinearIIRFilterDescription iirFilterDesign(LinearIIRFilterDescription filterDescription)
{
  FilterDesigner::filterDesign(&filterDescription);
  return filterDescription;
};

LinearFIRFilterDescription firFilterDesign(LinearFIRFilterDescription filterDescription)
{
  FilterDesigner::filterDesign(&filterDescription);
  return filterDescription;
};

