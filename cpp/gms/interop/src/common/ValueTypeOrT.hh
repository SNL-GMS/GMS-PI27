#ifndef VALUE_TYPE_OR_T_H
#define VALUE_TYPE_OR_T_H

#include "ValueTypeWrapper.hh"

template <class T>
class ValueTypeOrT : public std::variant<ValueTypeWrapper, T> {
private:
    std::variant<ValueTypeWrapper, T> value;
    ValueTypeWrapper getValueType() const {
        if (std::holds_alternative<ValueTypeWrapper>(value)) {
            return std::get<ValueTypeWrapper>(value);
        }
    }
    T getT() const {
        if (std::holds_alternative<T>(value)) {
            return std::get<T>(value);
        }
    }
};

#endif // VALUE_TYPE_OR_T_H