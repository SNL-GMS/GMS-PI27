package gms.shared.waveform.api.facet;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;

/*
 * TODO: Evaluate if this interface is necessary and remove it if not. It has a single implementing class and is not
 * required by guidance.
 */
/** Waveform faceting utility interface for populating waveform objects */
public interface WaveformFaceting {

  /**
   * Populate the {@link ChannelSegment} according to the faceting definition
   *
   * @param initialChannelSegment the {@link ChannelSegment} to facet
   * @param facetingDefinition the {@link FacetingDefinition} defining the fields to facet value
   * @return a faceted {@link ChannelSegment}
   */
  ChannelSegment<? extends Timeseries> populateFacets(
      ChannelSegment<? extends Timeseries> initialChannelSegment,
      FacetingDefinition facetingDefinition);

  /**
   * Populate the {@link ChannelSegment} with the specified arch guidance each level will be covered
   * for each {@link ChannelSegment}
   *
   * @param initialChannelSegment the {@link ChannelSegment} to facet
   * @param facetingDefinition the {@link FacetingDefinition} defining the fields to facet value
   * @return a faceted {@link ChannelSegment}
   */
  ChannelSegment<Waveform> populateChannelSegmentFacets(
      ChannelSegment<Waveform> initialChannelSegment, FacetingDefinition facetingDefinition);

  /**
   * Return faceted {@link EventHypothesis} given the input {@link FacetingDefinition}
   *
   * @param initialEventHypothesis input {@link EventHypothesis}
   * @param facetingDefinition input {@link FacetingDefinition}
   * @return faceted {@link EventHypothesis}
   */
  EventHypothesis populateEventHypothesisFacets(
      EventHypothesis initialEventHypothesis, FacetingDefinition facetingDefinition);

  /**
   * Populate the {@link QcSegment} according to the faceting definition
   *
   * @param initialQcSegment the {@link QcSegment} to be populated
   * @param facetingDefinition {@link FacetingDefinition} for the qcSegment population
   * @return faceted {@link QcSegment}
   */
  QcSegment populateFacets(QcSegment initialQcSegment, FacetingDefinition facetingDefinition);

  /**
   * Populate the {@link QcSegmentVersion} according to the faceting definition
   *
   * @param initialQcSegmentVersion the {@link QcSegmentVersion} to facet
   * @param facetingDefinition {@link FacetingDefinition} for the qcSegmentVersion population
   * @return a faceted {@link QcSegmentVersion}
   */
  QcSegmentVersion populateFacets(
      QcSegmentVersion initialQcSegmentVersion, FacetingDefinition facetingDefinition);

  /**
   * Populate the {@link QcSegment} with default faceting
   *
   * @param initialQcSegment the {@link QcSegment} to be populated
   * @return faceted {@link QcSegment}
   */
  QcSegment populateFacets(QcSegment initialQcSegment);

  /**
   * Populate the {@link QcSegmentVersion} with default faceting
   *
   * @param initialQcSegmentVersion the {@link QcSegmentVersion} to facet
   * @return a faceted {@link QcSegmentVersion}
   */
  QcSegmentVersion populateFacets(QcSegmentVersion initialQcSegmentVersion);

  /**
   * Populate the {@link ProcessingMask} with default faceting
   *
   * @param initialProcessingMask the {@link ProcessingMask} to facet
   * @return a faceted {@link ProcessingMask}
   */
  ProcessingMask populateFacets(ProcessingMask initialProcessingMask);
}
