#!/usr/bin/env python3
 
import pytest
from e2e_test_base import run_e2e_test, Integration_Test_Info, BASE_URL

station_groups_by_name_request = [
    Integration_Test_Info(
        'Station Definition Service - Station Groups By Name',
        BASE_URL + '/station-definition-service/station-definition/station-groups/query/names',
        {"stationGroupNames": ["ALL_IMS"]},
        './vetted-responses/station-definition/station-groups-by-name.json')
]

@pytest.mark.parametrize('station_groups_by_name_request', station_groups_by_name_request)
def test_station_groups(station_groups_by_name_request, options):
    assert run_e2e_test(station_groups_by_name_request, options)
