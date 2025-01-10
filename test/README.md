# GMS Test Utilities
The contents of this directory are as follows:
* [`bin`](./bin):  Test scripts written in bash or Python.  To run these
  scripts, you must have the `gms` test [Python
  environment](../python/README.md) installed and activated on your local
  machine.
* [`config`](./config):  Test processing configurations used in various system
  test procedures.
* [`integration`](./integration):  Test scripts used for validating GMS endpoints 
against veted responses.
* [`oracle`](./oracle):  Test scripts used for testing and validating the
  Oracle configuration.
* [`performance`](./performance):  Test scripts used for load and stress testing 
the GMS endpoints.
* [`utils`](./utils):  Utility methods shared across various python modules.

## GMS System Test Framework
The ``python/gms_system_test/gms_system_test/gms_system_test.py`` script is the
entry point to the GMS system test framework.  See
[here](../python/gms_system_test) for more details.
