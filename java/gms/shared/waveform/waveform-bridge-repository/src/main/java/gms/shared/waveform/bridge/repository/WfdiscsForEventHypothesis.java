package gms.shared.waveform.bridge.repository;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import java.util.List;

/** Record containing WfdiscDaos associated to EventHypothesis */
public record WfdiscsForEventHypothesis(
    EventHypothesis eventHypothesis, List<WfdiscDao> wfdiscDaos) {}
