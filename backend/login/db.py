import pyodbc
from django.conf import settings
from django.db import connection


def get_payroll_connection():
    return pyodbc.connect(settings.PAYROLL_PYODBC_CONNECTION_STRING, timeout=5)


def check_database_connection():
    cfg = settings.PAYROLL_DB_CONFIG
    with connection.cursor() as cursor:
        cursor.execute('SELECT DB_NAME() AS current_db, @@SERVERNAME AS server_name')
        row = cursor.fetchone()

    return {
        'connected': True,
        'server': row[1],
        'database': row[0],
        'configuredServer': cfg['SERVER'],
        'configuredDatabase': cfg['DATABASE'],
        'authMode': 'Integrated Security' if cfg['TRUSTED_CONNECTION'].lower() == 'yes' else 'SQL Login',
    }
