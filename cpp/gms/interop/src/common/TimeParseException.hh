#ifndef TIME_PARSE_EXCEPTION_H
#define TIME_PARSE_EXCEPTION_H

#include <stdexcept>

class TimeParseException : public std::exception{

    private:
        const std::string message;

    public: 
    explicit TimeParseException(const std::string& message) : std::exception(), message(message){};

    const char* what() const noexcept override{
       return message.c_str();
    }

};

#endif //TIME_PARSE_EXCEPTION_H