#include "BaseFilterDescription.hh"

BaseFilterDescription::BaseFilterDescription(bool causal, std::string const& comments)noexcept : causal(causal),
                                                                                  comments(comments){};