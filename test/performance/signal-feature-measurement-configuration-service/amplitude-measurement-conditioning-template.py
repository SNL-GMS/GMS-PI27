#!/usr/bin/env python3
import sys
sys.path.append('../..')
import copy
from utils.environment_utils import validate_environment, get_ingress_domain_url
from utils.test_utils import read_file_contents
from performance.performance_test_base import PerformanceTestBase

class AmplitudeMeasurementConditioningTemplate(PerformanceTestBase):
    """
    Stress test the "signal-feature-measurement-configuration/amplitude-measurement-conditioning-template
    The default inut file is amplitude-measurement-conditioning-template335x10.json
    As the input file is quite large, the request is chunked up into smaller subrequests defined by the -s (--stations) cmd line parameter
    For example, if the input file has 500 stations and the -s param is 10, 5 requests will be made
    If the input file has 55 stations, then 6 requests will be made, 5 with 10 stations and the last with the remaining 5.
    """
    SERVICE_ENDPOINT_URL = "/signal-feature-measurement-configuration-service/signal-feature-measurement-configuration/amplitude-measurement-conditioning-template"
    DEFAULT_INPUT_FILE = "amplitude-measurement-conditioning-template335x11.json"
    
    def __init__(self):
        self.args = self.get_args()    
        print(self.args)
          
    def rewrite_request_body(self, request_body, iter_num):
        """
        chuncks the stations array into parts based on the cmd-line parameter -s or -stations
        This is a recursive call that will iterate through all the stations at the size defined by -s
        """
        total_elements = num_stations = len(request_body['stations'])
        if(self.args.stations):
            num_stations = int(self.args.stations)
            
        start_index = iter_num*num_stations
        
        rewritten_request_body = copy.deepcopy(request_body)        
        rewritten_request_body['stations'] = request_body['stations'][start_index:start_index+num_stations]
        
        #recurse through all stations in the request, chunking each request into num_stations sub_requests
        if(start_index+num_stations < total_elements):
            self.make_request(request_body, iter_num+1)
        return rewritten_request_body
        
    def custom_args(self, parser):
        """
        Custom cmd line arg for defining the number of stations per request
        """
        parser.add_argument(
            '--stations',
            '-s',
            help="Number of stations to use.  If this is less than the total number of elements in the array, multiple parallel requests will be made."
        )
    
    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL
        
    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE  
    
if __name__ == "__main__":
    test = AmplitudeMeasurementConditioningTemplate()
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
    
    test.create_request()
    
