package gms.shared.event.dao;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import com.google.common.math.DoubleMath;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.Objects;

/** Represents an Arrival Information record in the `AR INFO` legacy table. */
@Entity
@Table(name = "ar_info")
public class ArInfoDao {

  private static final double DOUBLE_EPSILON = 1e-10;
  private static final double DOUBLE_ZERO_NA_VALUE = 0.0;
  private static final double DOUBLE_DEFAULT_NA_VALUE = -1.0;
  private static final double MIN_RANGE_DOUBLE = -10.0;
  private static final double MAX_RANGE_DOUBLE = 10.0;
  // database constraint constants
  private static final int DEFAULT_MIN_VALUE = 0;
  private static final int AZ_ERROR_CODE_MAX = 19;
  private static final int AZ_IMPORT_MAX = 1;
  private static final int AZ_MEAS_ERROR_MAX = 180;
  private static final int AZ_MODEL_ERROR_MAX = 180;
  private static final int AZ_MODEL_PLUS_MEAS_ERROR_MAX = 360;
  private static final int AZ_SRC_DPNT_CORR_MIN = -180;
  private static final int AZ_SRC_DPNT_CORR_MAX = 180;
  private static final int BULK_STATIC_STA_CORR_MIN = -50;
  private static final int BULK_STATIC_STA_CORR_MAX = 50;
  private static final int ELEV_CORR_MIN = -50;
  private static final int ELEV_CORR_MAX = 50;
  private static final int ELLIP_CORR_MIN = -50;
  private static final int ELLIP_CORR_MAX = 50;
  private static final int SLOW_ERROR_CODE_MAX = 19;
  private static final int SLOW_IMPORT_MAX = 1;
  private static final int SLOW_VEC_RES_MIN = -1000;
  private static final int SLOW_VEC_RES_MAX = 1000;
  private static final int SL_SRC_DPNT_CORR_MIN = -50;
  private static final int SL_SRC_DPNT_CORR_MAX = 50;
  private static final int SRC_DPNT_CORR_TYPE_MAX = 15;
  private static final int TIME_ERROR_CODE_MAX = 19;
  private static final int TIME_IMPORT_MAX = 1;
  private static final int TOTAL_TRAVEL_TIME_MAX = 86400;
  private static final int TT_SRC_DPNT_CORR_MIN = -50;
  private static final int TT_SRC_DPNT_CORR_MAX = 50;
  private static final int TT_TABLE_VALUE_MAX = 86400;
  private static final int VELOCITY_STR_MAX_LEN = 15;

  private OriginIdArrivalIdKey originIdArrivalIdKey;
  private long timeErrorCode;
  private long azimuthErrorCode;
  private long slownessErrorCode;
  private long correctionCode;
  private String velocityModel;
  // totalTravelTime represents predicted travel time with all corrections
  private double totalTravelTime;
  // baseModelTravelTime represents base model travel time without corrections
  private double baseModelTravelTime;
  private double travelTimeEllipticityCorrection;
  private double travelTimeElevationCorrection;
  private double travelTimeStaticCorrection;
  private double travelTimeSourceSpecificCorrection;
  private double travelTimeModelError;
  private double travelTimeMeasurementError;
  private double travelTimeModelPlusMeasurementError;
  private double azimuthSourceSpecificCorrection;
  private double azimuthModelError;
  private double azimuthMeasurementError;
  private double azimuthModelPlusMeasurementError;
  private double slownessSourceSpecificCorrection;
  private double slownessModelError;
  private double slownessMeasurementError;
  private double slownessModelPlusMeasurementError;
  private double travelTimeImport;
  private double azimuthImport;
  private double slownessImport;
  private double slownessVectorResidual;
  private Instant loadDate;

  public ArInfoDao() {}

  private ArInfoDao(Builder builder) {
    this.originIdArrivalIdKey = builder.originIdArrivalIdKey;
    this.timeErrorCode = builder.timeErrorCode;
    this.azimuthErrorCode = builder.azimuthErrorCode;
    this.slownessErrorCode = builder.slownessErrorCode;
    this.correctionCode = builder.correctionCode;
    this.velocityModel = builder.velocityModel;
    this.totalTravelTime = builder.totalTravelTime;
    this.baseModelTravelTime = builder.baseModelTravelTime;
    this.travelTimeEllipticityCorrection = builder.travelTimeEllipticityCorrection;
    this.travelTimeElevationCorrection = builder.travelTimeElevationCorrection;
    this.travelTimeStaticCorrection = builder.travelTimeStaticCorrection;
    this.travelTimeSourceSpecificCorrection = builder.travelTimeSourceSpecificCorrection;
    this.travelTimeModelError = builder.travelTimeModelError;
    this.travelTimeMeasurementError = builder.travelTimeMeasurementError;
    this.travelTimeModelPlusMeasurementError = builder.travelTimeModelPlusMeasurementError;
    this.azimuthSourceSpecificCorrection = builder.azimuthSourceSpecificCorrection;
    this.azimuthModelError = builder.azimuthModelError;
    this.azimuthMeasurementError = builder.azimuthMeasurementError;
    this.azimuthModelPlusMeasurementError = builder.azimuthModelPlusMeasurementError;
    this.slownessSourceSpecificCorrection = builder.slownessSourceSpecificCorrection;
    this.slownessModelError = builder.slownessModelError;
    this.slownessMeasurementError = builder.slownessMeasurementError;
    this.slownessModelPlusMeasurementError = builder.slownessModelPlusMeasurementError;
    this.travelTimeImport = builder.travelTimeImport;
    this.azimuthImport = builder.azimuthImport;
    this.slownessImport = builder.slownessImport;
    this.slownessVectorResidual = builder.slownessVectorResidual;
    this.loadDate = builder.loadDate;
  }

  @EmbeddedId
  public OriginIdArrivalIdKey getOriginIdArrivalIdKey() {
    return originIdArrivalIdKey;
  }

  public void setOriginIdArrivalIdKey(OriginIdArrivalIdKey originIdArrivalIdKey) {
    this.originIdArrivalIdKey = originIdArrivalIdKey;
  }

  @Transient
  public long getOriginId() {
    return getOriginIdArrivalIdKey().getOriginId();
  }

  @Transient
  public long getArrivalId() {
    return getOriginIdArrivalIdKey().getArrivalId();
  }

  @Column(name = "time_error_code")
  public long getTimeErrorCode() {
    return timeErrorCode;
  }

  public void setTimeErrorCode(long timeErrorCode) {
    this.timeErrorCode = timeErrorCode;
  }

  @Column(name = "az_error_code")
  public long getAzimuthErrorCode() {
    return azimuthErrorCode;
  }

  public void setAzimuthErrorCode(long azimuthErrorCode) {
    this.azimuthErrorCode = azimuthErrorCode;
  }

  @Column(name = "slow_error_code")
  public long getSlownessErrorCode() {
    return slownessErrorCode;
  }

  public void setSlownessErrorCode(long slownessErrorCode) {
    this.slownessErrorCode = slownessErrorCode;
  }

  @Column(name = "src_dpnt_corr_type")
  public long getCorrectionCode() {
    return correctionCode;
  }

  public void setCorrectionCode(long correctionCode) {
    this.correctionCode = correctionCode;
  }

  @Column(name = "vmodel")
  public String getVelocityModel() {
    return velocityModel;
  }

  public void setVelocityModel(String velocityModel) {
    this.velocityModel = velocityModel;
  }

  @Column(name = "total_travel_time")
  public double getTotalTravelTime() {
    return totalTravelTime;
  }

  public void setTotalTravelTime(double totalTravelTime) {
    this.totalTravelTime = totalTravelTime;
  }

  @Column(name = "tt_table_value")
  public double getBaseModelTravelTime() {
    return baseModelTravelTime;
  }

  public void setBaseModelTravelTime(double baseModelTravelTime) {
    this.baseModelTravelTime = baseModelTravelTime;
  }

  @Column(name = "ellip_corr")
  public double getTravelTimeEllipticityCorrection() {
    return travelTimeEllipticityCorrection;
  }

  public void setTravelTimeEllipticityCorrection(double travelTimeEllipticityCorrection) {
    this.travelTimeEllipticityCorrection = travelTimeEllipticityCorrection;
  }

  @Column(name = "elev_corr")
  public double getTravelTimeElevationCorrection() {
    return travelTimeElevationCorrection;
  }

  public void setTravelTimeElevationCorrection(double travelTimeElevationCorrection) {
    this.travelTimeElevationCorrection = travelTimeElevationCorrection;
  }

  @Column(name = "bulk_static_sta_corr")
  public double getTravelTimeStaticCorrection() {
    return travelTimeStaticCorrection;
  }

  public void setTravelTimeStaticCorrection(double travelTimeStaticCorrection) {
    this.travelTimeStaticCorrection = travelTimeStaticCorrection;
  }

  @Column(name = "tt_src_dpnt_corr")
  public double getTravelTimeSourceSpecificCorrection() {
    return travelTimeSourceSpecificCorrection;
  }

  public void setTravelTimeSourceSpecificCorrection(double travelTimeSourceSpecificCorrection) {
    this.travelTimeSourceSpecificCorrection = travelTimeSourceSpecificCorrection;
  }

  @Column(name = "tt_model_error")
  public double getTravelTimeModelError() {
    return travelTimeModelError;
  }

  public void setTravelTimeModelError(double travelTimeModelError) {
    this.travelTimeModelError = travelTimeModelError;
  }

  @Column(name = "tt_meas_error")
  public double getTravelTimeMeasurementError() {
    return travelTimeMeasurementError;
  }

  public void setTravelTimeMeasurementError(double travelTimeMeasurementError) {
    this.travelTimeMeasurementError = travelTimeMeasurementError;
  }

  @Column(name = "tt_model_plus_meas_error")
  public double getTravelTimeModelPlusMeasurementError() {
    return travelTimeModelPlusMeasurementError;
  }

  public void setTravelTimeModelPlusMeasurementError(double travelTimeModelPlusMeasurementError) {
    this.travelTimeModelPlusMeasurementError = travelTimeModelPlusMeasurementError;
  }

  @Column(name = "az_src_dpnt_corr")
  public double getAzimuthSourceSpecificCorrection() {
    return azimuthSourceSpecificCorrection;
  }

  public void setAzimuthSourceSpecificCorrection(double azimuthSourceSpecificCorrection) {
    this.azimuthSourceSpecificCorrection = azimuthSourceSpecificCorrection;
  }

  @Column(name = "az_model_error")
  public double getAzimuthModelError() {
    return azimuthModelError;
  }

  public void setAzimuthModelError(double azimuthModelError) {
    this.azimuthModelError = azimuthModelError;
  }

  @Column(name = "az_meas_error")
  public double getAzimuthMeasurementError() {
    return azimuthMeasurementError;
  }

  public void setAzimuthMeasurementError(double azimuthMeasurementError) {
    this.azimuthMeasurementError = azimuthMeasurementError;
  }

  @Column(name = "az_model_plus_meas_error")
  public double getAzimuthModelPlusMeasurementError() {
    return azimuthModelPlusMeasurementError;
  }

  public void setAzimuthModelPlusMeasurementError(double azimuthModelPlusMeasurementError) {
    this.azimuthModelPlusMeasurementError = azimuthModelPlusMeasurementError;
  }

  @Column(name = "sl_src_dpnt_corr")
  public double getSlownessSourceSpecificCorrection() {
    return slownessSourceSpecificCorrection;
  }

  // TODO figure out the real solution for handling NULL values for the field coming from the
  // database
  public void setSlownessSourceSpecificCorrection(Double slownessSourceSpecificCorrection) {
    this.slownessSourceSpecificCorrection =
        Objects.requireNonNullElse(slownessSourceSpecificCorrection, 0.0);
  }

  @Column(name = "sl_model_error")
  public double getSlownessModelError() {
    return slownessModelError;
  }

  public void setSlownessModelError(double slownessModelError) {
    this.slownessModelError = slownessModelError;
  }

  @Column(name = "sl_meas_error")
  public double getSlownessMeasurementError() {
    return slownessMeasurementError;
  }

  public void setSlownessMeasurementError(double slownessMeasurementError) {
    this.slownessMeasurementError = slownessMeasurementError;
  }

  @Column(name = "sl_model_plus_meas_error")
  public double getSlownessModelPlusMeasurementError() {
    return slownessModelPlusMeasurementError;
  }

  public void setSlownessModelPlusMeasurementError(double slownessModelPlusMeasurementError) {
    this.slownessModelPlusMeasurementError = slownessModelPlusMeasurementError;
  }

  @Column(name = "time_import")
  public double getTravelTimeImport() {
    return travelTimeImport;
  }

  public void setTravelTimeImport(double travelTimeImport) {
    this.travelTimeImport = travelTimeImport;
  }

  @Column(name = "az_import")
  public double getAzimuthImport() {
    return azimuthImport;
  }

  public void setAzimuthImport(double azimuthImport) {
    this.azimuthImport = azimuthImport;
  }

  @Column(name = "slow_import")
  public double getSlownessImport() {
    return slownessImport;
  }

  public void setSlownessImport(double slownessImport) {
    this.slownessImport = slownessImport;
  }

  @Column(name = "slow_vec_res")
  public double getSlownessVectorResidual() {
    return slownessVectorResidual;
  }

  public void setSlownessVectorResidual(double slownessVectorResidual) {
    this.slownessVectorResidual = slownessVectorResidual;
  }

  @Column(name = "lddate")
  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant loadDate) {
    this.loadDate = loadDate;
  }

  public static class Builder {

    private OriginIdArrivalIdKey originIdArrivalIdKey;
    private long timeErrorCode;
    private long azimuthErrorCode;
    private long slownessErrorCode;
    private long correctionCode;
    private String velocityModel;
    private double totalTravelTime;
    private double baseModelTravelTime;
    private double travelTimeEllipticityCorrection;
    private double travelTimeElevationCorrection;
    private double travelTimeStaticCorrection;
    private double travelTimeSourceSpecificCorrection;
    private double travelTimeModelError;
    private double travelTimeMeasurementError;
    private double travelTimeModelPlusMeasurementError;
    private double azimuthSourceSpecificCorrection;
    private double azimuthModelError;
    private double azimuthMeasurementError;
    private double azimuthModelPlusMeasurementError;
    private double slownessSourceSpecificCorrection;
    private double slownessModelError;
    private double slownessMeasurementError;
    private double slownessModelPlusMeasurementError;
    private double travelTimeImport;
    private double azimuthImport;
    private double slownessImport;
    private double slownessVectorResidual;
    private Instant loadDate;

    public static Builder initializeFromInstance(ArInfoDao arInfoDao) {
      return new ArInfoDao.Builder()
          .withOriginIdArrivalIdKey(
              new OriginIdArrivalIdKey.Builder()
                  .withOriginId(arInfoDao.getOriginId())
                  .withArrivalId(arInfoDao.getArrivalId())
                  .build())
          .withTimeErrorCode(arInfoDao.timeErrorCode)
          .withAzimuthErrorCode(arInfoDao.azimuthErrorCode)
          .withSlownessErrorCode(arInfoDao.slownessErrorCode)
          .withCorrectionCode(arInfoDao.correctionCode)
          .withVelocityModel(arInfoDao.velocityModel)
          .withTotalTravelTime(arInfoDao.totalTravelTime)
          .withBaseModelTravelTime(arInfoDao.baseModelTravelTime)
          .withTravelTimeEllipticityCorrection(arInfoDao.travelTimeEllipticityCorrection)
          .withTravelTimeElevationCorrection(arInfoDao.travelTimeElevationCorrection)
          .withTravelTimeStaticCorrection(arInfoDao.travelTimeStaticCorrection)
          .withTravelTimeSourceSpecificCorrection(arInfoDao.travelTimeSourceSpecificCorrection)
          .withTravelTimeModelError(arInfoDao.travelTimeModelError)
          .withTravelTimeMeasurementError(arInfoDao.travelTimeMeasurementError)
          .withTravelTimeModelPlusMeasurementError(arInfoDao.travelTimeModelPlusMeasurementError)
          .withAzimuthSourceSpecificCorrection(arInfoDao.azimuthSourceSpecificCorrection)
          .withAzimuthModelError(arInfoDao.azimuthModelError)
          .withAzimuthMeasurementError(arInfoDao.azimuthMeasurementError)
          .withAzimuthModelPlusMeasurementError(arInfoDao.azimuthModelPlusMeasurementError)
          .withSlownessSourceSpecificCorrection(arInfoDao.slownessSourceSpecificCorrection)
          .withSlownessModelError(arInfoDao.slownessModelError)
          .withSlownessMeasurementError(arInfoDao.slownessMeasurementError)
          .withSlownessModelPlusMeasurementError(arInfoDao.slownessModelPlusMeasurementError)
          .withTravelTimeImport(arInfoDao.travelTimeImport)
          .withAzimuthImport(arInfoDao.azimuthImport)
          .withSlownessImport(arInfoDao.slownessImport)
          .withSlownessVectorResidual(arInfoDao.slownessVectorResidual)
          .withLoadDate(arInfoDao.loadDate);
    }

    public Builder withOriginIdArrivalIdKey(OriginIdArrivalIdKey originIdArrivalIdKey) {
      this.originIdArrivalIdKey = originIdArrivalIdKey;
      return this;
    }

    public Builder withTimeErrorCode(long timeErrorCode) {
      this.timeErrorCode = timeErrorCode;
      return this;
    }

    public Builder withAzimuthErrorCode(long azimuthErrorCode) {
      this.azimuthErrorCode = azimuthErrorCode;
      return this;
    }

    public Builder withSlownessErrorCode(long slownessErrorCode) {
      this.slownessErrorCode = slownessErrorCode;
      return this;
    }

    public Builder withCorrectionCode(long correctionCode) {
      this.correctionCode = correctionCode;
      return this;
    }

    public Builder withVelocityModel(String velocityModel) {
      this.velocityModel = velocityModel;
      return this;
    }

    public Builder withTotalTravelTime(double totalTravelTime) {
      this.totalTravelTime = totalTravelTime;
      return this;
    }

    public Builder withBaseModelTravelTime(double baseModelTravelTime) {
      this.baseModelTravelTime = baseModelTravelTime;
      return this;
    }

    public Builder withTravelTimeEllipticityCorrection(double travelTimeEllipticityCorrection) {
      this.travelTimeEllipticityCorrection = travelTimeEllipticityCorrection;
      return this;
    }

    public Builder withTravelTimeElevationCorrection(double travelTimeElevationCorrection) {
      this.travelTimeElevationCorrection = travelTimeElevationCorrection;
      return this;
    }

    public Builder withTravelTimeStaticCorrection(double travelTimeStaticCorrection) {
      this.travelTimeStaticCorrection = travelTimeStaticCorrection;
      return this;
    }

    public Builder withTravelTimeSourceSpecificCorrection(
        double travelTimeSourceSpecificCorrection) {
      this.travelTimeSourceSpecificCorrection = travelTimeSourceSpecificCorrection;
      return this;
    }

    public Builder withTravelTimeModelError(double travelTimeModelError) {
      this.travelTimeModelError = travelTimeModelError;
      return this;
    }

    public Builder withTravelTimeMeasurementError(double travelTimeMeasurementError) {
      this.travelTimeMeasurementError = travelTimeMeasurementError;
      return this;
    }

    public Builder withTravelTimeModelPlusMeasurementError(
        double travelTimeModelPlusMeasurementError) {
      this.travelTimeModelPlusMeasurementError = travelTimeModelPlusMeasurementError;
      return this;
    }

    public Builder withAzimuthSourceSpecificCorrection(double azimuthSourceSpecificCorrection) {
      this.azimuthSourceSpecificCorrection = azimuthSourceSpecificCorrection;
      return this;
    }

    public Builder withAzimuthModelError(double azimuthModelError) {
      this.azimuthModelError = azimuthModelError;
      return this;
    }

    public Builder withAzimuthMeasurementError(double azimuthMeasurementError) {
      this.azimuthMeasurementError = azimuthMeasurementError;
      return this;
    }

    public Builder withAzimuthModelPlusMeasurementError(double azimuthModelPlusMeasurementError) {
      this.azimuthModelPlusMeasurementError = azimuthModelPlusMeasurementError;
      return this;
    }

    public Builder withSlownessSourceSpecificCorrection(double slownessSourceSpecificCorrection) {
      this.slownessSourceSpecificCorrection = slownessSourceSpecificCorrection;
      return this;
    }

    public Builder withSlownessModelError(double slownessModelError) {
      this.slownessModelError = slownessModelError;
      return this;
    }

    public Builder withSlownessMeasurementError(double slownessMeasurementError) {
      this.slownessMeasurementError = slownessMeasurementError;
      return this;
    }

    public Builder withSlownessModelPlusMeasurementError(double slownessModelPlusMeasurementError) {
      this.slownessModelPlusMeasurementError = slownessModelPlusMeasurementError;
      return this;
    }

    public Builder withTravelTimeImport(double travelTimeImport) {
      this.travelTimeImport = travelTimeImport;
      return this;
    }

    public Builder withAzimuthImport(double azimuthImport) {
      this.azimuthImport = azimuthImport;
      return this;
    }

    public Builder withSlownessImport(double slownessImport) {
      this.slownessImport = slownessImport;
      return this;
    }

    public Builder withSlownessVectorResidual(double slownessVectorResidual) {
      this.slownessVectorResidual = slownessVectorResidual;
      return this;
    }

    public Builder withLoadDate(Instant loadDate) {
      this.loadDate = loadDate;
      return this;
    }

    public ArInfoDao build() {

      checkNotNull(originIdArrivalIdKey, "OriginIdArrivalIdKey is null.");

      var verifier = new Verifier();
      verifier.checkArgumentsDoubleDouble();
      verifier.checkArgumentsLongInt();
      verifier.checkArgumentsDoubleInt();

      checkNotNull(loadDate, "Load date is null.");

      // "-" indicates NA value
      checkNotNull(velocityModel, "Velocity model string is null.");
      if (!"-".equals(velocityModel)) {
        checkArgument(
            velocityModel.length() <= VELOCITY_STR_MAX_LEN,
            "Velocity model string is \""
                + velocityModel
                + DaoHelperUtility.createCharLengthString(VELOCITY_STR_MAX_LEN));
      }

      return new ArInfoDao(this);
    }

    private class Verifier {

      private void checkArgumentsDoubleDouble() {
        // -999.0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(slownessVectorResidual, SLOW_VEC_RES_MIN, SLOW_VEC_RES_MAX),
            "Residual between predicted and observed FK vector is "
                + slownessVectorResidual
                + DaoHelperUtility.createRangeStringDouble(
                    SLOW_VEC_RES_MIN, SLOW_VEC_RES_MAX, '[', ']'));
      }

      // 0 indicates NA value but is in range check
      private void checkArgumentsLongInt() {
        checkArgument(
            inRangeInclusive(azimuthErrorCode, DEFAULT_MIN_VALUE, AZ_ERROR_CODE_MAX),
            "Azimuth error code is "
                + azimuthErrorCode
                + DaoHelperUtility.createRangeStringInt(
                    DEFAULT_MIN_VALUE, AZ_ERROR_CODE_MAX, '[', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(slownessErrorCode, DEFAULT_MIN_VALUE, SLOW_ERROR_CODE_MAX),
            "Slowness error code is "
                + slownessErrorCode
                + DaoHelperUtility.createRangeStringInt(
                    DEFAULT_MIN_VALUE, SLOW_ERROR_CODE_MAX, '[', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeExcInc(correctionCode, DEFAULT_MIN_VALUE, SRC_DPNT_CORR_TYPE_MAX)
                || DoubleMath.fuzzyEquals(correctionCode, DOUBLE_ZERO_NA_VALUE, DOUBLE_EPSILON),
            "Correction code is "
                + correctionCode
                + DaoHelperUtility.createRangeStringInt(1, SRC_DPNT_CORR_TYPE_MAX, '(', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(timeErrorCode, DEFAULT_MIN_VALUE, TIME_ERROR_CODE_MAX),
            "Time error code is "
                + timeErrorCode
                + DaoHelperUtility.createRangeStringInt(
                    DEFAULT_MIN_VALUE, TIME_ERROR_CODE_MAX, '[', ']'));
      }

      private void checkArgumentsDoubleInt() {
        checkArgument(
            inRangeInclusive(azimuthImport, DEFAULT_MIN_VALUE, AZ_IMPORT_MAX)
                || DoubleMath.fuzzyEquals(azimuthImport, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Azimuth import is "
                + azimuthImport
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, AZ_IMPORT_MAX, '[', ']'));

        checkArgument(
            inRangeExcInc(azimuthMeasurementError, DEFAULT_MIN_VALUE, AZ_MEAS_ERROR_MAX)
                || DoubleMath.fuzzyEquals(
                    azimuthMeasurementError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Azimuth measurement uncertainty is "
                + azimuthMeasurementError
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, AZ_MEAS_ERROR_MAX, '(', ']'));

        checkArgument(
            inRangeExcInc(azimuthModelError, DEFAULT_MIN_VALUE, AZ_MODEL_ERROR_MAX)
                || DoubleMath.fuzzyEquals(
                    azimuthModelError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Azimuth model uncertainty is "
                + azimuthModelError
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, AZ_MODEL_ERROR_MAX, '(', ']'));

        checkArgument(
            inRangeExcInc(
                    azimuthModelPlusMeasurementError,
                    DEFAULT_MIN_VALUE,
                    AZ_MODEL_PLUS_MEAS_ERROR_MAX)
                || DoubleMath.fuzzyEquals(
                    azimuthModelPlusMeasurementError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Combined azimuth model and measurement uncertainty is "
                + azimuthModelPlusMeasurementError
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, AZ_MODEL_PLUS_MEAS_ERROR_MAX, '(', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(
                azimuthSourceSpecificCorrection, AZ_SRC_DPNT_CORR_MIN, AZ_SRC_DPNT_CORR_MAX),
            "Source-specific azimuth correction is "
                + azimuthSourceSpecificCorrection
                + DaoHelperUtility.createRangeStringDouble(
                    AZ_SRC_DPNT_CORR_MIN, AZ_SRC_DPNT_CORR_MAX, '[', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(
                travelTimeStaticCorrection, BULK_STATIC_STA_CORR_MIN, BULK_STATIC_STA_CORR_MAX),
            "Static station correction to travel time is "
                + travelTimeStaticCorrection
                + DaoHelperUtility.createRangeStringDouble(
                    BULK_STATIC_STA_CORR_MIN, BULK_STATIC_STA_CORR_MIN, '[', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(travelTimeElevationCorrection, ELEV_CORR_MIN, ELEV_CORR_MAX),
            "Travel time correction due to station elevation is "
                + travelTimeElevationCorrection
                + DaoHelperUtility.createRangeStringDouble(ELEV_CORR_MIN, ELEV_CORR_MAX, '[', ']'));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(travelTimeEllipticityCorrection, ELLIP_CORR_MIN, ELLIP_CORR_MAX),
            "Travel time correction due to earth's ellipticity is "
                + travelTimeEllipticityCorrection
                + DaoHelperUtility.createRangeStringDouble(
                    ELLIP_CORR_MIN, ELLIP_CORR_MAX, '[', ']'));

        checkArgument(
            inRangeInclusive(slownessImport, DEFAULT_MIN_VALUE, SLOW_IMPORT_MAX)
                || DoubleMath.fuzzyEquals(slownessImport, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Slowness import is "
                + slownessImport
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, SLOW_IMPORT_MAX, '[', ']'));
        // this one needs some care
        checkArgument(
            (DEFAULT_MIN_VALUE <= slownessMeasurementError)
                || DoubleMath.fuzzyEquals(
                    slownessMeasurementError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Slowness measurement uncertainty is "
                + slownessMeasurementError
                + DaoHelperUtility.createGreaterThanString(DEFAULT_MIN_VALUE));

        checkArgument(
            (DEFAULT_MIN_VALUE <= slownessModelError)
                || DoubleMath.fuzzyEquals(
                    slownessModelError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Slowness model uncertainty is "
                + slownessModelError
                + DaoHelperUtility.createGreaterThanString(DEFAULT_MIN_VALUE));

        checkArgument(
            (DEFAULT_MIN_VALUE <= slownessModelPlusMeasurementError)
                || DoubleMath.fuzzyEquals(
                    slownessModelPlusMeasurementError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Combined slowness model and measurement uncertainty is "
                + slownessModelPlusMeasurementError
                + DaoHelperUtility.createGreaterThanString(DEFAULT_MIN_VALUE));

        // 0.0 indicates NA value
        checkArgument(
            inRangeInclusive(
                slownessSourceSpecificCorrection, SL_SRC_DPNT_CORR_MIN, SL_SRC_DPNT_CORR_MAX),
            "Source-specific slowness correction is "
                + slownessSourceSpecificCorrection
                + DaoHelperUtility.createRangeStringDouble(
                    SL_SRC_DPNT_CORR_MIN, SL_SRC_DPNT_CORR_MAX, '[', ']'));

        verifyTravelTime();
      }

      private void verifyTravelTime() {
        checkArgument(
            inRangeInclusive(travelTimeImport, DEFAULT_MIN_VALUE, TIME_IMPORT_MAX)
                || DoubleMath.fuzzyEquals(
                    travelTimeImport, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Travel time import is "
                + travelTimeImport
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, TIME_IMPORT_MAX, '[', ']'));

        checkArgument(
            inRangeExcInc(totalTravelTime, DEFAULT_MIN_VALUE, TOTAL_TRAVEL_TIME_MAX)
                || DoubleMath.fuzzyEquals(totalTravelTime, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Total travel time is "
                + totalTravelTime
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, TOTAL_TRAVEL_TIME_MAX, '(', ']'));

        checkArgument(
            (DEFAULT_MIN_VALUE < travelTimeMeasurementError)
                || DoubleMath.fuzzyEquals(
                    travelTimeMeasurementError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Travel time measurement uncertainty is "
                + travelTimeMeasurementError
                + DaoHelperUtility.createGreaterThanString(DEFAULT_MIN_VALUE));

        checkArgument(
            (DEFAULT_MIN_VALUE < travelTimeModelError)
                || DoubleMath.fuzzyEquals(
                    travelTimeModelError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Travel time model uncertainty is "
                + travelTimeModelError
                + DaoHelperUtility.createGreaterThanString(DEFAULT_MIN_VALUE));

        checkArgument(
            (DEFAULT_MIN_VALUE < travelTimeModelPlusMeasurementError)
                || DoubleMath.fuzzyEquals(
                    travelTimeModelPlusMeasurementError, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Combined travel time model and measurement uncertainty is "
                + travelTimeModelPlusMeasurementError
                + DaoHelperUtility.createGreaterThanString(DEFAULT_MIN_VALUE));
        // 0 indicates NA value but is in range check
        checkArgument(
            inRangeInclusive(
                travelTimeSourceSpecificCorrection, TT_SRC_DPNT_CORR_MIN, TT_SRC_DPNT_CORR_MAX),
            "Source-specific correction to travel time is "
                + travelTimeSourceSpecificCorrection
                + DaoHelperUtility.createRangeStringDouble(
                    MIN_RANGE_DOUBLE, MAX_RANGE_DOUBLE, '[', ']'));

        checkArgument(
            inRangeExcInc(baseModelTravelTime, DEFAULT_MIN_VALUE, TT_TABLE_VALUE_MAX)
                || DoubleMath.fuzzyEquals(
                    baseModelTravelTime, DOUBLE_DEFAULT_NA_VALUE, DOUBLE_EPSILON),
            "Base model travel time is "
                + baseModelTravelTime
                + DaoHelperUtility.createRangeStringDouble(
                    DEFAULT_MIN_VALUE, TT_TABLE_VALUE_MAX, '(', ']'));
      }

      private static boolean inRangeInclusive(double value, int min, int max) {
        return (min <= value) && (value <= max);
      }

      private static boolean inRangeExcInc(double value, int min, int max) {
        return (min < value) && (value <= max);
      }
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }
    if (this.getClass() != o.getClass()) {
      return false;
    }
    var arInfoDao = (ArInfoDao) o;
    return timeErrorCode == arInfoDao.timeErrorCode
        && azimuthErrorCode == arInfoDao.azimuthErrorCode
        && slownessErrorCode == arInfoDao.slownessErrorCode
        && correctionCode == arInfoDao.correctionCode
        && Double.compare(arInfoDao.totalTravelTime, totalTravelTime) == 0
        && Double.compare(arInfoDao.baseModelTravelTime, baseModelTravelTime) == 0
        && Double.compare(
                arInfoDao.travelTimeEllipticityCorrection, travelTimeEllipticityCorrection)
            == 0
        && Double.compare(arInfoDao.travelTimeElevationCorrection, travelTimeElevationCorrection)
            == 0
        && Double.compare(arInfoDao.travelTimeStaticCorrection, travelTimeStaticCorrection) == 0
        && Double.compare(
                arInfoDao.travelTimeSourceSpecificCorrection, travelTimeSourceSpecificCorrection)
            == 0
        && Double.compare(arInfoDao.travelTimeModelError, travelTimeModelError) == 0
        && Double.compare(arInfoDao.travelTimeMeasurementError, travelTimeMeasurementError) == 0
        && Double.compare(
                arInfoDao.travelTimeModelPlusMeasurementError, travelTimeModelPlusMeasurementError)
            == 0
        && Double.compare(
                arInfoDao.azimuthSourceSpecificCorrection, azimuthSourceSpecificCorrection)
            == 0
        && Double.compare(arInfoDao.azimuthModelError, azimuthModelError) == 0
        && Double.compare(arInfoDao.azimuthMeasurementError, azimuthMeasurementError) == 0
        && Double.compare(
                arInfoDao.azimuthModelPlusMeasurementError, azimuthModelPlusMeasurementError)
            == 0
        && Double.compare(
                arInfoDao.slownessSourceSpecificCorrection, slownessSourceSpecificCorrection)
            == 0
        && Double.compare(arInfoDao.slownessModelError, slownessModelError) == 0
        && Double.compare(arInfoDao.slownessMeasurementError, slownessMeasurementError) == 0
        && Double.compare(
                arInfoDao.slownessModelPlusMeasurementError, slownessModelPlusMeasurementError)
            == 0
        && Double.compare(arInfoDao.travelTimeImport, travelTimeImport) == 0
        && Double.compare(arInfoDao.azimuthImport, azimuthImport) == 0
        && Double.compare(arInfoDao.slownessImport, slownessImport) == 0
        && Double.compare(arInfoDao.slownessVectorResidual, slownessVectorResidual) == 0
        && originIdArrivalIdKey.equals(arInfoDao.originIdArrivalIdKey)
        && velocityModel.equals(arInfoDao.velocityModel)
        && loadDate.equals(arInfoDao.loadDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        originIdArrivalIdKey,
        timeErrorCode,
        azimuthErrorCode,
        slownessErrorCode,
        correctionCode,
        velocityModel,
        totalTravelTime,
        baseModelTravelTime,
        travelTimeEllipticityCorrection,
        travelTimeElevationCorrection,
        travelTimeStaticCorrection,
        travelTimeSourceSpecificCorrection,
        travelTimeModelError,
        travelTimeMeasurementError,
        travelTimeModelPlusMeasurementError,
        azimuthSourceSpecificCorrection,
        azimuthModelError,
        azimuthMeasurementError,
        azimuthModelPlusMeasurementError,
        slownessSourceSpecificCorrection,
        slownessModelError,
        slownessMeasurementError,
        slownessModelPlusMeasurementError,
        travelTimeImport,
        azimuthImport,
        slownessImport,
        slownessVectorResidual,
        loadDate);
  }

  @Override
  public String toString() {
    return "ArInfoDao{"
        + "originIdArrivalIdKey="
        + originIdArrivalIdKey
        + ", timeErrorCode="
        + timeErrorCode
        + ", azimuthErrorCode="
        + azimuthErrorCode
        + ", slownessErrorCode="
        + slownessErrorCode
        + ", correctionCode="
        + correctionCode
        + ", velocityModel='"
        + velocityModel
        + '\''
        + ", totalTravelTime="
        + totalTravelTime
        + ", baseModelTravelTime="
        + baseModelTravelTime
        + ", travelTimeEllipticityCorrection="
        + travelTimeEllipticityCorrection
        + ", travelTimeElevationCorrection="
        + travelTimeElevationCorrection
        + ", travelTimeStaticCorrection="
        + travelTimeStaticCorrection
        + ", travelTimeSourceSpecificCorrection="
        + travelTimeSourceSpecificCorrection
        + ", travelTimeModelError="
        + travelTimeModelError
        + ", travelTimeMeasurementError="
        + travelTimeMeasurementError
        + ", travelTimeModelPlusMeasurementError="
        + travelTimeModelPlusMeasurementError
        + ", azimuthSourceSpecificCorrection="
        + azimuthSourceSpecificCorrection
        + ", azimuthModelError="
        + azimuthModelError
        + ", azimuthMeasurementError="
        + azimuthMeasurementError
        + ", azimuthModelPlusMeasurementError="
        + azimuthModelPlusMeasurementError
        + ", slownessSourceSpecificCorrection="
        + slownessSourceSpecificCorrection
        + ", slownessModelError="
        + slownessModelError
        + ", slownessMeasurementError="
        + slownessMeasurementError
        + ", slownessModelPlusMeasurementError="
        + slownessModelPlusMeasurementError
        + ", travelTimeImport="
        + travelTimeImport
        + ", azimuthImport="
        + azimuthImport
        + ", slownessImport="
        + slownessImport
        + ", slownessVectorResidual="
        + slownessVectorResidual
        + ", loadDate="
        + loadDate
        + '}';
  }
}
