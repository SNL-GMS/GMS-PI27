#!/usr/bin/env python3
import sys
sys.path.append('../..')
from utils.test_utils import read_file_contents
from performance.performance_test_base import PerformanceTestBase

class EventRelocationPredictorDefinitionsByPhase(PerformanceTestBase):
    """
    Stress test the relocation/event-relocation-predictor-definition-by-phasetype
    The default input file is event_relocation_predictor_definitions_by_phase.json
    """
    SERVICE_ENDPOINT_URL = "/event-relocation-service/relocation/event-relocation-predictor-definition-by-phasetype"
    DEFAULT_INPUT_FILE = "event_relocation_predictor_definitions_by_phase.json"
    
    def __init__(self):
        self.args = self.get_args()    
        print(self.args)
    
    def custom_args(self, parser):
        """
        Custom cmd line arg for defining the number of phases per request
        """
        parser.add_argument(
            '--phases',
            '-p',
            help="Number of phases to use per request.  If this is less than the total number of phases in the request, multiple parallel requests will be made."
        )

    def rewrite_request_body(self, request_body, iter_num):
        """
        chunks the phase array into parts based on the cmd-line parameter -p or --phases
        This is a recursive call that will iterate through all the phases at the size defined by -p
        """
        total_elements = num_phases = len(request_body)
        if(self.args.phases):
            num_phases = int(self.args.phases)
            
        start_index = iter_num*num_phases
        
        rewritten_request_body = request_body[start_index:start_index+num_phases]        
        
        #recurse through all phases in the request, chunking each request into num_phases sub-requests
        if(start_index+num_phases < total_elements):
            self.make_request(request_body, iter_num+1)
        return rewritten_request_body

    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL
    
    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE  
        
if __name__ == "__main__":
    test = EventRelocationPredictorDefinitionsByPhase()
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
    
    test.create_request()
    
