package gms.shared.metrics;

import java.lang.management.ManagementFactory;
import javax.management.JMException;
import javax.management.MBeanServer;
import javax.management.ObjectName;

public final class MetricRegister {
  private static MBeanServer mBeanServer = ManagementFactory.getPlatformMBeanServer();

  private MetricRegister() {
    // Hide implicit public constructor since this is a utility class
  }

  public static void register(CustomMetric customMetric, ObjectName name) throws JMException {
    mBeanServer.registerMBean(customMetric, name);
  }
}
