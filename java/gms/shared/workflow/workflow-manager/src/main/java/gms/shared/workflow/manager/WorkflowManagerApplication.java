package gms.shared.workflow.manager;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
@EntityScan(basePackages = "gms.shared.workflow.dao")
public class WorkflowManagerApplication {

  public static void main(String[] args) {

    new SpringApplicationBuilder(WorkflowManagerApplication.class).run(args);
  }
}
