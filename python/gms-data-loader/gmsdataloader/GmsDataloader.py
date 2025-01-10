import logging
import os

from gmsdataloader import ConfigOverrideResolver
from gmsdataloader.dispersion import DispersionMinioConfig, DispersionLoader
from gmsdataloader.earthmodels import EarthModelMinioConfig, EarthModelsLoader
from gmsdataloader.ellipticity import (
    DziewonskiGilbertLoader,
    DziewonskiGilbertMinioConfig
)
from gmsdataloader.mediumvelocity import (
    MediumVelocityLoader,
    MediumVelocityMinioConfig
)
from gmsdataloader.processingconfig import ProcessingConfigLoader
from gmsdataloader.userpreferences import (
    UserPreferencesLoader,
    UserPreferencesLoaderConfig
)

# Create logger
logger = logging.getLogger('gmsdataloader')


class GmsDataloader:

    def __init__(
        self,
        default_config_path: str,
        override_config_path: str
    ) -> None:
        self.default_config_path = default_config_path
        self.override_config_path = override_config_path
        self.resolver = ConfigOverrideResolver(
            default_config_path,
            override_config_path
        )

    def load_processing_config(self, processing_config_url: str) -> None:

        # processing configuration must be in a 'processing' subdirectory
        processing_config_path = os.path.join(
            self.default_config_path,
            "processing"
        )
        processing_config_override_path = os.path.join(
            self.override_config_path,
            "processing"
        ) if self.override_config_path else None

        processing_config_loader = ProcessingConfigLoader(
            processing_config_url,
            processing_config_path,
            processing_config_override_path
        )
        if not processing_config_loader.load():
            raise RuntimeError("Failed to load processing configuration.")

    def load_user_preferences(self, osd_url: str) -> None:
        user_preferences_file = self.resolver.path(
            "user-preferences/defaultUserPreferences.json"
        )
        user_preferences_loader_config = UserPreferencesLoaderConfig(osd_url)
        user_preferences_loader = UserPreferencesLoader(
            user_preferences_loader_config
        )
        user_preferences_loader.load_user_preferences(user_preferences_file)

    def load_earthmodel_data(self, minio_url: str, minio_bucket: str) -> None:
        earthmodels_config = EarthModelMinioConfig(minio_url, minio_bucket)
        processing_config_path = os.path.join(
            self.default_config_path,
            "earth-models"
        )
        earth_models_loader = EarthModelsLoader(
            processing_config_path,
            earthmodels_config
        )
        earth_models_loader.load()

    def load_dispersion_data(self, minio_url: str, minio_bucket: str) -> None:
        dispersion_config = DispersionMinioConfig(minio_url, minio_bucket)
        processing_config_path = os.path.join(
            self.default_config_path,
            "dispersion"
        )
        dispersion_loader = DispersionLoader(
            processing_config_path,
            dispersion_config
        )
        dispersion_loader.load()

    def load_mediumvelocity_data(self, minio_url, minio_bucket):
        mediumvelocity_config = MediumVelocityMinioConfig(
            minio_url,
            minio_bucket
        )
        processing_config_path = os.path.join(
            self.default_config_path,
            "mediumvelocity"
        )
        mediumvelocity_loader = MediumVelocityLoader(
            processing_config_path,
            mediumvelocity_config
        )
        mediumvelocity_loader.load()

    def load_dziewonski_gilbert_data(self, minio_url, minio_bucket):
        dg_config = DziewonskiGilbertMinioConfig(minio_url, minio_bucket)
        processing_config_path = os.path.join(
            self.default_config_path,
            os.path.join("ellipticity-correction",
                         "dziewonski-gilbert")
        )
        dg_loader = DziewonskiGilbertLoader(processing_config_path, dg_config)
        dg_loader.load()
