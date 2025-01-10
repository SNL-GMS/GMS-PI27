#ifndef REQUIRED_PROPERTY_EXCEPTION_H
#define REQUIRED_PROPERTY_EXCEPTION_H

#include <stdexcept>

class RequiredPropertyException : public std::exception{

    private:
        const std::string message;

    public: 
    explicit RequiredPropertyException(const std::string& message) : std::exception(), message(message){};

    std::string getMessage() const {
        return this->message;
    }
    
    const char* what() const noexcept override {
       return message.c_str();
    }

};

#endif //REQUIRED_PROPERTY_EXCEPTION_H