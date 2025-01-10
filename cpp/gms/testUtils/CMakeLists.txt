cmake_minimum_required(VERSION 3.20)
include(CMakePrintHelpers)
include(FetchContent)
include(ExternalProject)
project(GMS_TEST_UTILS LANGUAGES CXX VERSION 1.0.1 DESCRIPTION "GMS TestUtils Provider")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

FetchContent_Declare(
        googletest
        URL ${GITHUB_URL}/google/googletest/archive/609281088cfefc76f9d0ce82e1ff6c30cc3591e5.zip
)
FetchContent_MakeAvailable(googletest)

set(GMS_TESTUTILS_SRC
    src/Comparisons.cpp
    src/Comparisons.hh
    src/DataGenerator.cpp
    src/DataGenerator.hh
    src/FileLoader.cpp
    src/FileLoader.hh
)
             
add_library(gmstestutils ${GMS_TESTUTILS_SRC})
add_dependencies(gmstestutils project_jsoncpp)
set_target_properties(gmstestutils PROPERTIES VERSION ${PROJECT_VERSION})
target_include_directories(gmstestutils PRIVATE ${JSONCPP_INCLUDE_DIR} ${GMS_TESTUTILS_INCLUDES})
target_link_libraries(gmstestutils gtest gtest_main ${JSONCPP_LIBRARY})

ADD_CUSTOM_COMMAND(TARGET gmstestutils POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:gmstestutils> ${GMS_LIB_FOLDER}
)

if(NOT CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    if(WITH_UNIT_TESTS)
        message(STATUS "GMS TestUtils tests enabled")
        add_subdirectory(./test)
    endif()
endif()