#ifndef CLASS_TO_C_STRUCT_CONVERTER_TESTS_H
#define CLASS_TO_C_STRUCT_CONVERTER_TESTS_H
#include "gtest/gtest.h"

#include "utils/ClassToCStructConverter.hh"
namespace GmsSigpro{
extern "C" {
#include <common/structs.h>
#include <fk/structs.h>
#include <fk/fk.h>
}
}
/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class ClassToCStructConverterTests : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // CLASS_TO_C_STRUCT_CONVERTER_TESTS_H