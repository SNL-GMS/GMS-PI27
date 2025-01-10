package gms.shared.waveform.qc.coi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

/** */
@JsonIgnoreProperties(ignoreUnknown = true)
public class QcData {

  @JsonProperty("qcMaskId")
  private long qcmaskid;

  @JsonProperty("sta")
  private String sta;

  @JsonProperty("chan")
  private String chan;

  @JsonProperty("startTime")
  private Instant startTime;

  @JsonProperty("endTime")
  private Instant endTime;

  @JsonProperty("sampRate")
  private double sampRate;

  @JsonProperty("nseg")
  private int nseg;

  @JsonProperty("qcDefId")
  private long qcdefid;

  @JsonProperty("createdBy")
  private String createdBy;

  @JsonProperty("lddate")
  private Instant lddate;

  @JsonProperty("startSample")
  private int startSample;

  @JsonProperty("endSample")
  private int endSample;

  @JsonProperty("maskType")
  private int maskType;

  public long getQcmaskid() {
    return qcmaskid;
  }

  public void setQcmaskid(long qcmaskid) {
    this.qcmaskid = qcmaskid;
  }

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

  public Instant getStartTime() {
    return startTime;
  }

  public void setStartTime(Instant startTime) {
    this.startTime = startTime;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

  public double getSampRate() {
    return sampRate;
  }

  public void setSampRate(double sampRate) {
    this.sampRate = sampRate;
  }

  public int getNseg() {
    return nseg;
  }

  public void setNseg(int nseg) {
    this.nseg = nseg;
  }

  public long getQcdefid() {
    return qcdefid;
  }

  public void setQcdefid(long qcdefid) {
    this.qcdefid = qcdefid;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }

  public Instant getLddate() {
    return lddate;
  }

  public void setLddate(Instant lddate) {
    this.lddate = lddate;
  }

  public int getStartSample() {
    return startSample;
  }

  public void setStartSample(int startSample) {
    this.startSample = startSample;
  }

  public int getEndSample() {
    return endSample;
  }

  public void setEndSample(int endSample) {
    this.endSample = endSample;
  }

  public int getMaskType() {
    return maskType;
  }

  public void setMaskType(int maskType) {
    this.maskType = maskType;
  }

  @Override
  public String toString() {
    return "QcData{qcmaskid="
        + qcmaskid
        + ", sta="
        + sta
        + ", chan="
        + chan
        + ", startTime="
        + startTime
        + ", endTime="
        + endTime
        + ", sampRate="
        + sampRate
        + ", nseg="
        + nseg
        + ", qcdefid="
        + qcdefid
        + ", lddate="
        + lddate
        + ", startSample="
        + startSample
        + ", endSample="
        + endSample
        + ", maskType="
        + maskType
        + '}';
  }
}
