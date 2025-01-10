package gms.shared.fk.pluginregistry.fixtures;

import com.google.auto.service.AutoService;
import gms.shared.fk.pluginregistry.Plugin;

@AutoService(Plugin.class)
public class FooImplOne implements IFoo {

  public static final String NAME = "foo_impl_1";

  public static final long VALUE = 3;

  public FooImplOne() {}

  @Override
  public long getFooValue() {
    return VALUE;
  }

  @Override
  public String getName() {
    return NAME;
  }
}
