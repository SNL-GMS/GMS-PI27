package gms.shared.fk.pluginregistry.fixtures;

import com.google.auto.service.AutoService;
import gms.shared.fk.pluginregistry.Plugin;

@AutoService(Plugin.class)
public class BarImplTwo implements IBar {
  public static final String NAME = "bar_impl_2";

  public static final long VALUE = 2;

  public BarImplTwo() {}

  @Override
  public long getBarValue() {
    return VALUE;
  }

  @Override
  public String getName() {
    return NAME;
  }
}
