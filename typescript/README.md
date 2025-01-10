# GMS TypeScript Code

> **TODO:**  INSERT DETAILS FITTING FOR A README IN THIS LOCATION.

## GMS Test Container Images
[The GMS system test framework](../python/utils/gms_system_test) works by
applying a container to a running instance of the GMS system, and that
container then runs the testing against the instance.  Such container images
require a `Makefile.test-name` and `Dockerfile.test-name` in this directory,
along with a script to run the testing in the package directory.  For instance,
for the `jest-tests`, we have:

* [`Makefile.jest-tests`](./Makefile.jest-tests)
* [`Dockerfile.jest-tests`](./Dockerfile.jest-tests)
* [`user-interface/packages/integration-tests/run-jest-tests`](./user-interface/packages/integration-tests/run-jest-tests)

When creating your own test augmentation container, see the `jest-tests`
files above for reference.  Certain commands must be executed before and after
a test, and these are captured in the
[`pre-test`](./test-augmentation-scripts/pre-test) and
[`post-test`](./test-augmentation-scripts/post-test) scripts.
