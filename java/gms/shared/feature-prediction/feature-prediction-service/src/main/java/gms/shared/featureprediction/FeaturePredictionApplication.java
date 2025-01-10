package gms.shared.featureprediction;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class FeaturePredictionApplication {

  public static void main(String[] args) {
    new SpringApplicationBuilder(FeaturePredictionApplication.class).run(args);
  }
}
