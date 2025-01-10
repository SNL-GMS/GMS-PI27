#!/usr/bin/env python3
import sys
sys.path.append('../..')
import copy
from utils.environment_utils import validate_environment, get_ingress_domain_url
from utils.test_utils import read_file_contents
from performance.performance_test_base import PerformanceTestBase

class GetDefaultFilterDefs(PerformanceTestBase):
    """
    Stress test the signal-enhancement-configuration/default-filter-definitions-by-usage-map endpoint
    The default inut file is channel_phase_request_2500x146.json
    As the input file is quite large, the request is chunked up into smaller subrequests defined by the -c (--channels) cmd line parameter
    For example, if the input file has 500 channels and the -c param is 10, 5 requests will be made
    If the input file has 55 channels, then 6 requests will be made, 5 with 10 channels and the last with the remaining 5.
    """
    SERVICE_ENDPOINT_URL = "/signal-enhancement-configuration-service/signal-enhancement-configuration/default-filter-definitions-by-usage-map"
    DEFAULT_INPUT_FILE = "channel_phase_request_100x20.json"
    
    def __init__(self, requests):
        self.args = self.get_args()  
        if requests != None:
            self.args.requests = requests
        print(self.args)
          
    def rewrite_request_body(self, request_body, iter_num):
        """
        chuncks the channels array into parts based on the cmd-line parameter -c or -channels
        This is a recursive call that will iterate through all the channels at the size defined by -c
        """
        total_elements = num_channels = len(request_body['channels'])
        if(self.args.channels):
            num_channels = int(self.args.channels)
            
        start_index = iter_num*num_channels
        
        rewritten_request_body = copy.deepcopy(request_body)        
        rewritten_request_body['channels'] = request_body['channels'][start_index:start_index+num_channels]
        
        #recurse through all channels in the request, chunking each request into num_channels sub_requests
        if(start_index+num_channels < total_elements):
            self.make_request(request_body, iter_num+1)
        return rewritten_request_body
        
    def custom_args(self, parser):
        """
        Custom cmd line arg for defining the number of channels per request
        """
        parser.add_argument(
            '--channels',
            '-c',
            help="Number of channels to use.  If this is less than the total number of elements in the array, multiple parallel requests will be made."
        )
    
    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL
        
    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE  
    
if __name__ == "__main__":
    test = GetDefaultFilterDefs(None)
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
    
    test.create_request()
    