#ifndef QC_SEGMENT_CATEGORY_AND_TYPE_H
#define QC_SEGMENT_CATEGORY_AND_TYPE_H

#include "QcSegmentCategory.hh"
#include "QcSegmentType.hh"

class QcSegmentCategoryAndType{

    public:
        explicit QcSegmentCategoryAndType(QcSegmentCategory category) 
            : category(category){};
        QcSegmentCategoryAndType(QcSegmentCategory category, QcSegmentType type) 
            : category(category), type(type){};
        
        QcSegmentCategory category;
        QcSegmentType type;

};

#endif //QC_SEGMENT_CATEGORY_AND_TYPE_H