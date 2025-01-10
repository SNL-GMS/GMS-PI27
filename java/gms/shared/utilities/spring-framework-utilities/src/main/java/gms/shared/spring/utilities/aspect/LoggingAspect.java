package gms.shared.spring.utilities.aspect;

import java.time.Duration;
import java.time.Instant;
import net.logstash.logback.argument.StructuredArguments;
import net.logstash.logback.marker.Markers;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Class that logs information about method parameters and execution time.
 *
 * <p>Logs at different levels based on time that wrapped method takes to execute.
 */
@Component
@Aspect
public class LoggingAspect {

  private static final int MAX_DURATION_MILLIS = 10;

  @Around(
      "execution(* gms.shared..*(..)) && "
          + "(@annotation(org.springframework.web.bind.annotation.PostMapping))")
  public Object logPostMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    logRequestBody(joinPoint);
    return LoggingAspect.logTimeMethod(joinPoint);
  }

  private static void logRequestBody(ProceedingJoinPoint joinPoint) {
    var logger = LoggerFactory.getLogger(joinPoint.getTarget().getClass());
    try {
      MethodSignature signature = (MethodSignature) joinPoint.getSignature();
      String[] parameterNames = signature.getParameterNames();
      Object[] parameterValues = joinPoint.getArgs();

      StringBuilder requestParams = createParameterList(parameterNames, parameterValues);

      var logMessage =
          String.format(
              "Entering %s -- %s",
              joinPoint.getStaticPart().getSignature().toString(), requestParams);
      logger.info(logMessage);

    } catch (Exception e) {
      logger.error(e.getMessage(), e);
    }
  }

  private static StringBuilder createParameterList(
      String[] parameterNames, Object[] parameterValues) {
    var requestParams = new StringBuilder("");
    for (var i = 0; i < parameterValues.length; i++) {
      if (!parameterNames[i].startsWith("model")
          && !parameterNames[i].startsWith("allRequestParams")
          && parameterValues[i] != null) {
        if (requestParams.length() > 0) {
          requestParams.append(";");
        }
        requestParams.append(parameterNames[i]).append(": ").append(parameterValues[i].toString());
      }
    }
    return requestParams;
  }

  public static Object logTimeMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    var logger = LoggerFactory.getLogger(joinPoint.getTarget().getClass());
    var start = Instant.now();

    Object retVal = joinPoint.proceed();
    var end = Instant.now();

    var methodPlusArgs =
        new StringBuilder().append(joinPoint.getStaticPart().getSignature().toString()).toString();
    long duration = Duration.between(start, end).toMillis();
    // we only care about methods that take > 10ms (maybe this should be higher?  20/50/100? or
    // configurable?
    if (duration > MAX_DURATION_MILLIS) {
      logger.info(
          Markers.aggregate(
              Markers.append("startTime", start.toEpochMilli()),
              Markers.append("endTime", end.toEpochMilli())),
          "{} ran in {} milliseconds",
          StructuredArguments.v("methodName", methodPlusArgs),
          StructuredArguments.v("elapsedTime", duration));
    }
    return retVal;
  }
}
