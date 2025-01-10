#ifndef ARRAY_CONVERTER_H
#define ARRAY_CONVERTER_H

#include <vector>

#if (__EMSCRIPTEN__)
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;
namespace ArrayConverter {
     std::vector<double> convertToVectorDouble(emscripten::val const& tsArray);
     emscripten::val convertToFloat64Array(std::vector<double> const& cppVector);
     std::vector<double> vectorFromPointer(int tsArrayPtr, long size);
};
#endif
#endif //ARRAY_CONVERTER_H
