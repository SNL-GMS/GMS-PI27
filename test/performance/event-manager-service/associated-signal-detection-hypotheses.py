#!/usr/bin/env python3
import sys

sys.path.append('../..')
from performance.performance_test_base import PerformanceTestBase


class FindEventsByAssociatedSignalDetectionHypotheses(PerformanceTestBase):
    """
    Stress test the /event-manager-service/event/associated-signal-detection-hypotheses endpoint
    """
    SERVICE_ENDPOINT_URL = "/event-manager-service/event/associated-signal-detection-hypotheses"
    # This file's content is taken from Chrome develop tools (Network tab) while opening an interval using IAN.
    # It's the request body sent by the UI for this endpoint.
    DEFAULT_INPUT_FILE = "signal-detection-hypotheses.json"

    def __init__(self):
        self.args = self.get_args()
        print(self.args)

    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL

    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE


if __name__ == "__main__":
    test = FindEventsByAssociatedSignalDetectionHypotheses()
    try:
        test.validation()
    except Exception as error:
        print("Error:", error)

    test.create_request()
