#!/usr/bin/env python3
import sys
import os
sys.path.append('../..')
from utils.environment_utils import validate_environment, get_ingress_domain_url
from utils.test_utils import read_file_contents
from performance.performance_test_base import PerformanceTestBase

class FkReviewablePhases(PerformanceTestBase):
    """
    Stress test the signal-enhancement-configuration/fk-reviewable-phases
    The default inut file is fk_reviewable_phases.json
    """
    SERVICE_ENDPOINT_URL = "/signal-enhancement-configuration-service/signal-enhancement-configuration/fk-reviewable-phases"
    DEFAULT_INPUT_FILE = "fk_reviewable_phases.json"
    
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
    test = FkReviewablePhases(None)
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
    
    test.create_request()
    