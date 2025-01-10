package gms.shared.spring.persistence;

import com.mchange.v2.c3p0.DataSources;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.stereotype.Component;

/**
 * Small Factory Component to help create DataSources for Oracle connections. This factory makes the
 * assumption that the account is accessible via oracle wallet, and thus requires no credentials.
 */
@Component
public class OracleDataSourceFactory {

  public DataSource getDataSource(String account) {
    try {
      var unpooledDataSource = DataSources.unpooledDataSource(toUrl(account));

      return DataSources.pooledDataSource(unpooledDataSource);
    } catch (SQLException e) {
      throw new IllegalStateException(e);
    }
  }

  private static String toUrl(String alias) {
    return "jdbc:oracle:thin:/@".concat(alias);
  }
}
