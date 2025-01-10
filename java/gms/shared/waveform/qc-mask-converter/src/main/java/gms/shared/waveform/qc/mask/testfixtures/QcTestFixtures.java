package gms.shared.waveform.qc.mask.testfixtures;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import gms.shared.waveform.qc.mask.converter.QcDaoObject;
import gms.shared.waveform.qc.mask.dao.QcMaskIdStartSampleKey;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import java.time.Instant;
import java.util.UUID;

public final class QcTestFixtures {

  public static final Instant START_TIME =
      new NegativeNaInstantToDoubleConverter().convertToEntityAttribute(1546704000.0);
  public static final Instant END_TIME = START_TIME.plusSeconds(3600);
  public static final UUID PARENT_SEG_UIID =
      UUID.fromString("f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454");

  public static final long DEFAULT_QC_MASK_ID_A = 1_000_000_000_001L;
  public static final long DEFAULT_QC_MASK_ID_B = 1_000_000_000_002L;
  public static final String DEFAULT_STATION = "AS01";
  public static final String DEFAULT_CHANNEL_NAME = "SHZ";
  public static final SiteChanKey DEFAULT_SITE_CHAN_KEY = new SiteChanKey("ASAR", "AS01", END_TIME);
  public static final Channel DEFAULT_CHANNEL = Channel.createEntityReference("ASAR.AS01.SHZ");
  public static final double DEFAULT_SAMPLE_RATE_A = 20.0;
  public static final double DEFAULT_SAMPLE_RATE_B = 67.0;
  public static final long DEFAULT_END_SAMPLE = 45000;
  public static final long DEFAULT_START_SAMPLE = 35103;
  public static final QcMaskType DEFAULT_MASK_TYPE = QcMaskType.MULTIPLE_DATA_SPIKE;
  public static final long DEFAULT_MASK_TYPE_LONG_A = 20L;
  public static final long DEFAULT_MASK_TYPE_LONG_B = 40L;
  public static final long DEFAULT_MASK_TYPE_LONG_C = 50L;
  public static final String DEFAULT_AUTHOR = "al2:user4";

  private static final QcMaskIdStartSampleKey qcKey =
      new QcMaskIdStartSampleKey(DEFAULT_QC_MASK_ID_A, 34_521L);
  private static final QcMaskIdStartSampleKey qcKey2 =
      new QcMaskIdStartSampleKey(DEFAULT_QC_MASK_ID_B, 35103L);
  private static final QcMaskIdStartSampleKey qcKey3 =
      new QcMaskIdStartSampleKey(DEFAULT_QC_MASK_ID_A, 35103L);

  // QcMaskInfoDao objects
  public static final QcMaskInfoDao QCMASK_INFO_DAO1;
  public static final QcMaskInfoDao QCMASK_INFO_DAO2;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_NULL_CHAN;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_EMPTY_CHAN;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_NULL_STA;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_EMPTY_STA;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_NULL_START_TIME;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_NULL_END_TIME;
  public static final QcMaskInfoDao QCMASK_INFO_DAO_NAN_SAMPLE_RATE;

  // QcMaskSegDao objects
  public static final QcMaskSegDao QCMASK_SEG_DAO1;
  public static final QcMaskSegDao QCMASK_SEG_DAO2;
  public static final QcMaskSegDao QCMASK_SEG_DAO3;
  public static final QcMaskSegDao QCMASK_SEG_DAO4;
  public static final QcMaskSegDao QCMASK_SEG_DAO_NULL_AUTH;
  public static final QcMaskSegDao QCMASK_SEG_DAO_EMPTY_AUTH;
  public static final QcMaskSegDao QCMASK_SEG_DAO_NULL_LDDATE;

  private QcTestFixtures() {}

  /**
   * Create default QcDaoObject from default parameters
   *
   * @return qcDaoObject {@link QcDaoObject}
   */
  public static QcDaoObject getDefaultQcDaoObject() {
    var qcDaoObject = new QcDaoObject();
    qcDaoObject.setQcMaskId(DEFAULT_QC_MASK_ID_A);
    qcDaoObject.setStation(DEFAULT_STATION);
    qcDaoObject.setChannel(DEFAULT_CHANNEL_NAME);
    qcDaoObject.setStartTime(START_TIME);
    qcDaoObject.setEndTime(END_TIME);
    qcDaoObject.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    qcDaoObject.setEndSample(DEFAULT_END_SAMPLE);
    qcDaoObject.setStartSample(DEFAULT_START_SAMPLE);
    qcDaoObject.setMaskType(DEFAULT_MASK_TYPE);
    qcDaoObject.setAuthor(DEFAULT_AUTHOR);
    qcDaoObject.setLoadDate(START_TIME);

    return qcDaoObject;
  }

  static {
    // QcMaskInfo static object initialization
    QCMASK_INFO_DAO1 = new QcMaskInfoDao();
    QCMASK_INFO_DAO1.setChannel("SHZ");
    QCMASK_INFO_DAO1.setStation("AS01");
    QCMASK_INFO_DAO1.setStartTime(START_TIME);
    QCMASK_INFO_DAO1.setEndTime(END_TIME);
    QCMASK_INFO_DAO1.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO1.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO2 = new QcMaskInfoDao();
    QCMASK_INFO_DAO2.setChannel("SHZ");
    QCMASK_INFO_DAO2.setStation("AS02");
    QCMASK_INFO_DAO2.setStartTime(START_TIME);
    QCMASK_INFO_DAO2.setEndTime(END_TIME);
    QCMASK_INFO_DAO2.setSampleRate(DEFAULT_SAMPLE_RATE_B);
    QCMASK_INFO_DAO2.setQcMaskId(DEFAULT_QC_MASK_ID_B);

    // null and empty fields for qc mask info dao
    QCMASK_INFO_DAO_NULL_CHAN = new QcMaskInfoDao();
    QCMASK_INFO_DAO_NULL_CHAN.setChannel(null);
    QCMASK_INFO_DAO_NULL_CHAN.setStation("AS01");
    QCMASK_INFO_DAO_NULL_CHAN.setStartTime(START_TIME);
    QCMASK_INFO_DAO_NULL_CHAN.setEndTime(END_TIME);
    QCMASK_INFO_DAO_NULL_CHAN.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO_NULL_CHAN.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO_EMPTY_CHAN = new QcMaskInfoDao();
    QCMASK_INFO_DAO_EMPTY_CHAN.setChannel("");
    QCMASK_INFO_DAO_EMPTY_CHAN.setStation("AS01");
    QCMASK_INFO_DAO_EMPTY_CHAN.setStartTime(START_TIME);
    QCMASK_INFO_DAO_EMPTY_CHAN.setEndTime(END_TIME);
    QCMASK_INFO_DAO_EMPTY_CHAN.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO_EMPTY_CHAN.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO_NULL_STA = new QcMaskInfoDao();
    QCMASK_INFO_DAO_NULL_STA.setStation(null);
    QCMASK_INFO_DAO_NULL_STA.setChannel("SHZ");
    QCMASK_INFO_DAO_NULL_STA.setStartTime(START_TIME);
    QCMASK_INFO_DAO_NULL_STA.setEndTime(END_TIME);
    QCMASK_INFO_DAO_NULL_STA.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO_NULL_STA.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO_EMPTY_STA = new QcMaskInfoDao();
    QCMASK_INFO_DAO_EMPTY_STA.setStation("");
    QCMASK_INFO_DAO_EMPTY_STA.setChannel("SHZ");
    QCMASK_INFO_DAO_EMPTY_STA.setStartTime(START_TIME);
    QCMASK_INFO_DAO_EMPTY_STA.setEndTime(END_TIME);
    QCMASK_INFO_DAO_EMPTY_STA.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO_EMPTY_STA.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO_NULL_START_TIME = new QcMaskInfoDao();
    QCMASK_INFO_DAO_NULL_START_TIME.setStation("ASAR");
    QCMASK_INFO_DAO_NULL_START_TIME.setChannel("SHZ");
    QCMASK_INFO_DAO_NULL_START_TIME.setStartTime(null);
    QCMASK_INFO_DAO_NULL_START_TIME.setEndTime(END_TIME);
    QCMASK_INFO_DAO_NULL_START_TIME.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO_NULL_START_TIME.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO_NULL_END_TIME = new QcMaskInfoDao();
    QCMASK_INFO_DAO_NULL_END_TIME.setStation("ASAR");
    QCMASK_INFO_DAO_NULL_END_TIME.setChannel("SHZ");
    QCMASK_INFO_DAO_NULL_END_TIME.setStartTime(START_TIME);
    QCMASK_INFO_DAO_NULL_END_TIME.setEndTime(null);
    QCMASK_INFO_DAO_NULL_END_TIME.setSampleRate(DEFAULT_SAMPLE_RATE_A);
    QCMASK_INFO_DAO_NULL_END_TIME.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    QCMASK_INFO_DAO_NAN_SAMPLE_RATE = new QcMaskInfoDao();
    QCMASK_INFO_DAO_NAN_SAMPLE_RATE.setStation("ASAR");
    QCMASK_INFO_DAO_NAN_SAMPLE_RATE.setChannel("SHZ");
    QCMASK_INFO_DAO_NAN_SAMPLE_RATE.setStartTime(START_TIME);
    QCMASK_INFO_DAO_NAN_SAMPLE_RATE.setEndTime(END_TIME);
    QCMASK_INFO_DAO_NAN_SAMPLE_RATE.setSampleRate(Double.NaN);
    QCMASK_INFO_DAO_NAN_SAMPLE_RATE.setQcMaskId(DEFAULT_QC_MASK_ID_A);

    // QcMaskSeg static objects
    QCMASK_SEG_DAO1 = new QcMaskSegDao();
    QCMASK_SEG_DAO1.setQcMaskSegKey(qcKey);
    QCMASK_SEG_DAO1.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO1.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_A));
    QCMASK_SEG_DAO1.setAuthor(DEFAULT_AUTHOR);
    QCMASK_SEG_DAO1.setLoadDate(START_TIME);

    QCMASK_SEG_DAO2 = new QcMaskSegDao();
    QCMASK_SEG_DAO2.setQcMaskSegKey(qcKey);
    QCMASK_SEG_DAO2.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO2.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_C));
    QCMASK_SEG_DAO2.setAuthor(DEFAULT_AUTHOR);
    QCMASK_SEG_DAO2.setLoadDate(START_TIME);

    QCMASK_SEG_DAO3 = new QcMaskSegDao();
    QCMASK_SEG_DAO3.setQcMaskSegKey(qcKey2);
    QCMASK_SEG_DAO3.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO3.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_B));
    QCMASK_SEG_DAO3.setAuthor(DEFAULT_AUTHOR);
    QCMASK_SEG_DAO3.setLoadDate(START_TIME);

    QCMASK_SEG_DAO4 = new QcMaskSegDao();
    QCMASK_SEG_DAO4.setQcMaskSegKey(qcKey3);
    QCMASK_SEG_DAO4.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO4.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_C));
    QCMASK_SEG_DAO4.setAuthor(DEFAULT_AUTHOR);
    QCMASK_SEG_DAO4.setLoadDate(START_TIME);

    // null and empty fields for qc mask seg dao
    QCMASK_SEG_DAO_NULL_AUTH = new QcMaskSegDao();
    QCMASK_SEG_DAO_NULL_AUTH.setQcMaskSegKey(qcKey);
    QCMASK_SEG_DAO_NULL_AUTH.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO_NULL_AUTH.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_C));
    QCMASK_SEG_DAO_NULL_AUTH.setAuthor(null);
    QCMASK_SEG_DAO_NULL_AUTH.setLoadDate(START_TIME);

    QCMASK_SEG_DAO_EMPTY_AUTH = new QcMaskSegDao();
    QCMASK_SEG_DAO_EMPTY_AUTH.setQcMaskSegKey(qcKey);
    QCMASK_SEG_DAO_EMPTY_AUTH.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO_EMPTY_AUTH.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_C));
    QCMASK_SEG_DAO_EMPTY_AUTH.setAuthor("");
    QCMASK_SEG_DAO_EMPTY_AUTH.setLoadDate(START_TIME);

    QCMASK_SEG_DAO_NULL_LDDATE = new QcMaskSegDao();
    QCMASK_SEG_DAO_NULL_LDDATE.setQcMaskSegKey(qcKey);
    QCMASK_SEG_DAO_NULL_LDDATE.setEndSample(DEFAULT_END_SAMPLE);
    QCMASK_SEG_DAO_NULL_LDDATE.setMaskType(QcMaskType.fromId(DEFAULT_MASK_TYPE_LONG_C));
    QCMASK_SEG_DAO_NULL_LDDATE.setAuthor(DEFAULT_AUTHOR);
    QCMASK_SEG_DAO_NULL_LDDATE.setLoadDate(null);
  }
}
