package gms.shared.event.dao;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

/** Represents an event record in the `event` legacy table. */
@Entity
@Table(name = "event")
@NamedQuery(
    name = "event.findByTime",
    query =
        "SELECT DISTINCT event "
            + "FROM EventDao as event "
            + "JOIN OriginDao as origin "
            + "  WITH origin.eventId = event.eventId "
            + "JOIN OrigerrDao as origerr "
            + "  WITH origerr.originId = origin.originId "
            + "WHERE origin.latLonDepthTimeKey.time + origerr.originTimeError >= :startTime "
            + "  AND origin.latLonDepthTimeKey.time - origerr.originTimeError <= :endTime")
public class EventDao {

  private long eventId;
  private String eventName;
  private long preferredOrigin;
  private String author;
  private long commentId;
  private Instant loadDate;

  public EventDao() {}

  private EventDao(EventDao.Builder builder) {

    this.eventId = builder.eventId;
    this.eventName = builder.eventName;
    this.preferredOrigin = builder.preferredOrigin;
    this.author = builder.author;
    this.commentId = builder.commentId;
    this.loadDate = builder.loadDate;
  }

  @Id
  @Column(name = "evid")
  public long getEventId() {
    return eventId;
  }

  public void setEventId(long eventId) {
    this.eventId = eventId;
  }

  @Column(name = "evname")
  public String getEventName() {
    return eventName;
  }

  public void setEventName(String eventName) {
    this.eventName = eventName;
  }

  @Column(name = "prefor")
  public long getPreferredOrigin() {
    return preferredOrigin;
  }

  public void setPreferredOrigin(long preferredOrigin) {
    this.preferredOrigin = preferredOrigin;
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

    private static final int MAX_EVENT_NAME_LEN = 32;
    private static final int MAX_AUTHOR_LEN = 15;

    private long eventId;
    private String eventName;
    private long preferredOrigin;
    private String author;
    private long commentId;
    private Instant loadDate;

    public static EventDao.Builder initializeFromInstance(EventDao dao) {

      return new EventDao.Builder()
          .withEventId(dao.eventId)
          .withEventName(dao.eventName)
          .withPreferredOrigin(dao.preferredOrigin)
          .withAuthor(dao.author)
          .withCommentId(dao.commentId)
          .withLoadDate(dao.loadDate);
    }

    public Builder withEventId(long eventId) {
      this.eventId = eventId;
      return this;
    }

    public Builder withEventName(String eventName) {
      this.eventName = eventName;
      return this;
    }

    public Builder withPreferredOrigin(long preferredOrigin) {
      this.preferredOrigin = preferredOrigin;
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

    public EventDao build() {

      // NA not allowed
      checkArgument(0 < eventId, "Event Id is " + eventId + ".  It must be greater than 0.");

      checkNotNull(eventName, "Event name is null.");
      checkArgument(!eventName.isBlank(), "Event name is blank.");
      // "-" indicates NA value
      if (!"-".equals(eventName)) {
        checkArgument(
            eventName.length() <= MAX_EVENT_NAME_LEN,
            "Event name is %s %s",
            eventName,
            DaoHelperUtility.createCharLengthString(MAX_EVENT_NAME_LEN));
      }

      // NA not allowed
      checkArgument(
          0 < preferredOrigin,
          "ID of preferred origin is " + preferredOrigin + ".  It must be  greater than zero.");

      if (author == null) {
        author = "-";
      }
      checkArgument(!author.isBlank(), "Author is blank.");
      // "-" indicates NA value
      if (!"-".equals(author)) {
        checkArgument(
            author.length() <= MAX_AUTHOR_LEN,
            "Author is %s %s",
            author,
            DaoHelperUtility.createCharLengthString(MAX_AUTHOR_LEN));
      }

      // -1 indicates NA value
      if (commentId != -1) {
        checkArgument(
            0 < commentId,
            "Comment Id is " + commentId + DaoHelperUtility.createGreaterThanString(0));
      }

      checkNotNull(loadDate, "Load date is null.");

      return new EventDao(this);
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    var eventDao = (EventDao) o;
    return eventId == eventDao.eventId
        && preferredOrigin == eventDao.preferredOrigin
        && commentId == eventDao.commentId
        && Objects.equals(eventName, eventDao.eventName)
        && Objects.equals(author, eventDao.author)
        && Objects.equals(loadDate, eventDao.loadDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(eventId, eventName, preferredOrigin, author, commentId, loadDate);
  }

  @Override
  public String toString() {
    return "EventDao{"
        + "eventId="
        + eventId
        + ", eventName='"
        + eventName
        + '\''
        + ", preferredOrigin="
        + preferredOrigin
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
