package gms.shared.waveform.qc.coi;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** */
public class QcDataList {

  @JsonProperty("qcSegmentList")
  private List<QcData> qcList;

  public List<QcData> getQcList() {
    return qcList;
  }

  public void setQcList(List<QcData> qcList) {
    this.qcList = qcList;
  }
}
