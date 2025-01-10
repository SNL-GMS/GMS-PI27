#!/usr/bin/env python3
import sys
sys.path.append('../..')
from utils.test_utils import read_file_contents
from rotation_templates import RotationTemplates
from get_default_filter_defs import GetDefaultFilterDefs
from processing_mask_definitions import ProcessingMaskDefinitions
from fk_reviewable_phases import FkReviewablePhases
from beamforming_template import BeamformingTemplate

class MultipleEndpoints:
    """
    This study aims to stress test the signal-enhancement-configuration 
    across five distinct endpoints. The test replicates the request 
    load observed during the busiest interval, characterized 
    by 636 signal detections in total. Each endpoint is subjected to 
    its largest request. The simulation involves 10 users to emulate 
    diverse connections when the flag -u 10 is provided as an argument. 
    The test conditions encompass the following:
    fk-reviewable-phases: 4 requests
    rotation-templates: 3 requests
    beamforming-template: 6 requests
    default-filter-definitions-by-usage-map: 10 requests
    processing-mask-definitions: 60 requests
    """
    def __init__(self):
        self.test_fk_reviewable_phases = FkReviewablePhases(4)
        self.test_rotation_templates = RotationTemplates(3)
        self.test_beamforming_template = BeamformingTemplate(6)
        self.test_default_filter_defs = GetDefaultFilterDefs(10)
        self.test_proc_mask_def = ProcessingMaskDefinitions(60)

    def validate_and_create_requests(self):
        try:
            self.test_fk_reviewable_phases.validation()
            self.test_rotation_templates.validation()
            self.test_beamforming_template.validation()
            self.test_default_filter_defs.validation()
            self.test_proc_mask_def.validation()
            
        except Exception as error:
            print("Error:", error)

        self.test_fk_reviewable_phases.create_request()
        self.test_rotation_templates.create_request()
        self.test_beamforming_template.create_request()
        self.test_default_filter_defs.create_request()
        self.test_proc_mask_def.create_request()   
      
if __name__ == "__main__":
    multiple_endpoints = MultipleEndpoints()
    multiple_endpoints.validate_and_create_requests()
    