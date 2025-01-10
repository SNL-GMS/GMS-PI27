#ifndef STATION_VERSION_REFERENCE_H
#define STATION_VERSION_REFERENCE_H

#include <chrono>
#include <string>

#include "BaseVersionReference.hh"
class StationVersionReference : public BaseVersionReference
{

public:
	StationVersionReference(
		std::string const &name,
		double const &effectiveAt)
		: BaseVersionReference(effectiveAt),
		  name(name){};

	std::string name;
};

#endif // STATION_VERSION_REFERENCE_H