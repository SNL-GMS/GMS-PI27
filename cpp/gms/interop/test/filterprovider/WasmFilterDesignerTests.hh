
#ifndef WASMFILTERDESIGNERTESTS_H
#define WASMFILTERDESIGNERTESTS_H
#include "gtest/gtest.h"

#include "Comparisons.hh"

#include "FilterTestUtils.hh"
#include "filterprovider/enums.hh"
#include "wasm/CommonInterop.hh"

class WasmFilterDesignerTests : public ::testing::Test
{
protected:
    FilterTestUtils testUtils;
};

#endif // WASMFILTERDESIGNERTESTS_H
