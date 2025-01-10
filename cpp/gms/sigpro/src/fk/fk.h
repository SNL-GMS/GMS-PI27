#include "common/structs.h"
#include "fk/structs.h"

#define KM_PER_DEG 111.1949266 

/*
 * Computes an FkSpectra for the provided data.
 * Input parameters:
 *  definition - the FkSpectraDefinition providing the configuration parameters for the calculation
 *  waveforms - the waveform data that will be used to calculate the FkSpectra
 *  waveformCount - the number of waveforms provided for processing
 *  startTime - the start time of the of the FkSpectra
 *  endTime - the end time of the FkSpectra
 * Ouput parameters:
 *  spectra - the calculated FkSpectra 
 */
// TODO: delete this when everything switches to the new definition...keep the comments
extern int computeFk(FkSpectraDefinition* definition, ProcessingWaveform waveforms[], int waveformCount, double startTime, double endTime, FkSpectra* spectra);

extern int computeFkChannelSegment(FkSpectraDefinition *definition, 
                     int channelSegmentCount, 
                     ProcessingChannelSegment *channelSegments,
                     double detectionTime,
                     double startTime, 
                     double endTime,
                     FkSpectra *spectra, 
                     MissingInputChannelTimeRanges *missingInputChannels);
/*
 * FK Spectra analysis is used to determine the azimuth and slowness of a signal detection.  
 * Simply put, it is basically calculating the beam of an array for a range of slowness values, 
 * and calculating a metric that quantifies the quality of the alignment of the waveforms.
 * The peak for this value occurs at the slowness for the incoming wavefront, and can then be used 
 * to calculate the azimuth of the wave. In FK spectra analysis, the measure of the quality of alignment
 * is signal power for simplicity.
 * 
 * Recall that the formula for calculating a beam: 
 *          N - 1
 *          -----|
 *          \
 *        1  \
 * b(t) = _   \     w_i (t + p * r_i)
 *        N   /         
 *           /
 *          /
 *          -----|
 *          i = 0
 *      where 
 *              N is the number of waveforms
 *              w(t) is the waveform
 *              t is the timeseries data
 *              p is the slowness
 *              r is the relative position of the channel to the beam point
 * 
 * Applying this to the concept of an FK Spectra, we perform the above calculation for a variety of azimuth and slowness 
 * values, and plot them in a grid with slowness in the x direction (east-west) as the x axis, and slowness in the y direction 
 * (north-south) as the y axis.
 * For performance reasons, we calculate the FK Spectra in the frequency domain (by applying a Fourier transform to the waveform data)
 * and apply a passband filter, which converts the above formula to:
 *  
 *
 *            Nf^-1 * f2       /    M - 1                            \ 2 
 *            -----|          /     -----|                            \
 *            \              /      \                                  \
 *         1   \            /   1    \                                  \
 * fk(p) = _    \          /    _     \       X_m,n * e^(i*2*pi*p*r_m)   \
 *         N    /          \    M     /                                  /
 *             /            \        /                                  /
 *            /              \      /                                  /
 *            -----|          \     -----|                            /
 *            n = Nf^-1 * f1   \    m = 0                            /
 * 
 *          Where
 *                f1 is the lower bound of the passband
 *                f2 is the upper bound of the passband
 *                Nf^-1 is the size of each frequency bin in the transformed dat
 *                M is the number of waveforms used in the calculation
 *                p is the slowness vector we are using for the current pixel
 *                r_M is the relative position of the channel  
 *
 * To relate the above formula to the concept of beaming and power that we are calcuting in the FK spectra,
 * the beam calculation is performed by the following portion of the formula:        
 * 
 *              M - 1                            
 *              -----|                            
 *              \                                  
 *          1    \                                  
 * beam =   _     \       X_m,n * e^(i*2*pi*f*p*r_m)   
 *          M     /                                  
 *               /                                  
 *              /                                  
 *              -----|                            
 *              m = 0
 *                               
 * Then, the power of the beam is calculated by summing up all beamed data for the frequencies in the passband, 
 * squaring the result, and normalizing by the number of frequencies in the passband, as shown below
 * 
 *            Nf^-1 * f2       /    \ 2 
 *            -----|          /      \
 *            \              /        \
 *         1   \            /          \
 * fk(p) = _    \          /    beam    \
 *         N    /          \            / 
 *             /            \          /  
 *            /              \        /   
 *            -----|          \      / 
 *            n = Nf^-1 * f1   \    /
 */

/*
 * Calculate an FkSpectrum for the provided definition and waveforms. 
 * Input parameters:
 *   definition - The FkSpectraDefinition containing the configuration parameters 
 *   waveforms - The input waveforms to the algorithm
 *   startTime - The start time of the calculated FkSpectrum
 * Output parameters:
 *   power - the calculated power spectrum
 *   fstat - the calculated fstat spectrum 
 */
// TODO: delete this when everything switches to the new definition...keep the comments
extern int fk(FkSpectraDefinition* definition, ProcessingWaveform waveforms[], int waveformCount, double startTime, double endTime, double*** power, double*** fstat);

extern int fkChanelSegment(FkSpectraDefinition *definition, 
              int channelSegmentCount, 
              ProcessingChannelSegment *channelSegments, 
              double startTime,
              double endTime,
              double ***power,
              double ***fstat);
/*
 * Calculate the slowness and azimuth, with uncertainties of the provided Fk power spectrum
 * Input Parameters:
 *   power - The FK power spectrum from which the slowness and azimuth will be calculated
 * Output Parameters:
 *   slowness - the calculated slowness
 *   slownessUncertainty - the calculated slowness uncertainty
 *   azimuth - the calculated azimuth
 *   azimuthUncertainty - the calculated azimuth uncertainty
 */
extern void fkMeasurements(FkSpectraDefinition* definition, double** power, FkAttributes* fkAttributes);
