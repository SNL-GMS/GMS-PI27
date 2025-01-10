package gms.shared.common.connector;

/**
 * Aggregate class for {@link StagedConnector}s. Capable of storing multiple Connectors of the same
 * type with different names, or leveraging known uniqueness by storing using just the
 * StagedConnector's class.
 */
public class StagedConnectors extends TypedMap<StagedConnector<?>> {}
