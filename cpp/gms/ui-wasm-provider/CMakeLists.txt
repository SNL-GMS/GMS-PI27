cmake_minimum_required(VERSION 3.20)
include(CMakePrintHelpers)

PROJECT(GMS LANGUAGES C CXX VERSION 1.0.1 DESCRIPTION "UI WASM Provider")

SET(CMAKE_CXX_STANDARD 17)
SET(CMAKE_CXX_STANDARD_REQUIRED ON)
SET(GMS_LIB_FOLDER ${CMAKE_BINARY_DIR}/lib)

SET(UI_WASM_PROVIDER_SRC
    src/UiWasmProvider.hh src/UiWasmProvider.cpp
    src/GetBoundsForPositionBuffer.hh src/GetBoundsForPositionBuffer.cpp)

ADD_LIBRARY(uiwasmprovider ${UI_WASM_PROVIDER_SRC})
SET_TARGET_PROPERTIES(uiwasmprovider PROPERTIES PUBLIC_HEADER ./UiWasmProvider.hh)
SET_TARGET_PROPERTIES(uiwasmprovider PROPERTIES VERSION ${PROJECT_VERSION})
ADD_CUSTOM_COMMAND(TARGET uiwasmprovider POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:uiwasmprovider> ${GMS_LIB_FOLDER}
)

if(NOT CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    if(WITH_UNIT_TESTS)
        message(STATUS "C++ tests enabled")
        add_subdirectory(./tests)
    endif()
endif()

if(CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    SET(GMS_WASM_OUTPUT_FOLDER ${CMAKE_BINARY_DIR}/wasm)
    FILE(MAKE_DIRECTORY ${GMS_WASM_OUTPUT_FOLDER})
    ADD_CUSTOM_COMMAND(TARGET uiwasmprovider POST_BUILD
        COMMAND em++ --bind -O3 -Wl,--whole-archive ${GMS_LIB_FOLDER}/libuiwasmprovider.a -Wl
        -o ${GMS_WASM_OUTPUT_FOLDER}/ui-wasm-provider.js
        --std=c++17
        -s EXPORTED_FUNCTIONS='["_cGetBoundsForPositionBuffer","_malloc","_free"]'
        -s EXPORTED_RUNTIME_METHODS=ccall,cwrap,setValue,getValue
        -s ALLOW_MEMORY_GROWTH=1
        -s LLD_REPORT_UNDEFINED
        -s EXPORT_NAME=gmsfilters
        -s SINGLE_FILE=1
        -s EXPORT_ES6=0
        -s USE_ES6_IMPORT_META=0
        -s MODULARIZE=1)
endif()
