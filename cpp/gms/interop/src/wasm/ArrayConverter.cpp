#include "ArrayConverter.hh"

#if (__EMSCRIPTEN__)
std::vector<double> ArrayConverter::convertToVectorDouble(emscripten::val const& tsArray) {
    return emscripten::convertJSArrayToNumberVector<double>(tsArray);
};

emscripten::val ArrayConverter::convertToFloat64Array(std::vector<double> const& cppVector) {
    // create new typed array to return
    emscripten::val view{ emscripten::typed_memory_view(cppVector.size(), cppVector.data()) };
    auto result = emscripten::val::global("Float64Array").new_(cppVector.size());
    result.call<void>("set", view);
    return result;
};

std::vector<double> ArrayConverter::vectorFromPointer(int tsArrayPtr, long size) {
    double* arrayPtr = reinterpret_cast<double*>(tsArrayPtr);
    std::vector<double> vectorDouble(arrayPtr, arrayPtr + size);
    return vectorDouble;
};

#endif
