package gms.shared.waveform.processingmask.coi;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** */
public class PMDataList {

  @JsonProperty("pmList")
  private List<PMData> pmList;

  public List<PMData> getPmList() {
    return pmList;
  }

  public void setPmList(List<PMData> pmList) {
    this.pmList = pmList;
  }
}
