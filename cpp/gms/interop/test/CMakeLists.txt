PROJECT(UNIT_TESTS LANGUAGES C CXX)
include(FetchContent)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

set(GMS_INTEROP_COMMON_TESTS_SRC
    common/CoiConstructorTests.cpp
    common/CoiConstructorTests.hh
    common/CoiBuilderTests.cpp
    common/CoiBuilderTests.hh
    common/LocationTests.cpp
    common/LocationTests.hh
    common/MapTests.cpp
    common/MapTests.hh
    common/OrientationAnglesTest.cpp
    common/OrientationAnglesTests.hh
)

set(GMS_BEAM_PROVIDER_TESTS_SRC
    beamprovider/DefaultBeamProviderTest.cpp
    beamprovider/DefaultBeamProviderTest.hh
    beamprovider/BeamProviderTest.cpp
    beamprovider/BeamProviderTest.hh
    beamprovider/BeamOrchestratorTest.hh
    beamprovider/BeamOrchestratorTest.cpp
)
set(GMS_FILTER_PROVIDER_TESTS_SRC
    filterprovider/payloads/TestData.cpp
    filterprovider/payloads/TestData.hh
    filterprovider/payloads/TestEnums.hh
    filterprovider/payloads/TestFilters.cpp
    filterprovider/payloads/TestFilters.hh
    filterprovider/BaseFilterApplyTests.cpp
    filterprovider/BaseFilterApplyTests.hh
    filterprovider/FilterDesignerTests.cpp
    filterprovider/FilterDesignerTests.hh
    filterprovider/FilterProviderTests.cpp
    filterprovider/FilterProviderTests.hh
    filterprovider/TaperTests.cpp
    filterprovider/TaperTests.hh
    filterprovider/FilterTestUtils.cpp
    filterprovider/FilterTestUtils.hh
    filterprovider/WasmFilterApplyTests.cpp
    filterprovider/WasmFilterApplyTests.hh
    filterprovider/WasmFilterDesignerTests.cpp
    filterprovider/WasmFilterDesignerTests.hh 
)
set(GMS_FK_PROVIDER_TESTS_SRC
    fkprovider/FkComputeUtilityTest.cpp
    fkprovider/FkComputeUtilityTest.hh
)

set(GMS_ROTATION_PROVIDER_TESTS_SRC
    rotationprovider/RotationConstructorTests.cpp
    rotationprovider/RotationConstructorTests.hh
    rotationprovider/RotationProviderTests.cpp
    rotationprovider/RotationProviderTests.hh
    rotationprovider/RotationProcessingMaskTests.cpp
    rotationprovider/RotationProcessingMaskTests.hh
)

set(GMS_UTILS_INTEROP_TESTS_SRC
    utils/ClassToCStructConverterTests.cpp
    utils/ClassToCStructConverterTests.hh
    utils/DataAlignmentUtilityTests.cpp
    utils/DataAlignmentUtilityTests.hh
    utils/ProcessingMaskUtilityTests.cpp
    utils/ProcessingMaskUtilityTests.hh    
)

set(GMS_WASM_INTEROP_TESTS_SRC

)

add_executable(GMS_INTEROP_TESTS ${GMS_INTEROP_COMMON_TESTS_SRC}
                                 ${GMS_BEAM_PROVIDER_TESTS_SRC} 
                                 ${GMS_FILTER_PROVIDER_TESTS_SRC} 
                                 ${GMS_FK_PROVIDER_TESTS_SRC} 
                                 ${GMS_UTILS_INTEROP_TESTS_SRC} 
                                 ${GMS_ROTATION_PROVIDER_TESTS_SRC}
                                 ${GMS_WASM_INTEROP_TESTS_SRC})
add_dependencies(GMS_INTEROP_TESTS project_jsoncpp gmsinterop)
target_compile_features(GMS_INTEROP_TESTS PUBLIC)
target_link_libraries(GMS_INTEROP_TESTS gtest gtest_main ${JSONCPP_LIBRARY} gmstestutils gmsinterop)
target_include_directories(GMS_INTEROP_TESTS PRIVATE ${JSONCPP_INCLUDE_DIR} ${GMS_TESTUTILS_INCLUDES} ${GMS_SIGPRO_INCLUDES} ${GMS_INTEROP_INCLUDES} ./)
include(GoogleTest)

GTEST_ADD_TESTS(TARGET GMS_INTEROP_TESTS old:)
GTEST_DISCOVER_TESTS(GMS_INTEROP_TESTS TEST_PREFIX new:)
ADD_TEST(NAME monolithic COMMAND GMS_INTEROP_TESTS)