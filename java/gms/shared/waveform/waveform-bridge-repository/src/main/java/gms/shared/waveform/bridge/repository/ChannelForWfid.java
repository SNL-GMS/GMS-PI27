package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.Optional;

/** Record containing Channel associated to wfid */
public record ChannelForWfid(Long wfid, Optional<Channel> channel) {}
