import json
import os
import pathlib

from minio import Minio


class DispersionMinioConfig:
    """
        Contains configuration for minio. Includes reading credentials
        from the environment.
    """

    def __init__(
        self,
        base_url: str,
        bucket: str,
        minio_client: Minio = None
    ) -> None:
        """
        Constructor

        Args:
            base_url: Base URL for minio.
                Must not contain 'http://' as Minio adds that itself.
            bucket: Bucket to store data
            minio_client: For testing only - the minio client to use.
                If not specified, default client is created.
        """

        self.base_url = base_url
        self.bucket = bucket

        if minio_client is None:
            self.minio_client = Minio(
                base_url,
                os.getenv('MINIO_ROOT_USER'),
                os.getenv('MINIO_ROOT_PASSWORD'),
                secure=False
            )
        else:
            self.minio_client = minio_client


class DispersionLoader:
    """
        Loads dispersion model files into minio.
    """

    def __init__(
        self,
        dispersion_root: str,
        dispersion_minio_config: DispersionMinioConfig
    ) -> None:
        """
        Constructor

        Args:
            dispersion_root: Path where the models are stored;
                this is the base path, which contains directories for each model,
                and each of those directories contains model files.
            dispersion_minio_config: DispersionMinioConfig objects which
                has config info for minio.
        """

        self.minio_client = dispersion_minio_config.minio_client
        self.dispersion_root = pathlib.Path(dispersion_root)
        self.bucket = dispersion_minio_config.bucket

    def load(self) -> None:
        """
        Does the work of loading the files into minio.

        Returns: nothing

        """

        if not self.minio_client.bucket_exists(self.bucket):
            self.minio_client.make_bucket(self.bucket)

            # set anonymous read on bucket
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                        "Resource": f"arn:aws:s3:::{self.bucket}",
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{self.bucket}/*",
                    },
                ],
            }
            self.minio_client.set_bucket_policy(self.bucket, json.dumps(policy))

        # dispersion models are loaded exactly as they are on disk into minio
        for item in self.dispersion_root.rglob("*"):
            if item.is_file():
                self.minio_client.fput_object(
                    self.bucket,
                    str(item.relative_to(self.dispersion_root)),
                    str(item)
                )
