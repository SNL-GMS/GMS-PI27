#ifndef DATA_GENERATOR_H
#define DATA_GENERATOR_H

#include <math.h>
#include <vector>

namespace GmsTestUtils {
    namespace DataGenerator {

        /**
             * Generates a standard sine wave of specified parameters
            */
        std::vector<double> generateSine(int duration, double sampleRateHz, double amplitude);

    };
}
#endif //DATA_GENERATOR_H