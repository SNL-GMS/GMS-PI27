package gms.shared.waveform.testfixture;

import com.google.common.collect.Range;
import java.time.Instant;

public record WfdiscCreationVariables(
    Range<Instant> range, String fileName, Integer numSamples, Long fOff) {}
