import pytest
from e2e_test_base import run_e2e_test, Integration_Test_Info, BASE_URL
    
channel_groups_by_name_request = [
    Integration_Test_Info(
        'Station Definition Service - Channel Groups By Name',
        BASE_URL + '/station-definition-service/station-definition/channel-groups/query/names',
        {"channelGroupNames": ["AS01","MAW","MK31"]},
        './vetted-responses/station-definition/channel-groups-by-name.json')
]

@pytest.mark.parametrize('channel_groups_by_name_request', channel_groups_by_name_request)
def test_stations(channel_groups_by_name_request, options):
    assert run_e2e_test(channel_groups_by_name_request, options)