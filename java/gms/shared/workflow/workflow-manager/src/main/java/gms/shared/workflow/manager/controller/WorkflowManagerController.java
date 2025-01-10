package gms.shared.workflow.manager.controller;

import static com.google.common.base.Preconditions.checkArgument;
import static java.lang.String.format;

import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.system.events.SystemEvent;
import gms.shared.system.events.SystemEventPublisher;
import gms.shared.workflow.accessor.WorkflowAccessor;
import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.manager.request.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.manager.request.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.manager.request.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * WorkflowManager operations allowing for retrieval of {@link Workflow} configuration, retrieval of
 * {@link StageInterval}s, and updates of {@link StageInterval}s.
 */
@RestController("workflow-manager")
@RequestMapping(value = "/workflow-manager", produces = MediaType.APPLICATION_JSON_VALUE)
public class WorkflowManagerController {

  private static final Logger LOGGER = LoggerFactory.getLogger(WorkflowManagerController.class);
  private static final String SYSTEM_MESSAGE_EVENT_TYPE = "intervals";

  private final WorkflowAccessor workflowAccessor;
  private final SystemEventPublisher systemEventPublisher;

  @Autowired
  public WorkflowManagerController(
      @Qualifier("workflow-accessor") WorkflowAccessor workflowAccessor,
      SystemEventPublisher systemEventPublisher) {
    this.workflowAccessor = workflowAccessor;
    this.systemEventPublisher = systemEventPublisher;
  }

  /**
   * Gets the configured {@link Workflow}
   *
   * @param placeholder Placeholder text required by service framework
   * @return The configured Workflow
   */
  @PostMapping(value = "/workflow-definition")
  @Operation(summary = "Get the Workflow definition")
  public Workflow getWorkflowDefinition(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Placeholder request body due to legacy reasons. Optional.")
          @RequestBody(required = false)
          String placeholder) {
    return workflowAccessor.getWorkflow();
  }

  /**
   * Retrieves and returns {@link StageInterval}s matching the set of {@link
   * gms.shared.workflow.coi.Stage} names and time range in the provided request body.
   *
   * @param request {@link StageIntervalsByStageIdAndTimeRequest} defining request parameters
   * @return {@link Map} from Stage name to StageIntervals
   */
  @PostMapping(value = "/interval/stage/query/ids-timerange")
  @Operation(
      summary =
          "Retrieves and returns Stage Intervals matching the set of stage names and time range"
              + " in the provided request body.")
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Set of stage names and time range to retrieve")
          @RequestBody
          StageIntervalsByStageIdAndTimeRequest request) {
    return workflowAccessor.findStageIntervalsByStageIdAndTime(
        request.getStartTime(), request.getEndTime(), request.getStageIds());
  }

  /**
   * Updates the stage interval matching the provided ID with the provided status
   *
   * @param request {@link UpdateInteractiveAnalysisStageIntervalStatusRequest} defining request
   *     parameters
   */
  @PostMapping(value = "/interval/stage/interactive-analysis/update")
  @Operation(
      summary = "Updates the stage interval matching the provided ID with the provided status.")
  public void updateInteractiveAnalysisStageIntervalStatus(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Stage interval ID and status to update")
          @RequestBody
          UpdateInteractiveAnalysisStageIntervalStatusRequest request) {
    LOGGER.debug(
        "Handling InteractiveAnalysisStage update for stage {} with status {}",
        request.getStageIntervalId().getDefinitionId().getName(),
        request.getStatus());

    var updatedInterval =
        workflowAccessor.updateIfPresent(
            request.getStageIntervalId(),
            stageInterval ->
                updateStageStatus(
                        castToInteractiveOrThrow(stageInterval),
                        request.getStatus(),
                        request.getUserName())
                    .map(StageInterval.class::cast));

    updatedInterval.ifPresent(
        (StageInterval interval) -> {
          var updatedStageIntervalList = List.of(interval);
          var systemEvent =
              SystemEvent.from(SYSTEM_MESSAGE_EVENT_TYPE, updatedStageIntervalList, 0);
          LOGGER.debug("Sending {} Stage SystemEvent(s) updates", updatedStageIntervalList.size());
          systemEventPublisher.sendSystemEvent(systemEvent);
        });
  }

  private static Optional<InteractiveAnalysisStageInterval> updateStageStatus(
      InteractiveAnalysisStageInterval interactiveStageInterval,
      IntervalStatus status,
      String analyst) {
    var interactiveAnalysisStageIntervals = List.of(interactiveStageInterval);
    var modTime = Instant.now();

    List<InteractiveAnalysisStageInterval> updatedStageIntervals =
        switch (status) {
          case IN_PROGRESS -> IntervalUtility.openInteractiveStageIntervals(
              interactiveAnalysisStageIntervals, analyst);
          case NOT_COMPLETE -> IntervalUtility.closeInteractiveStageIntervals(
              interactiveAnalysisStageIntervals, analyst);
          case COMPLETE -> IntervalUtility.completeInteractiveStageIntervals(
              interactiveAnalysisStageIntervals);
          default -> throw new InvalidInputException(
              format(
                  "Attempting to update analysis stage interval to invalid status {%s}", status));
        };

    return updateModTime(interactiveStageInterval, updatedStageIntervals.get(0), modTime);
  }

  /**
   * Updates the activity interval whose metadata matches the provided activity ID and stage ID with
   * the provided status
   *
   * @param request {@link UpdateActivityIntervalStatusRequest} defining request parameters
   */
  @PostMapping(value = "/interval/activity/update")
  @Operation(
      summary =
          "Updates the activity interval whose metadata matches the provided activity ID and stage"
              + " ID with the provided status.")
  public void updateActivityIntervalStatus(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Activity interval ID, stage interval ID and status to update")
          @RequestBody
          UpdateActivityIntervalStatusRequest request) {

    LOGGER.debug(
        "Handling ActivityIntervalStatus update for activity {} with status {}",
        request.getActivityIntervalId(),
        request.getStatus());

    var updatedIntervalOpt =
        workflowAccessor.updateIfPresent(
            request.getStageIntervalId(),
            stageInterval ->
                updateActivityStatus(
                        castToInteractiveOrThrow(stageInterval),
                        request.getActivityIntervalId(),
                        request.getStatus(),
                        request.getUserName())
                    .map(StageInterval.class::cast));

    updatedIntervalOpt.ifPresent(
        (StageInterval stageInterval) -> {
          var wrappedStageInterval = List.of(stageInterval);
          var systemEvent = SystemEvent.from(SYSTEM_MESSAGE_EVENT_TYPE, wrappedStageInterval, 0);
          LOGGER.debug("Sending {} Stage SystemEvent(s) updates", wrappedStageInterval.size());
          systemEventPublisher.sendSystemEvent(systemEvent);
        });
  }

  private static InteractiveAnalysisStageInterval castToInteractiveOrThrow(
      StageInterval stageInterval) {
    if (!(stageInterval instanceof InteractiveAnalysisStageInterval)) {
      throw new InvalidInputException(
          format(
              "The requested StageInterval for Id {%s} was an AutomaticProcessingStageInterval",
              stageInterval.getIntervalId()));
    }

    return (InteractiveAnalysisStageInterval) stageInterval;
  }

  private static Optional<InteractiveAnalysisStageInterval> updateActivityStatus(
      InteractiveAnalysisStageInterval interactiveStageInterval,
      IntervalId activityIntervalId,
      IntervalStatus intervalStatus,
      String analyst) {
    var modTime = Instant.now();

    InteractiveAnalysisStageInterval updatedStageInterval =
        switch (intervalStatus) {
          case IN_PROGRESS -> IntervalUtility.openActivityInterval(
              interactiveStageInterval, activityIntervalId, analyst);
          case NOT_COMPLETE -> IntervalUtility.closeActivityInterval(
              interactiveStageInterval, activityIntervalId, analyst);
          case COMPLETE -> IntervalUtility.completeActivityInterval(
              interactiveStageInterval, activityIntervalId, analyst);
          default -> throw new InvalidInputException(
              format("Attempting to update activity interval to status {%s}", intervalStatus));
        };

    return updateModTime(interactiveStageInterval, updatedStageInterval, modTime);
  }

  private static Optional<InteractiveAnalysisStageInterval> updateModTime(
      InteractiveAnalysisStageInterval originalStageInterval,
      InteractiveAnalysisStageInterval updatedStageInterval,
      Instant modTime) {

    checkArgument(
        originalStageInterval.getActivityIntervals().size()
            == updatedStageInterval.getActivityIntervals().size(),
        "The originalStageInterval and the updatedStageInterval do not have the same number of"
            + " activities!");

    var originalActivitiesIterator = originalStageInterval.activityIntervals().iterator();
    var updatedActivitiesIterator = updatedStageInterval.activityIntervals().iterator();

    var updatedActivityIntervals = new ArrayList<ActivityInterval>();
    // check if the originalStage status got updated
    var stageIntervalUpdated =
        originalStageInterval.getStatus() != updatedStageInterval.getStatus();

    var activitiesUpdated = false;
    while (originalActivitiesIterator.hasNext() && updatedActivitiesIterator.hasNext()) {
      var activityInterval = originalActivitiesIterator.next();
      var updatedActivity = updatedActivitiesIterator.next();

      if (!activityInterval.equals(updatedActivity)) {
        activitiesUpdated = true;
        updatedActivity = updatedActivity.toBuilder().setModificationTime(modTime).build();
      }

      updatedActivityIntervals.add(updatedActivity);
    }

    if (activitiesUpdated || stageIntervalUpdated) {
      return Optional.of(
          updatedStageInterval.toBuilder()
              .setModificationTime(modTime)
              .setActivityIntervals(updatedActivityIntervals)
              .build());
    } else {
      return Optional.empty();
    }
  }
}
