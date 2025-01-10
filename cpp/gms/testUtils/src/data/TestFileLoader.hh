#ifndef TEST_FILE_LOADER_H
#define TEST_FILE_LOADER_H

#include <json/json.h>
#include <fstream>
#include <string>

namespace TestFileLoader {
    Json::Value getJson(std::string const& fileName);
};

#endif //TEST_FILE_LOADER_H