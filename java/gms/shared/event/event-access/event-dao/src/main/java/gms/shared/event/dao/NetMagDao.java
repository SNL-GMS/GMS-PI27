package gms.shared.event.dao;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

/** Represents a record in the `netmag` legacy table. */
@Entity
@Table(name = "netmag")
public class NetMagDao {

  private long magnitudeId;
  private String network;
  private long originId;
  private long eventId;
  private String magnitudeType;
  private int numberOfStations;
  private double magnitude;
  private double magnitudeUncertainty;
  private String author;
  private long commentId;
  private Instant loadDate;

  public NetMagDao() {}

  private NetMagDao(Builder builder) {
    this.magnitudeId = builder.magnitudeId;
    this.network = builder.network;
    this.originId = builder.originId;
    this.eventId = builder.eventId;
    this.magnitudeType = builder.magnitudeType;
    this.numberOfStations = builder.numberOfStations;
    this.magnitude = builder.magnitude;
    this.magnitudeUncertainty = builder.magnitudeUncertainty;
    this.author = builder.author;
    this.commentId = builder.commentId;
    this.loadDate = builder.loadDate;
  }

  @Id
  @Column(name = "magid")
  public long getMagnitudeId() {
    return magnitudeId;
  }

  public void setMagnitudeId(long magnitudeId) {
    this.magnitudeId = magnitudeId;
  }

  @Column(name = "net")
  public String getNetwork() {
    return network;
  }

  public void setNetwork(String network) {
    this.network = network;
  }

  @Column(name = "orid")
  public long getOriginId() {
    return originId;
  }

  public void setOriginId(long originId) {
    this.originId = originId;
  }

  @Column(name = "evid")
  public long getEventId() {
    return eventId;
  }

  public void setEventId(long eventId) {
    this.eventId = eventId;
  }

  @Column(name = "magtype")
  public String getMagnitudeType() {
    return magnitudeType;
  }

  public void setMagnitudeType(String magnitudeType) {
    this.magnitudeType = magnitudeType;
  }

  @Column(name = "nsta")
  public int getNumberOfStations() {
    return numberOfStations;
  }

  public void setNumberOfStations(int numberOfStations) {
    this.numberOfStations = numberOfStations;
  }

  @Column(name = "magnitude")
  public double getMagnitude() {
    return magnitude;
  }

  public void setMagnitude(double magnitude) {
    this.magnitude = magnitude;
  }

  @Column(name = "uncertainty")
  public double getMagnitudeUncertainty() {
    return magnitudeUncertainty;
  }

  public void setMagnitudeUncertainty(double magnitudeUncertainty) {
    this.magnitudeUncertainty = magnitudeUncertainty;
  }

  @Column(name = "auth")
  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }

  @Column(name = "commid")
  public long getCommentId() {
    return commentId;
  }

  public void setCommentId(long commentId) {
    this.commentId = commentId;
  }

  @Column(name = "lddate")
  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant loadDate) {
    this.loadDate = loadDate;
  }

  public static class Builder {

    private static final double THRESHOLD = 0.0001;
    private static final double NA = -1.0;
    private static final double NA_MAG = -999.0;
    private static final double MAGNITUDE_MIN = -9.99;
    private static final double MAGNITUDE_MAX = 50.0;
    private static final int NA_INT = -1;
    private static final int NETWORK_STR_LEN = 8;
    private static final int MAGNITUDE_STR_LEN = 6;
    private static final int MAX_AUTHOR_STR_LEN = 15;

    private long magnitudeId;
    private String network;
    private long originId;
    private long eventId;
    private String magnitudeType;
    private int numberOfStations;
    private double magnitude;
    private double magnitudeUncertainty;
    private String author;
    private long commentId;
    private Instant loadDate;

    public static Builder initializeFromInstance(NetMagDao netMagDao) {

      return new NetMagDao.Builder()
          .withMagnitudeId(netMagDao.magnitudeId)
          .withNetwork(netMagDao.network)
          .withOriginId(netMagDao.originId)
          .withEventId(netMagDao.eventId)
          .withMagnitudeType(netMagDao.magnitudeType)
          .withNumberOfStations(netMagDao.numberOfStations)
          .withMagnitude(netMagDao.magnitude)
          .withMagnitudeUncertainty(netMagDao.magnitudeUncertainty)
          .withAuthor(netMagDao.author)
          .withCommentId(netMagDao.commentId)
          .withLoadDate(netMagDao.loadDate);
    }

    public Builder withMagnitudeId(long magnitudeId) {
      this.magnitudeId = magnitudeId;
      return this;
    }

    public Builder withNetwork(String network) {
      this.network = network;
      return this;
    }

    public Builder withOriginId(long originId) {
      this.originId = originId;
      return this;
    }

    public Builder withEventId(long eventId) {
      this.eventId = eventId;
      return this;
    }

    public Builder withMagnitudeType(String magnitudeType) {
      this.magnitudeType = magnitudeType;
      return this;
    }

    public Builder withNumberOfStations(int numberOfStations) {
      this.numberOfStations = numberOfStations;
      return this;
    }

    public Builder withMagnitude(double magnitude) {
      this.magnitude = magnitude;
      return this;
    }

    public Builder withMagnitudeUncertainty(double magnitudeUncertainty) {
      this.magnitudeUncertainty = magnitudeUncertainty;
      return this;
    }

    public Builder withAuthor(String author) {
      this.author = author;
      return this;
    }

    public Builder withCommentId(long commentId) {
      this.commentId = commentId;
      return this;
    }

    public Builder withLoadDate(Instant loadDate) {
      this.loadDate = loadDate;
      return this;
    }

    public NetMagDao build() {

      // -1 indicates NA value
      if (NA_INT != magnitudeId) {
        checkArgument(
            0 <= magnitudeId, "Magnitude Id is %s.  It must be non-negative.", magnitudeId);
      }

      checkNotNull(network, "Network identifier is null.");
      checkArgument(!network.isBlank(), "Network identifier is blank.");
      // "-" indicates NA value
      if (!"-".equals(network)) {
        checkArgument(
            network.length() <= NETWORK_STR_LEN,
            "Network identifier is %s.  Length of string must be no greater than %s.",
            network,
            NETWORK_STR_LEN);
      }

      // NA not allowed
      checkArgument(
          0 < originId,
          "The value of Origin Id is %s %s",
          originId,
          DaoHelperUtility.createGreaterThanString(0));

      // -1 indicates NA value (DBDD mistakenly says 1 is NA)
      if (-1 != eventId) {
        checkArgument(
            0 < eventId, "Event Id is %s %s", eventId, DaoHelperUtility.createGreaterThanString(0));
      }

      checkNotNull(magnitudeType, "Magnitude type is null.");
      checkArgument(!magnitudeType.isBlank(), "Magnitude type is blank.");
      // NA not allowed
      checkArgument(
          magnitudeType.length() <= MAGNITUDE_STR_LEN,
          "Magnitude type is %s.  Length of string must be no greater than %s.",
          magnitudeType,
          MAGNITUDE_STR_LEN);

      // -1 indicated NA value
      if (NA_INT != numberOfStations) {
        checkArgument(
            0 <= numberOfStations,
            "Number of stations is %s.  It must be non-negative.",
            numberOfStations);
      }

      verifyMagnitude();

      if (author == null) {
        author = "-";
      }
      checkArgument(!author.isBlank(), "Author is blank.");
      // "-" indicates NA value
      if (!"-".equals(author)) {
        checkArgument(
            author.length() <= MAX_AUTHOR_STR_LEN,
            "Author is %s %s",
            author,
            DaoHelperUtility.createCharLengthString(MAX_AUTHOR_STR_LEN));
      }

      // -1 indicates NA value
      if (commentId != NA_INT) {
        checkArgument(
            0 < commentId,
            "Comment Id is %s %s",
            commentId,
            DaoHelperUtility.createGreaterThanString(0));
      }

      checkNotNull(loadDate, "Load date is null.");

      return new NetMagDao(this);
    }

    private void verifyMagnitude() {
      // -999.0 indicates NA value
      if (!isNA(magnitude, NA_MAG)) {
        checkArgument(
            (MAGNITUDE_MIN < magnitude) && (magnitude < MAGNITUDE_MAX),
            "Magnitude is %s %s",
            magnitude,
            DaoHelperUtility.createRangeStringDouble(MAGNITUDE_MIN, MAGNITUDE_MAX, '(', ')'));
      }

      // -1.0 indicates NA value
      if (!isNA(magnitudeUncertainty, NA)) {
        checkArgument(
            0.0 < magnitudeUncertainty,
            "Magnitude uncertainty is %s %s",
            magnitudeUncertainty,
            DaoHelperUtility.createGreaterThanString(0));
      }
    }

    private static boolean isNA(double value, double target) {
      return Math.abs(value - target) < THRESHOLD;
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
    var netMagDao = (NetMagDao) o;
    return magnitudeId == netMagDao.magnitudeId
        && originId == netMagDao.originId
        && eventId == netMagDao.eventId
        && numberOfStations == netMagDao.numberOfStations
        && Double.compare(netMagDao.magnitude, magnitude) == 0
        && Double.compare(netMagDao.magnitudeUncertainty, magnitudeUncertainty) == 0
        && commentId == netMagDao.commentId
        && network.equals(netMagDao.network)
        && magnitudeType.equals(netMagDao.magnitudeType)
        && author.equals(netMagDao.author)
        && loadDate.equals(netMagDao.loadDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        magnitudeId,
        network,
        originId,
        eventId,
        magnitudeType,
        numberOfStations,
        magnitude,
        magnitudeUncertainty,
        author,
        commentId,
        loadDate);
  }

  @Override
  public String toString() {
    return "NetMagDao{"
        + "magnitudeId="
        + magnitudeId
        + ", network='"
        + network
        + '\''
        + ", originId="
        + originId
        + ", eventId="
        + eventId
        + ", magnitudeType='"
        + magnitudeType
        + '\''
        + ", numberOfStations="
        + numberOfStations
        + ", magnitude="
        + magnitude
        + ", magnitudeUncertainty="
        + magnitudeUncertainty
        + ", author='"
        + author
        + '\''
        + ", commentId="
        + commentId
        + ", loadDate="
        + loadDate
        + '}';
  }
}
