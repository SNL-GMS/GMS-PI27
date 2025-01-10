package gms.shared.frameworks.osd.repository.utils;

import gms.shared.frameworks.osd.api.util.RepositoryExceptionUtils;
import jakarta.persistence.EntityManager;
import java.util.Collection;
import java.util.Objects;
import java.util.function.Function;

/**
 * A utility for making some common JPA operations easier.
 *
 * @param <C> the type of the COI class
 * @param <D> the type of the DAO class
 */
public final class RepositoryUtility<C, D> {

  private final Class<D> daoClass;
  private final Function<C, D> coiToDao;
  private final Function<D, C> daoToCoi;

  private RepositoryUtility(Class<D> daoClass, Function<C, D> coiToDao, Function<D, C> daoToCoi) {
    this.daoClass = Objects.requireNonNull(daoClass);
    this.coiToDao = Objects.requireNonNull(coiToDao);
    this.daoToCoi = Objects.requireNonNull(daoToCoi);
  }

  /**
   * Create {@link RepositoryUtility}.
   *
   * @param daoClass the class of the D
   * @param coiToDao a function from the COI to the DAO, used to convert a C object into a D before
   *     persisting
   * @param daoToCoi a function from the DAO to the COI, used to convert queried results into the
   *     desired form (C).
   * @param <C> type of the COI
   * @param <D> type of the DAO
   * @return a {@link RepositoryUtility}
   */
  public static <C, D> RepositoryUtility<C, D> create(
      Class<D> daoClass, Function<C, D> coiToDao, Function<D, C> daoToCoi) {
    return new RepositoryUtility<>(daoClass, coiToDao, daoToCoi);
  }

  /**
   * Saves an object.
   *
   * @param objs the objects to persist
   */
  public void persist(Collection<C> objs, EntityManager entityManager) {
    Objects.requireNonNull(objs);
    try {
      entityManager.getTransaction().begin();
      for (C coi : objs) {
        entityManager.persist(coiToDao.apply(coi));
      }
      entityManager.getTransaction().commit();
    } catch (Exception e) {
      entityManager.getTransaction().rollback();
      throw RepositoryExceptionUtils.wrapWithContext(
          "Error committing transaction: " + e.getMessage(), e);
    }
  }
}
