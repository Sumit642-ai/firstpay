import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from django.conf import settings


def send_request(url):
    """Equivalent to WebRequestHelper.SendRequest."""
    try:
        request = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read().decode('utf-8')
    except (urllib.error.URLError, TimeoutError, OSError):
        return '1'


def parse_xml(xml_val):
    """Equivalent to LoginController.ParseXml."""
    return_val = ''

    try:
        root = ET.fromstring(xml_val)
        if root is not None:
            string_value = (root.text or '').strip()
            if string_value.lower() in ('true', 'false'):
                return_val = string_value.lower()
            else:
                return_val = f'Unparseable value :{string_value}'
            return return_val

        return_val = "boolean' root element not found"
    except ET.ParseError:
        pass

    return return_val.lower()


def auth_service_method(domain_name, login_id, password):
    """Equivalent to LoginController.AuthServiceMethod."""
    auth_url = settings.AUTH_SERVICE_URL
    auth_url = (
        auth_url.replace('strDomainID', login_id)
        .replace('strPassword', urllib.parse.quote(password, safe=''))
        .replace('strDomainName', domain_name)
    )

    response = send_request(auth_url)
    if response not in ('1', None, ''):
        return parse_xml(response)

    return 'abort'


def is_auth_bypass_user(login_id):
    """Allow configured test users when LDAP auth returns FALSE."""
    normalized_login_id = login_id.strip().upper()
    return normalized_login_id in settings.AUTH_USER_IDS
