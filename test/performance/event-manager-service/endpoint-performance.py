#!/usr/bin/env python3
from random import randint
import sys

sys.path.append('../..')
from performance.performance_test_base import PerformanceTestBase
from utils.test_utils import read_file_contents


class EventManagerPerformance(PerformanceTestBase):
    """
    Stress test the /event-manager-service/event/associated-signal-detection-hypotheses endpoint
    """
    # This file's content is taken from Chrome develop tools (Network tab) while opening an interval using IAN.
    # It's the request body sent by the UI for this endpoint.
    DEFAULT_INPUT_FILE = "signal-detection-hypotheses.json"

    SERVICE_ENDPOINT_URLS = ["/event-manager-service/event/associated-signal-detection-hypotheses",
                             "/event-manager-service/event/detections-and-segments/time",
                             "/event-manager-service/event/predict-for-event-location"]
    # The following files contain endpoint request bodies associated with common UI requests.
    REQUESTS_DIRECTORY = './requests/'
    # This request body is an example UI request captured using Chrome developer tools
    ASSOCIATED_SIGNAL_DETECTION_HYPOTHESES_REQUEST_BODY_FILE = "signal-detection-hypotheses.json"
    # A know request with a large / time consuming response.
    DETECTIONS_AND_SEGMENTS_BY_TIME_REQUEST_BODY_FILE = "detections-and-segments-by-time.json"
    # This request body is an example UI request captured using Chrome developer tools
    PREDICT_FOR_EVENT_LOCATION_REQUEST_BODY_FILE = "predict-for-event-location.json"

    def __init__(self):
        self.args = self.get_args()
        print(self.args)
        self.request_bodies = []
        self.request_index = None
        self.load_request_bodies()

    def load_request_bodies(self):
        """
        Read request body files for building endpoint requests.
        These requests are the most frequent Event Manager Service requests issues by the UI
        """
        self.request_bodies.append(
            read_file_contents(EventManagerPerformance.REQUESTS_DIRECTORY +
                               EventManagerPerformance.ASSOCIATED_SIGNAL_DETECTION_HYPOTHESES_REQUEST_BODY_FILE))
        self.request_bodies.append(
            read_file_contents(EventManagerPerformance.REQUESTS_DIRECTORY +
                               EventManagerPerformance.DETECTIONS_AND_SEGMENTS_BY_TIME_REQUEST_BODY_FILE))
        self.request_bodies.append(
            read_file_contents(EventManagerPerformance.REQUESTS_DIRECTORY +
                               EventManagerPerformance.PREDICT_FOR_EVENT_LOCATION_REQUEST_BODY_FILE))

    def rewrite_request_body(self, request_body, iter_num):
        """
        Choose a request body at random from among the most common UI endpoint requests to the event manager.
        Each of three possible request bodies have an equal change of being selected.  When using the -r option,
        each parallel request will be randomly selected from these requests.
        """
        if iter_num < len(self.request_bodies) - 1:
            self.make_request(self.request_bodies[iter_num+1], iter_num+1)
        self.request_index = iter_num
        return request_body

    def get_service_endpoint_url(self):
        print("Service Endpoint URL: " + EventManagerPerformance.SERVICE_ENDPOINT_URLS[self.request_index])
        return EventManagerPerformance.SERVICE_ENDPOINT_URLS[self.request_index]

    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE


if __name__ == "__main__":
    test = EventManagerPerformance()
    try:
        test.validation()
    except Exception as error:
        print("Error:", error)

    test.create_request()
