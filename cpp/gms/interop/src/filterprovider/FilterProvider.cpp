#include "FilterProvider.hh"

void FilterProvider::filterApply(CascadeFilterDescription* filterDescription, double* data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude)
{
  for (int i{ 0 }; i < filterDescription->filterDescriptions.size(); ++i)
  {
    auto childFilter{ &filterDescription->filterDescriptions.at(i) };
    switch (childFilter->filterType)
    {
      case FilterDescriptionType::IIR_FILTER_DESCRIPTION:
      {
        if (!childFilter->iirDescription.has_value()) {
          throw std::invalid_argument("IIR Filter Description not provided in wrapper");
        }
        FilterProvider::filterApply(&childFilter->iirDescription.value(), data, numberOfData, taper, removeGroupDelay, indexOffset, indexInclude);
        break;
      }
      case FilterDescriptionType::FIR_FILTER_DESCRIPTION:
      {
        if (!childFilter->firDescription.has_value()) {
          throw std::invalid_argument("FIR Filter Description not provided in wrapper");
        }
        FilterProvider::filterApply(&childFilter->firDescription.value(), data, numberOfData, taper, removeGroupDelay, indexOffset, indexInclude);
        break;
      }
      default:
      {
        throw std::invalid_argument("Invalid FilterDescriptionType");
      }
    }
  }
};

void FilterProvider::filterApply(LinearIIRFilterDescription* filterDescription, double* data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude)
{
  if (filterDescription->parameters.isDesigned == true)
  {
    _filterApply(
      data, numberOfData, indexOffset, indexInclude, taper,
      filterDescription->zeroPhase,
      filterDescription->parameters.sosNumerator,
      filterDescription->parameters.sosDenominator,
      filterDescription->parameters.numberOfSos);
  }
};

void FilterProvider::filterApply(LinearFIRFilterDescription* filterDescription, double* data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude)
{
  throw std::invalid_argument("Not Implemented: FIR");
};


void _filterApply(double* data, int num_data, int index_offset, int index_inc, int taper, int zero_phase, std::vector<double> sos_numerator, std::vector<double> sos_denominator, int num_sos)
{
  /*************************************************
  ** Filter input data in forward direction.
  */
  // Taper start of data before filtering.
  if (taper > 0)
    _filterTaper(data, num_data, index_offset, index_inc, taper, 0);

  // Run filter in forward direction.
  GmsSigpro::filter_iir(data, num_data, index_offset, index_inc, 0, sos_numerator.data(), sos_denominator.data(), num_sos);

  /*************************************************
  ** If zero_phase, also filter output data
  ** again in reverse direction.
  */
  if (zero_phase)
  {
    // Taper end of data before filtering in reverse.
    if (taper > 0)
      _filterTaper(data, num_data, index_offset, index_inc, taper, 1);

    // Run filter in reverse direction.
    GmsSigpro::filter_iir(data, num_data, index_offset, index_inc, 1, sos_numerator.data(), sos_denominator.data(), num_sos);
  }
}

void _filterTaper(double* data, int num_data, int index_offset, int index_inc, int taper_samples, int direction)
{
  int j{};
  int j2{};
  double taper_weight{};

  // Compute end of data vector with offset and increment
  const int num_val{ (num_data - index_offset) / index_inc };
  const int index_end{ index_offset + num_val * index_inc + index_offset };

  if (taper_samples > num_val / 2)
    taper_samples = num_val / 2;

  // Simple cosine taper function
  for (int i{ 0 }; i < taper_samples; i++)
  {
    taper_weight = 0.5 - 0.5 * cos(M_PI * i / taper_samples);

    j = index_offset + i * index_inc;

    if (direction == 0 || direction == 2)
    {
      data[j] = taper_weight * data[j];
    }

    if (direction == 1 || direction == 2)
    {
      j2 = index_end - j;
      data[j2] = taper_weight * data[j2];
    }
  }
}
