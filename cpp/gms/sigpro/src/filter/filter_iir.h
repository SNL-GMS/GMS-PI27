/*******************************************************************************
** IIR Filtering Functions
**
** Low-level functions to design and run IIR filters.
*/

#ifndef GMS_FILTER_IIR_H
#define GMS_FILTER_IIR_H

#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "complex.h"
#include "constants.h"
#include "enums.h"

// IIR filtering functions
void filter_iir(double data[], int num_data, int index_offset, int index_inc, int reverse, double sn[], double sd[], int num_sos);

// IIR filter design functions
void filter_design_iir(enum FILTER_DESIGN_MODEL design_model, enum FILTER_BAND_TYPE band_type,
                       double fl, double fh, double fs, int filter_order,
                       double sn[], double sd[], int *num_sos);

// Analog lowpass prototype filter design functions
static double tangent_warp(double f, double fs);
static void cutoff_alter(double sn[], double sd[], int ns, double f);

// Analog-to-digital transformation function
static void bilinear(double sn[], double sd[], int ns);

#endif // GMS_FILTER_IIR_H