package gms.shared.fk.control.configuration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.Collection;

@AutoValue
public abstract class FkSpectraParameters {

  public abstract String getPluginName();

  public abstract ImmutableList<Channel> getChannels();

  public abstract FkSpectraDefinition getDefinition();

  @JsonCreator
  public static FkSpectraParameters from(
      @JsonProperty("pluginName") String pluginName,
      @JsonProperty("channels") Collection<Channel> channels,
      @JsonProperty("definition") FkSpectraDefinition definition) {
    return new AutoValue_FkSpectraParameters(
        pluginName, ImmutableList.copyOf(channels), definition);
  }
}
