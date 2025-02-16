package gms.shared.frameworks.osd.dao.channel;

import gms.shared.frameworks.osd.coi.channel.ChannelGroup;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup.Type;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Entity
@Table(name = "channel_group")
@NamedEntityGraph(
    name = "channel-group-graph",
    attributeNodes = {@NamedAttributeNode("channels")})
public class ChannelGroupDao implements Serializable {

  @Id
  @Column(name = "name", nullable = false, unique = true)
  private String name;

  @Column(name = "description", nullable = false, length = 255)
  private String description;

  @Embedded private LocationDao location;

  @Enumerated(EnumType.STRING)
  private ChannelGroup.Type type;

  @ManyToMany
  @JoinTable(
      name = "channel_group_channels",
      joinColumns =
          @JoinColumn(
              table = "channel_group",
              referencedColumnName = "name",
              name = "channel_group_name"),
      inverseJoinColumns =
          @JoinColumn(table = "channel", referencedColumnName = "name", name = "channel_name"))
  private List<ChannelDao> channels;

  @ManyToOne
  @JoinColumn(name = "station_name", referencedColumnName = "name", nullable = false)
  private StationDao station;

  public ChannelGroupDao() {}

  public ChannelGroupDao(
      String name,
      String description,
      LocationDao location,
      Type type,
      List<ChannelDao> channels,
      StationDao station) {
    this.name = name;
    this.description = description;
    this.location = location;
    this.type = type;
    this.channels = channels;
    this.station = station;
  }

  public static ChannelGroupDao from(ChannelGroup channelGroup, Station station) {
    List<ChannelDao> channels = channelGroup.getChannels().stream().map(ChannelDao::from).toList();
    var locationDao = channelGroup.getLocation().map(LocationDao::new).orElse(null);
    return new ChannelGroupDao(
        channelGroup.getName(),
        channelGroup.getDescription(),
        locationDao,
        channelGroup.getType(),
        channels,
        StationDao.from(station));
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Optional<LocationDao> getLocation() {
    return Optional.ofNullable(location);
  }

  public void setLocation(LocationDao location) {
    this.location = location;
  }

  public Type getType() {
    return type;
  }

  public void setType(Type type) {
    this.type = type;
  }

  public List<ChannelDao> getChannels() {
    return channels;
  }

  public void setChannels(List<ChannelDao> channels) {
    this.channels = channels;
  }

  public StationDao getStation() {
    return station;
  }

  public void setStation(StationDao station) {
    this.station = station;
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
    ChannelGroupDao that = (ChannelGroupDao) o;
    return Objects.equals(name, that.name)
        && Objects.equals(description, that.description)
        && Objects.equals(location, that.location)
        && type == that.type
        && Objects.equals(channels, that.channels)
        && Objects.equals(station, that.station);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, description, location, type, channels, station);
  }

  @Override
  public String toString() {
    return "ChannelGroupDao{"
        + "name='"
        + name
        + '\''
        + ", description='"
        + description
        + '\''
        + ", location="
        + location
        + ", type="
        + type
        + ", channels="
        + channels
        + ", station="
        + station
        + '}';
  }
}
