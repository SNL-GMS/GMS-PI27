#ifndef FK_COMPUTE_EXCEPTION_H
#define FK_COMPUTE_EXCEPTION_H

#include <stdexcept>

class FkComputeException : public std::exception {

private:
    const std::string message;
    std::string generateMessage(int returnCode) const {
        /**
         *  INVALID_BOUNDS=1,
         *  INSUFFICIENT_DATA=2,
         *  INVALID_CONFIGURATION=3,
         *  MEMORY_ALLOCATION_ERROR=4
         */
        std::string result = "FK compute failed: ";
        switch (returnCode) {
            case 1:
            { result += "INVALID_BOUNDS";
            }
            case 2: {
                result += "INSUFFICIENT_DATA";
            }
            case 3:
            {
                result += "INVALID_CONFIGURATION";
            }
            case 4:
            {
                result = "MEMORY_ALLOCATION_ERROR";
            }
            default:
            {
                result = "UNKNOWN ERROR";
            }
            return result;
        };
    };
public:
    explicit FkComputeException(const int returnCode)
        : std::exception(),
        message(generateMessage(returnCode)) {};


    std::string getMessage() const {
        return this->message;
    }

    const char* what() const noexcept override {
        return message.c_str();
    }

};

#endif //FK_COMPUTE_EXCEPTION_H