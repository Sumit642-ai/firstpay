"""
SQL Server settings mirrored from Payroll_Automation Web.config (PayrollContext).

LOCAL (active):
  Data Source=LAPTOP-14DRA4H6\\TEW_SQLEXPRESS
  Initial Catalog=Payroll_Automation
  Integrated Security=True

UAT (commented in Web.config — switch USE_UAT_DB = True to enable):
  Data Source=192.168.96.112
  Initial Catalog=Payroll_Automation_UAT
  User ID=Payroll_Users
  Password=ICICI1src
"""

import os

USE_UAT_DB = os.environ.get('USE_UAT_DB', 'False').lower() == 'true'

LOCAL = {
    'SERVER': os.environ.get('DB_SERVER', r'10.104.9.25\dev2008r2edition,1533'),
    'DATABASE': os.environ.get('DB_DATABASE', 'Payroll_Automation'),
    'USER': os.environ.get('DB_USER', 'devusers'),
    'PASSWORD': os.environ.get('DB_PASSWORD', r'9h018\%{5J*C[97yBT'),
    'TRUSTED_CONNECTION': os.environ.get('DB_TRUSTED_CONNECTION', 'no'),
}

UAT = {
    'SERVER': os.environ.get('DB_SERVER_UAT', '192.168.96.112'),
    'DATABASE': os.environ.get('DB_DATABASE_UAT', 'Payroll_Automation_UAT'),
    'USER': os.environ.get('DB_USER_UAT', 'Payroll_Users'),
    'PASSWORD': os.environ.get('DB_PASSWORD_UAT', 'ICICI1src'),
    'TRUSTED_CONNECTION': os.environ.get('DB_TRUSTED_CONNECTION_UAT', 'no'),
}

DRIVER = 'ODBC Driver 17 for SQL Server'


def get_active_db_config():
    return UAT if USE_UAT_DB else LOCAL


def build_pyodbc_connection_string():
    cfg = get_active_db_config()
    parts = [
        f'DRIVER={{{DRIVER}}}',
        f'SERVER={cfg["SERVER"]}',
        f'DATABASE={cfg["DATABASE"]}',
    ]

    if cfg['TRUSTED_CONNECTION'].lower() == 'yes':
        parts.append('Trusted_Connection=yes')
    else:
        parts.append(f'UID={cfg["USER"]}')
        parts.append(f'PWD={cfg["PASSWORD"]}')

    parts.extend(['Encrypt=no', 'TrustServerCertificate=yes'])
    return ';'.join(parts) + ';'


def build_django_database_settings():
    cfg = get_active_db_config()
    options = {
        'driver': DRIVER,
        'extra_params': 'Encrypt=no;TrustServerCertificate=yes',
    }

    if cfg['TRUSTED_CONNECTION'].lower() == 'yes':
        options['extra_params'] = 'Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes'

    return {
        'ENGINE': 'mssql',
        'NAME': cfg['DATABASE'],
        'HOST': cfg['SERVER'],
        'PORT': '',
        'USER': cfg['USER'],
        'PASSWORD': cfg['PASSWORD'],
        'OPTIONS': options,
    }
