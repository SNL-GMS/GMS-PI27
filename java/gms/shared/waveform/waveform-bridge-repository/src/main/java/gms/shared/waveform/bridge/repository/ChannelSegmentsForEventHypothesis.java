package gms.shared.waveform.bridge.repository;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.List;

/** Record containing List<ChannelSegment<Waveform>> associated to EventHypothesis */
public record ChannelSegmentsForEventHypothesis(
    EventHypothesis eventHypothesis, List<ChannelSegment<Waveform>> channelSegments) {}
