#!/usr/bin/env python3
import sys
sys.path.append('../..')
from utils.test_utils import read_file_contents
from performance.performance_test_base import PerformanceTestBase

class ProcessingMaskDefinitions(PerformanceTestBase):
    """
    Stress test the signal-enhancement-configuration/processing-mask-definitions
    The default inut file is processing-mask-definitions.json
    """
    SERVICE_ENDPOINT_URL = "/signal-enhancement-configuration-service/signal-enhancement-configuration/processing-mask-definitions"
    DEFAULT_INPUT_FILE = "processing-mask-definitions.json"
    
    def __init__(self, requests):
        self.args = self.get_args() 
        if requests != None:
            self.args.requests = requests
        print(self.args)
    
    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL
    
    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE  
        
if __name__ == "__main__":
    test = ProcessingMaskDefinitions(None)
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
    
    test.create_request()
    