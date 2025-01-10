#ifndef TEST_FILE_LOADER_H
#define TEST_FILE_LOADER_H

#include <cstdlib>
#include <json/json.h>
#include <fstream>
#include <iostream>
#include <string>

namespace GmsTestUtils {
    class FileLoader {
        //declaration
    public:
        static Json::Value getJson(std::string const& fileName);
    };
}
#endif //TEST_FILE_LOADER_H