from setuptools import find_packages, setup
'''
To rebuild, run python3 setup.py
'''

VERSION = '0.1.0'

setup(
    name='config-loader',
    version=VERSION,
    description='Application for the loading of the config into the GMS',
    packages=find_packages(),
    python_requires='>=3.10',
    install_requires=[
        'flask',
        'gunicorn',
        'pyyaml',
        'flask-sqlalchemy',
        'flask-executor',
        'requests'
    ]
)
