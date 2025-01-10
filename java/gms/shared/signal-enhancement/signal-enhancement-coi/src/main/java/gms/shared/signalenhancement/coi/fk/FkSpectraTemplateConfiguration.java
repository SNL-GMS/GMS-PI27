package gms.shared.signalenhancement.coi.fk;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import java.util.List;

/** holds the results from pulling configuration info for FkSpectraTemplate */
public record FkSpectraTemplateConfiguration(
    FkWindow fkSpectraWindow,
    List<String> inputChannels,
    List<String> inputChannelGroups,
    FkSpectraParametersConfiguration fkSpectraParameters) {

  public FkSpectraTemplateConfiguration {

    Preconditions.checkNotNull(fkSpectraWindow);
    Preconditions.checkNotNull(inputChannels);
    Preconditions.checkNotNull(inputChannelGroups);
    Preconditions.checkNotNull(fkSpectraParameters);

    Preconditions.checkArgument(
        !inputChannelGroups.isEmpty(), "Input channel groups from config must not be empty.");
    Preconditions.checkArgument(
        !inputChannels.isEmpty(), "Input channels from config must not be empty.");
  }
}
