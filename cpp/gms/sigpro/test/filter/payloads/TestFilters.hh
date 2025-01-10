#ifndef TestFilters_H
#define TestFilters_H
#include <vector>
#include <cstdlib>
#include "TestEnums.hh"

extern "C"
{
    #include "filter/structs.h"
    #include "filter/enums.h"
    #include "filter/constants.h"
}

class TestFilters
{

    public:
        IirFilterDescription buildLowPassDesignedFilter();    
        IirFilterDescription buildLowPassFilter();       
        FilterDefinition buildDesignedLowPassFilterDefinition();
        FilterDefinition buildLowPassFilterDefinition();

        FilterDefinition buildDesignedCascadeFilterDefinition();
        FilterDefinition buildCascadeFilterDefinition();
};

#endif // TestFilters_H