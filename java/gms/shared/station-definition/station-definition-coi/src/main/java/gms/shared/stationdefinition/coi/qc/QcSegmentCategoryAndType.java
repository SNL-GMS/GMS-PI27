package gms.shared.stationdefinition.coi.qc;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.util.Optional;
import org.apache.commons.lang3.Validate;

@AutoValue
public abstract class QcSegmentCategoryAndType {

  public abstract QcSegmentCategory getCategory();

  @JsonInclude(Include.NON_EMPTY)
  public abstract Optional<QcSegmentType> getType();

  @JsonCreator
  public static QcSegmentCategoryAndType create(
      @JsonProperty("category") QcSegmentCategory category,
      @JsonProperty("type") QcSegmentType type) {

    var qcSegmentTypeOptional = Optional.ofNullable(type);

    qcSegmentTypeOptional.ifPresentOrElse(
        myType ->
            Validate.isTrue(
                category.getAllowableTypes().contains(myType),
                "QcSegmentCategoryAndType: %s is not allowed for category %s",
                myType,
                category),
        () ->
            Validate.isTrue(
                category.allowEmptyType(),
                "QcSegmentCategoryAndType: no type specified, but %s requires a type",
                category));

    return new AutoValue_QcSegmentCategoryAndType(category, qcSegmentTypeOptional);
  }

  public static QcSegmentCategoryAndType create(QcSegmentCategory category) {
    return create(category, null);
  }
}
