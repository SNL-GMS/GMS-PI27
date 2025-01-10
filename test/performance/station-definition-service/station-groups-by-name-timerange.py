#!/usr/bin/env python3
from random import randint
import copy
import sys

sys.path.append('../..')
from performance.performance_test_base import PerformanceTestBase


class StationGroupsByNameAndTimeRange(PerformanceTestBase):
    """
    Stress test the /station-definition-service/station-definition/station-groups/query/names-timerange endpoint
    The default input file is station-groups-time-range.json
    """
    SERVICE_ENDPOINT_URL = "/station-definition-service/station-definition/station-groups/query/names-timerange"
    DEFAULT_INPUT_FILE = "station-groups-time-range.json"

    STATION_GROUPS = ["ALL_2", "CD1.1", "GSE", "IMS_Sta", "SEISMIC"]

    ON_THE_HOUR_TIMES = ["2019-01-05T16:00:00Z",
                         "2019-01-05T17:00:00Z",
                         "2019-01-05T18:00:00Z",
                         "2019-01-05T19:00:00Z",
                         "2019-01-05T20:00:00Z",
                         "2019-01-05T21:00:00Z",
                         "2019-01-05T22:00:00Z"]
    MIN_STATION_GROUPS = 1
    MAX_STATION_GROUPS = 5
    STATION_GROUP_NAMES = 'stationGroupNames'
    START_TIME_ATTRIBUTE = 'startTime'
    END_TIME_ATTRIBUTE = 'endTime'

    def __init__(self):
        self.args = self.get_args()
        print(self.args)
        self.number_of_station_groups = len(StationGroupsByNameAndTimeRange.STATION_GROUPS)
        self.number_of_times = len(StationGroupsByNameAndTimeRange.ON_THE_HOUR_TIMES)

    def rewrite_request_body(self, request_body, iter_num):
        """
        Generate a request body by adding a random set of station groups, and random
        start and end times that occur on the hour within the time range of data
        (2019-01-05T16:00:00Z to 2019-01-05T22:00:00Z)
        and whose duration is one hour.
        """
        rewritten_request_body = copy.deepcopy(request_body)

        # Add station groups to request
        rewritten_request_body[StationGroupsByNameAndTimeRange.STATION_GROUP_NAMES] = \
            [stationGroup for stationGroup in [StationGroupsByNameAndTimeRange.STATION_GROUPS[randint(0, self.number_of_station_groups-1)]
              for _ in range(randint(StationGroupsByNameAndTimeRange.MIN_STATION_GROUPS,
                                     StationGroupsByNameAndTimeRange.MAX_STATION_GROUPS))]]

        # Add time range to request
        start_time_index = randint(0, self.number_of_times-2)
        rewritten_request_body[StationGroupsByNameAndTimeRange.START_TIME_ATTRIBUTE] = \
            StationGroupsByNameAndTimeRange.ON_THE_HOUR_TIMES[start_time_index]
        rewritten_request_body[StationGroupsByNameAndTimeRange.END_TIME_ATTRIBUTE] = \
            StationGroupsByNameAndTimeRange.ON_THE_HOUR_TIMES[start_time_index+1]

        return rewritten_request_body

    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL

    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE


if __name__ == "__main__":
    test = StationGroupsByNameAndTimeRange()
    try:
        test.validation()
    except Exception as error:
        print("Error:", error)

    test.create_request()
