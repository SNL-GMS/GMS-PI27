#ifndef GMS_FILTER_CONSTANTS_H
#define GMS_FILTER_CONSTANTS_H

static const int MAX_NAME_SIZE = 64;
static const int MAX_COMMENT_SIZE = 256;

// Maximum filter order and coefficients supported
static const int MAX_FILTER_ORDER = 20;
static const int MAX_POLES = MAX_FILTER_ORDER;
static const int MAX_SOS = MAX_POLES * 3;
static const int MAX_TRANSFER_FUNCTION = 1024;

// Up to 10 filters in a filter cascade
static const int MAX_FILTER_DESCRIPTIONS = 10;

#endif // GMS_FILTER_CONSTANTS_H