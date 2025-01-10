#ifndef WORKFLOW_DEFINITION_ID_H
#define WORKFLOW_DEFINITION_ID_H

#include <string>

#include "BaseVersionReference.hh"

class WorkflowDefinitionId : public BaseVersionReference{

    public:
    WorkflowDefinitionId(std::string const& name, double const& effectiveAt) 
        : BaseVersionReference(effectiveAt), name(name){};

    std::string name;

};

#endif //WORKFLOW_DEFINITION_ID_H