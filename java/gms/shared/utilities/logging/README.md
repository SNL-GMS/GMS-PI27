# Utility which provides Structured Logging and the Timing Logger

## Structured Logger
 Wrapper for logback-based loggers to transparently insert structured arguments into logging statements

## Timing Logger
Wrapper to add timing to method calls.  These methods are not logged by default.  The `timing` profile must be active.
- To activate the timing profile:\
`
gmskube install --tag develop --set event-manager-service.env.SPRING_PROFILES_ACTIVE=timing --type ian <deployment>
`

To use the TimingLogger, a TimingLogger<T> must be defined with <T> being the return type of the method being timed
```
private static final TimingLogger<Set<Event>> eventLogger = TimingLogger.create(LOGGER);
```
A Supplier can then be passed to the eventLogger as a parameter, and if the `timing` profile is set, the method runtime will be logged
```
var events =
        eventLogger.apply(
            this.getClass().getSimpleName() + "::findByTime",
            () -> eventRepository.findByTime(startTime, endTime, stageId),
            environment.getActiveProfiles());
```
Having the class name defined by `this.getClass().getSimpleName()` is not required but allows us to search Kibana for methods with that tag