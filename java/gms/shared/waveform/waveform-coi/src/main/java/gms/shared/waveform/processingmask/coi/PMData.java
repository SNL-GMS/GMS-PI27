package gms.shared.waveform.processingmask.coi;

import com.fasterxml.jackson.annotation.JsonProperty;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;

/** */
public class PMData {

  @JsonProperty("sta")
  private String sta;

  @JsonProperty("chan")
  private String chan;

  @JsonProperty("processingOperation")
  private ProcessingOperation processingOperation;

  @JsonProperty("pmGroup")
  private long pmGroup;

  @JsonProperty("qcMaskId")
  private long qcmaskid;

  @JsonProperty("startSample")
  private int startSample;

  @JsonProperty("qcMaskType")
  private int qcMaskType;

  public String getSta() {
    return sta;
  }

  public void setSta(String sta) {
    this.sta = sta;
  }

  public String getChan() {
    return chan;
  }

  public void setChan(String chan) {
    this.chan = chan;
  }

  public ProcessingOperation getProcessingOperation() {
    return processingOperation;
  }

  public void setProcessingOperation(ProcessingOperation processingOperation) {
    this.processingOperation = processingOperation;
  }

  public long getPmGroup() {
    return pmGroup;
  }

  public void setPmGroup(long pmGroup) {
    this.pmGroup = pmGroup;
  }

  public long getQcmaskid() {
    return qcmaskid;
  }

  public void setQcmaskid(long qcmaskid) {
    this.qcmaskid = qcmaskid;
  }

  public int getStartSample() {
    return startSample;
  }

  public void setStartSample(int startSample) {
    this.startSample = startSample;
  }

  public int getQcMaskType() {
    return qcMaskType;
  }

  public void setQcMaskType(int qcMaskType) {
    this.qcMaskType = qcMaskType;
  }

  @Override
  public String toString() {
    return "PMData{pmGroup="
        + pmGroup
        + ", sta="
        + sta
        + ", chan="
        + chan
        + ", processingOperation="
        + processingOperation
        + ", qcmaskid="
        + qcmaskid
        + ", startSample="
        + startSample
        + ", qcMaskType="
        + qcMaskType
        + "}";
  }
}
