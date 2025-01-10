#include "FilterDesigner.hh"


void FilterDesigner::filterDesign(CascadeFilterDescription* filterDescription)
{
  int groupDelay{ 0 };
  // Design each filter.
  // Don't check is_designed, just force a new design operation.
  for (int childCount{ 0 }; childCount < filterDescription->filterDescriptions.size(); childCount++)
  {
    auto childFilter{ &filterDescription->filterDescriptions.at(childCount) };
    switch (childFilter->filterType)
    {
      case FilterDescriptionType::IIR_FILTER_DESCRIPTION:
      {
        if(!childFilter->iirDescription.has_value()){
          throw std::invalid_argument("IIR Filter Description not provided in wrapper");
        }
        FilterDesigner::filterDesign(&childFilter->iirDescription.value());
        groupDelay += childFilter->iirDescription.value().parameters.groupDelaySec;
        break;
      }
      case FilterDescriptionType::FIR_FILTER_DESCRIPTION:
      {
        if(!childFilter->firDescription.has_value()){
          throw std::invalid_argument("FIR Filter Description not provided in wrapper");
        }
        FilterDesigner::filterDesign(&childFilter->firDescription.value());
        groupDelay += childFilter->iirDescription.value().parameters.groupDelaySec;
        break;
      }
      default:
      {
        throw std::invalid_argument("Invalid FilterDescriptionType");
      }
    }
  }

  // Set composite group delay.
  filterDescription->parameters.groupDelaySec = groupDelay;
  filterDescription->parameters.isDesigned = true;
};

void FilterDesigner::filterDesign(LinearFIRFilterDescription* filterDescription)
{
  throw std::invalid_argument("Not Implemented: LinearFIRFilterDescription Design ");
};

void FilterDesigner::filterDesign(LinearIIRFilterDescription* filterDescription)
{
  if (filterDescription->parameters.numberOfSos > MAX_SOS)
  {
    throw std::overflow_error("Size of SOSs is larger than MAX_SOS");
  }
  std::array<double, MAX_SOS> sosNum;
  std::array<double, MAX_SOS> sosDenom;

  GmsSigpro::filter_design_iir(
    static_cast<GmsSigpro::FILTER_DESIGN_MODEL>(static_cast<int>(filterDescription->filterDesignModel)),
    static_cast<GmsSigpro::FILTER_BAND_TYPE>(static_cast<int>(filterDescription->passBandType)),
    filterDescription->lowFrequencyHz,
    filterDescription->highFrequencyHz,
    filterDescription->parameters.sampleRateHz,
    filterDescription->order,
    sosNum.data(), sosDenom.data(), &filterDescription->parameters.numberOfSos);

  int size{ filterDescription->parameters.numberOfSos * 3 };
  std::copy(&sosNum[0], &sosNum[size], std::back_inserter(filterDescription->parameters.sosNumerator));
  std::copy(&sosDenom[0], &sosDenom[size], std::back_inserter(filterDescription->parameters.sosDenominator));
  filterDescription->parameters.groupDelaySec = 0;
  filterDescription->parameters.isDesigned = true;
};
