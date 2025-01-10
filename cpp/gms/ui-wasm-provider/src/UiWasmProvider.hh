#ifndef UI_WASM_PROVIDER_H
#define UI_WASM_PROVIDER_H

#if (__EMSCRIPTEN__)

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/em_macros.h>

#endif

#include <iostream>
#include <stdexcept>

class UiWasmProvider
{
public:
    UiWasmProvider() = default;
};

#endif // #define UI_WASM_PROVIDER_H

#if (__EMSCRIPTEN__)
EMSCRIPTEN_KEEPALIVE

EMSCRIPTEN_BINDINGS(UiWasmProvider)
{
    // emscripten::register_vector<double>("VectorDouble");
}

#endif
