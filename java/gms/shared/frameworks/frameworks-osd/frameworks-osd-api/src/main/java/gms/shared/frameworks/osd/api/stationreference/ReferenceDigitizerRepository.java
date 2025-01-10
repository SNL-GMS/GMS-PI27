package gms.shared.frameworks.osd.api.stationreference;

import gms.shared.frameworks.osd.coi.stationreference.ReferenceDigitizer;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceDigitizerMembership;
import java.util.List;
import java.util.UUID;

/** Interface for the endpoint that returns and stores {*link ReferenceDigitizer}s */
public interface ReferenceDigitizerRepository {

  /**
   * Gets all digitizers
   *
   * @return all digitizers
   */
  List<ReferenceDigitizer> retrieveDigitizers();

  /**
   * Retrieve all digitizers by entity id.
   *
   * @param id the {@link ReferenceDigitizer} id
   * @return all digitizer versions with that entity id
   */
  List<ReferenceDigitizer> retrieveDigitizersByEntityId(UUID id);

  /**
   * Retrieve all digitizers by name.
   *
   * @param name the {@link ReferenceDigitizer} name
   * @return all digitizer versions with that name
   */
  List<ReferenceDigitizer> retrieveDigitizersByName(String name);

  /**
   * Store ReferenceDigitizer to the relational database.
   *
   * @param digitizer the digitizer
   */
  void storeReferenceDigitizer(ReferenceDigitizer digitizer);

  /**
   * Retrieves all digitizer memberships
   *
   * @return the memberships
   */
  List<ReferenceDigitizerMembership> retrieveDigitizerMemberships();

  /**
   * Retrieves digitizer memberships with the given digitizer entity id.
   *
   * @param id the {@link ReferenceDigitizer} id
   * @return the memberships
   */
  List<ReferenceDigitizerMembership> retrieveDigitizerMembershipsByDigitizerId(UUID id);

  /**
   * Retrieves digitizer memberships with the given channel entity id.
   *
   * @param id the {@link Channel} id
   * @return the memberships
   */
  List<ReferenceDigitizerMembership> retrieveDigitizerMembershipsByChannelId(UUID id);

  /**
   * Retrieves digitizer memberships with the given digitizer entity id and channel entity id.
   *
   * @param digitizerId the {@link ReferenceDigitizer} id
   * @param channelId the {@link Channel} id
   * @return the memberships
   */
  List<ReferenceDigitizerMembership> retrieveDigitizerMembershipsByDigitizerAndChannelId(
      UUID digitizerId, UUID channelId);

  /**
   * Store a digitizer membership to the database.
   *
   * @param membership the {@link ReferenceDigitizerMembership} to store
   */
  void storeDigitizerMembership(ReferenceDigitizerMembership membership);
}
