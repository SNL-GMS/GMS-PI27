package gms.shared.frameworks.osd.dao.stationreference;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceCalibration;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.Duration;

/** JPA data access object for {@link ReferenceCalibration} */
@Entity
@Table(name = "reference_calibration")
public class ReferenceCalibrationDao {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "reference_calibration_sequence")
  @SequenceGenerator(
      name = "reference_calibration_sequence",
      sequenceName = "reference_calibration_sequence",
      allocationSize = 5)
  private long id;

  @Column(name = "calibration_interval")
  private Duration calibrationInterval;

  @OneToOne(cascade = CascadeType.ALL)
  @JoinTable(
      name = "reference_calibration_calibrations",
      joinColumns = {
        @JoinColumn(
            name = "reference_calibration_id",
            table = "reference_calibration",
            referencedColumnName = "id",
            unique = true)
      },
      inverseJoinColumns = {
        @JoinColumn(
            name = "calibration_id",
            table = "calibrations",
            referencedColumnName = "id",
            unique = true)
      })
  private CalibrationDao calibrationDao;

  public ReferenceCalibrationDao() {}

  private ReferenceCalibrationDao(Duration calibrationInterval, CalibrationDao calibration) {
    this.calibrationInterval = calibrationInterval;
    this.calibrationDao = calibration;
  }

  /** Create a DAO from a COI */
  public static ReferenceCalibrationDao from(ReferenceCalibration referenceCalibration) {
    Preconditions.checkNotNull(
        referenceCalibration,
        "Cannot create ReferenceCalibrationDao from null ReferenceCalibration");

    // calibration interval information is optional since it is not always known. set to zero if not
    // known.
    var calibrationIntervalZero = Duration.ofSeconds(0);

    return new ReferenceCalibrationDao(
        calibrationIntervalZero, CalibrationDao.from(referenceCalibration.getCalibration()));
  }

  public static ReferenceCalibrationDao from(
      Duration calibrationInterval, ReferenceCalibration referenceCalibration) {
    Preconditions.checkNotNull(
        calibrationInterval, "Cannot create ReferenceCalibrationDao from null calibrationInterval");
    Preconditions.checkNotNull(
        referenceCalibration,
        "Cannot create ReferenceCalibrationDao from null ReferenceCalibration");

    return new ReferenceCalibrationDao(
        calibrationInterval, CalibrationDao.from(referenceCalibration.getCalibration()));
  }

  /** Create a COI from a DAO */
  public ReferenceCalibration toCoi() {
    return ReferenceCalibration.from(this.calibrationInterval, this.calibrationDao.toCoi());
  }

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public Duration getCalibrationInterval() {
    return calibrationInterval;
  }

  public void setCalibrationInterval(Duration calibrationInterval) {
    this.calibrationInterval = calibrationInterval;
  }

  public CalibrationDao getCalibration() {
    return calibrationDao;
  }

  public void setCalibration(CalibrationDao calibration) {
    this.calibrationDao = calibration;
  }
}
