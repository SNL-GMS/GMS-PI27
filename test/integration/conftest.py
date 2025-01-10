from pytest import fixture
 
def pytest_addoption(parser):
    parser.addoption(
        '--name',
        action='store',
        help='Name of the deployment (required).'
    )

@fixture()
def options(request):
    return request.config.option
