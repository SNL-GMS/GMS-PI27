package gms.shared.common.connector;

import jakarta.persistence.EntityManagerFactory;

public abstract class AbstractPooledConnector<T> implements PooledConnector<T> {

  private final Class<T> daoClass;
  private final EntityManagerFactory entityManagerFactory;

  protected AbstractPooledConnector(Class<T> daoClass, EntityManagerFactory entityManagerFactory) {
    this.daoClass = daoClass;
    this.entityManagerFactory = entityManagerFactory;
  }

  @Override
  public Class<T> getDaoClass() {
    return daoClass;
  }

  @Override
  public EntityManagerFactory getEntityManagerFactory() {
    return entityManagerFactory;
  }
}
