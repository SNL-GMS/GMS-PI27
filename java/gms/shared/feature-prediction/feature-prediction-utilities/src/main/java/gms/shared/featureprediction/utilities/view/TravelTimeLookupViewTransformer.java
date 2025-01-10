package gms.shared.featureprediction.utilities.view;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.utilities.filestore.FileTransformer;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.IOException;
import java.io.InputStream;

/**
 * A class to transform a JSON file representing a travel time lookup table to a
 * TravelTimeLookupView.
 */
public class TravelTimeLookupViewTransformer implements FileTransformer<TravelTimeLookupView> {

  private static final ObjectReader jsonReader = ObjectMappers.jsonReader();

  @JsonUnwrapped TravelTimeLookupView decodedTable = null;

  @Override
  public TravelTimeLookupView transform(InputStream rawDataStream) throws IOException {

    decodedTable = jsonReader.readValue(rawDataStream, TravelTimeLookupView.class);

    return decodedTable;
  }
}
