package gms.shared.stationdefinition.coi.qc;

import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import java.util.Arrays;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class QcMaskTypeTest {
  @Test
  void testUnprocessedType() {
    Assertions.assertEquals(0L, QcMaskType.UNPROCESSED.getId());
  }

  @Test
  void testNoEmptyIds() {
    Assertions.assertTrue(
        Arrays.stream(QcMaskType.values())
            .map(QcMaskType::getId)
            .allMatch(id -> id.getClass().equals(Long.class)));
  }

  @Test
  void testUniqueIds() {
    final long numUniqueIds =
        Arrays.stream(QcMaskType.values()).map(QcMaskType::getId).distinct().count();

    Assertions.assertEquals(QcMaskType.values().length, numUniqueIds);
  }

  @Test
  void testFromId() {
    Assertions.assertTrue(
        Arrays.stream(QcMaskType.values())
            .map(val -> Pair.of(val.getId(), val))
            .allMatch(pair -> pair.getRight().equals(QcMaskType.fromId(pair.getLeft()))));
  }
}
