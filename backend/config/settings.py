from pathlib import Path

from config.payroll_db import (
    build_django_database_settings,
    build_pyodbc_connection_string,
    get_active_db_config,
)

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'firstpay-phase-2-dev-key'
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '0.0.0.0', '.vercel.app', '.onrender.com']

INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'login',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': build_django_database_settings(),
}

PAYROLL_DB_CONFIG = get_active_db_config()
PAYROLL_SQL_SERVER = PAYROLL_DB_CONFIG['SERVER']
PAYROLL_SQL_DATABASE = PAYROLL_DB_CONFIG['DATABASE']
PAYROLL_SQL_DRIVER = 'ODBC Driver 17 for SQL Server'
PAYROLL_SQL_TRUSTED_CONNECTION = PAYROLL_DB_CONFIG['TRUSTED_CONNECTION']

PAYROLL_PYODBC_CONNECTION_STRING = build_pyodbc_connection_string()

AUTH_SERVICE_URL = (
    'http://192.168.92.90/UserAuth_Service/UserClass.asmx/IsValidUser'
    '?DomainID=strDomainID&Password=strPassword&DomainName=strDomainName'
)
AUTH_USER_IDS = {
    user.strip().upper()
    for user in (
        'user,armen,user2,user3,user4,user5,user6,user7,user8,user9,'
        'user10,user11,user12,user13,user14,user15,user16,user17,user18,user19,'
        'user20,user21,user22,user23,user24,user25,user26,user27,user28,user29,'
        'user30,user31,user32,user33,user34,user35,user36,user37,user38,user39,'
        'user40,user41,user42,user43,user44,user45,user46,user47,user48,user49,'
        'user50,user51,user52,user53,user54,user55,user56,user57,user58,user59,'
        'user60,user61,user62,user63,user64,user65,user66,user67,user68,user69,'
        'user70,PAN71,approver1'
    ).split(',')
    if user.strip()
}
ROOT_DIR = r'D:\Payroll_Automation\PayrollAutomation'

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:5180',
    'http://localhost:5180',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
]
CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = '192.168.93.91'
EMAIL_PORT = 25
EMAIL_HOST_USER = r'.\administrator'
EMAIL_HOST_PASSWORD = 'ICICI1src'
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
DEFAULT_FROM_EMAIL = 'FirstPay@firstsource.com'

# Geography Admin Fallback Emails
ADMIN_EMAILS_BY_GEO = {
    'India': ['vinay.soni@firstsource.com', 'armen@firstsource.com'],
    'Philippines': ['ratheesh.unnikrishnan@firstsource.com'],
    'United States': ['admin@firstsource.com'],
}

