#ifndef TestData_H
#define TestData_H
#include <array>
#include <vector>
#include <string>
#include "TestEnums.hh"

class TestData
{
public:
    static const int TWO_HOUR_DATA_SIZE = 12000;
    static const int THREE_SECOND_DATA_SIZE = 120;
    static const std::array<double, TWO_HOUR_DATA_SIZE> TWO_HOUR_DATA;
    static const std::array<double, THREE_SECOND_DATA_SIZE> THREE_SECOND_DATA;
    static const std::vector<double> BW_LP_CAUSAL_RESULTS; // 0
    static const std::vector<double> BW_HP_NONCAUSAL_RESULTS; // 1
    static const std::vector<double> BW_BP_CAUSAL_RESULTS;    // 2
    static const std::vector<double> BW_BR_NONCAUSAL_RESULTS; // 3
    static const std::vector<double> CASCADED_FILTER_LPHP_RESULTS;

    static const std::vector<double> TAPER_FWD_RESULTS;
    static const std::vector<double> TAPER_REV_RESULTS;
    static const std::vector<double> TAPER_BOTH_RESULTS;
    
};

#endif // TestData_H