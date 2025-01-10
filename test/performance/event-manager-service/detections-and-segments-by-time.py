#!/usr/bin/env python3
import sys

sys.path.append('../..')
from performance.performance_test_base import PerformanceTestBase


class FindEventsWithDetectionsAndSegmentsByTime(PerformanceTestBase):
    """
    Stress test the event-manager-service/event/detections-and-segments/time endpoint
    """
    SERVICE_ENDPOINT_URL = "/event-manager-service/event/detections-and-segments/time"
    # IMPORTANT NOTE: The startTime and endTime may need modification to be compatible with the tested deployment
    DEFAULT_INPUT_FILE = "detections-and-segments-by-time.json"

    def __init__(self):
        self.args = self.get_args()
        print(self.args)

    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL

    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE


if __name__ == "__main__":
    test = FindEventsWithDetectionsAndSegmentsByTime()
    try:
        test.validation()
    except Exception as error:
        print("Error:", error)

    test.create_request()
