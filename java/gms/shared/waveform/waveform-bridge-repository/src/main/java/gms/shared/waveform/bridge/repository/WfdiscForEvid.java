package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.dao.css.WfdiscDao;

/** Record containing WfdiscDao associated with evid */
public record WfdiscForEvid(Long evid, WfdiscDao wfdiscDao) {}
