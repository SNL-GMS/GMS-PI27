import os
import unittest
from unittest.mock import call, patch

from gmsdataloader.dispersion import DispersionMinioConfig, DispersionLoader

WORKING_DIR = os.path.dirname(__file__)


class DispersionLoaderTest(unittest.TestCase):
    def test_load(self):
        with patch('minio.Minio') as client_mocker:
            mock_client = client_mocker.return_value
            mock_client.bucket_exists.return_value = False
            config = DispersionMinioConfig(
                'http://non-existent-minio-service',
                'testbucket',
                minio_client=mock_client
            )
            loader = DispersionLoader(f'{WORKING_DIR}/resources', config)

            loader.load()
            mock_client.bucket_exists.assert_called_once_with('testbucket')
            mock_client.make_bucket.assert_called_once_with('testbucket')
            mock_client.set_bucket_policy.assert_called_once()
            mock_client.fput_object.assert_has_calls(
                [
                    call(
                        'testbucket',
                        'model1/LR/grid',
                        f'{WORKING_DIR}/resources/model1/LR/grid'
                    ),
                    call(
                        'testbucket',
                        'model2/LQ/vel',
                        f'{WORKING_DIR}/resources/model2/LQ/vel'
                    ),
                    call(
                        'testbucket',
                        'model2/LR/grid',
                        f'{WORKING_DIR}/resources/model2/LR/grid'
                    )
                ],
                any_order=True
            )  # yapf: disable


if __name__ == '__main__':
    unittest.main()
