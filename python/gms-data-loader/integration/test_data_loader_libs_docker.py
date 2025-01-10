import os
import unittest

from gmsdataloader.processingconfig import ProcessingConfigLoader
from gmsdataloader.userpreferences import (
    UserPreferencesLoader,
    UserPreferencesLoaderConfig
)
from testcontainers.compose import DockerCompose

WORKING_DIR = os.path.dirname(__file__)
RESOURCES_DIR = f'{WORKING_DIR}/resources'
ALIVE = '/alive'


class TestOsdDataLoadDocker(unittest.TestCase):
    compose = None

    @classmethod
    def setUpClass(cls):
        cls.compose = DockerCompose(
            f'{RESOURCES_DIR}/docker',
            compose_file_name='docker-compose.yml'
        )
        cls.compose.start()
        port = cls.compose.get_service_port(
            "frameworks-configuration-service",
            8080
        )
        cls.config_service_url = f"http://localhost:{port}"

    @classmethod
    def tearDownClass(cls):
        cls.compose.stop()

    def test_post_user_prefs_docker(self):
        user_prefs_loader = UserPreferencesLoader(
            UserPreferencesLoaderConfig(
                self.osd_url,
                f'{RESOURCES_DIR}/config/test_userprefs_config.ini'
            )
        )

        self.compose.wait_for(self.osd_url.replace('/osd', ALIVE))
        user_prefs_loader.load_user_preferences(
            f'{RESOURCES_DIR}/json/defaultUserPreferences/'
            'user_preferences.json'
        )

    def test_post_processing_config_data(self):
        loader = ProcessingConfigLoader(
            url=self.config_service_url,
            processing_config_root=f'{WORKING_DIR}/resources/config/processing'
        )
        self.compose.wait_for(self.config_service_url + ALIVE)
        loaded = loader.load()
        self.assertTrue(loaded)

    def test_post_processing_config_data_mixed_format(self):
        loader = ProcessingConfigLoader(
            url=self.config_service_url,
            processing_config_root=f'{WORKING_DIR}/resources/config/'
            'processing_mixed_format'
        )
        self.compose.wait_for(self.config_service_url + ALIVE)
        loaded = loader.load()
        self.assertTrue(loaded)


if __name__ == '__main__':
    unittest.main()
