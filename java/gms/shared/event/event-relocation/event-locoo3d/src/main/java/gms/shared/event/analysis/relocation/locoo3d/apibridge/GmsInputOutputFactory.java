package gms.shared.event.analysis.relocation.locoo3d.apibridge;

import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.locoo3d.io.LocOO_IO;
import gov.sandia.gmp.locoo3d.io.NativeInput;
import gov.sandia.gmp.locoo3d.io.NativeOutput;
import java.util.Locale;

public final class GmsInputOutputFactory extends LocOO_IO {

  public GmsInputOutputFactory(PropertiesPlusGMP properties) throws Exception {
    super();
    dataInput = createInput(properties);
    dataOutput = createOutput(properties, dataInput);
  }

  /**
   * Factory method to return a concrete DataInput based on the properties file setting
   * "dataLoaderType". Current valid types include "file", "database", and "application". "oracle"
   * can be specified in place of "database".
   *
   * @param properties Input LocOO3D Properties object.
   * @return The new concrete DataLoader.
   * @throws Exception
   */
  @Override
  protected NativeInput createInput(PropertiesPlusGMP properties) throws Exception {

    /** One of file, database, application */
    String type = properties.getProperty("dataLoaderInputType", "").toLowerCase(Locale.ENGLISH);

    /** format is one of gms, kb, gmp, native */
    String format = properties.getProperty("dataLoaderInputFormat", "").toLowerCase(Locale.ENGLISH);

    // TODO: This class should probably be made to *ONLY* return GmsInput
    if ("gms".equals(format) && "application".equals(type)) {
      return new GmsInput(properties);
    }

    return super.createInput(properties);
  }

  /**
   * Factory method to instantiate a NativeOutput data object based on the properties file settings
   * "dataLoaderOutputType" and "dataLoaderOutputFormat". Current valid types are 'file',
   * 'database', and 'application'. Current valid formats are 'gms', 'kb', 'gmp', and 'native'.
   *
   * @param properties LocOo3d Properties object with
   * @param dataInput the NativeInput data object used to perform the relocation; some information
   *     is copied from it directly to the NativeOutput object
   * @return a NativeOutput object of the correct type
   * @throws Exception if there is an issue with the superclass createOutput
   */
  @Override
  protected NativeOutput createOutput(PropertiesPlusGMP properties, NativeInput dataInput)
      throws Exception {
    /** One of file, database, application */
    String type = properties.getProperty("dataLoaderOutputType", "").toLowerCase(Locale.ENGLISH);

    /** format is one of gms, kb, gmp, native */
    String format =
        properties.getProperty("dataLoaderOutputFormat", "").toLowerCase(Locale.ENGLISH);

    if ("gms".equals(format) && "application".equals(type)) {
      return new GmsOutput(properties, dataInput);
    }

    return super.createOutput(properties, dataInput);
  }
}
