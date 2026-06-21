import json
import os
import uuid
from datetime import date, datetime
from pathlib import Path

from django.conf import settings
from django.db import DatabaseError
from django.db import connection
from django.http import JsonResponse
from django.utils.text import get_valid_filename
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from rest_framework import status as drf_status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .auth_service import auth_service_method, is_auth_bypass_user
from .db import check_database_connection, get_payroll_connection
from .models import EmployeeMaster, RoleMaster
from .serializers import EmployeeMasterSerializer, FreezeIntervalSerializer, RoleMasterSerializer

VALID_DOMAINS = {
    'ASG',
    'Cadomain',
    'EVEREST',
    'Medassistgroup',
    'Medplans',
    'MLD.Cadomain.Local',
    'TKGCorp',
    'to.ccrs.com',
}

LOGIN_FAILURE_MESSAGE = 'Login Failure, Did you forget or misspell your ID or password?'
GEO_OPTIONS = ('India', 'Philippines')
DOCUMENT_TYPE_MAP = {
    'payroll': 'PRL',
    'prl': 'PRL',
    'irefer': 'IRF',
    'i refer': 'IRF',
    'irf': 'IRF',
    'transport': 'TDCT',
    'transportdeduction': 'TDCT',
    'transport deduction': 'TDCT',
    'tdct': 'TDCT',
}
DOCUMENT_LABELS = {
    'PRL': 'Payroll',
    'IRF': 'IRefer',
    'TDCT': 'TransportDeduction',
}
DOCUMENT_FOLDERS = {
    'PRL': {'India': 'PayrollPANIndia', 'Philippines': 'PayrollPhp'},
    'IRF': {'India': 'IRefer', 'Philippines': 'IRefer'},
    'TDCT': {'India': 'TransportDeduction', 'Philippines': 'TransportDeduction'},
}


def employee_to_dict(employee):
    return {
        'EmployeeCode': employee.employee_code,
        'DOMAIN_ID': employee.domain_id,
        'EmployeeName': employee.employee_name,
        'Role': employee.role,
        'Grade': employee.grade,
        'SupervisorCode': employee.supervisor_code,
        'EmployeeEmailId': employee.employee_email_id,
        'EmpGeo': employee.emp_geo,
    }


def get_employee_by_domain_id(domain_id):
    employee = (
        EmployeeMaster.objects.filter(domain_id=domain_id, deleted_status=False)
        .only(
            'employee_code',
            'domain_id',
            'employee_name',
            'role',
            'grade',
            'supervisor_code',
            'employee_email_id',
            'emp_geo',
        )
        .first()
    )
    if employee is None:
        return None
    return employee_to_dict(employee)


def build_user_payload(domain_name, employee):
    role_id = employee.get('Role')
    redirect_url = '/admin-report' if str(role_id) == '2' else '/home'

    return {
        'domainName': domain_name,
        'domainId': employee.get('DOMAIN_ID'),
        'employeeCode': employee.get('EmployeeCode'),
        'employeeName': employee.get('EmployeeName'),
        'role': role_id,
        'grade': employee.get('Grade'),
        'supervisor': employee.get('SupervisorCode'),
        'emailId': employee.get('EmployeeEmailId'),
        'empGeo': employee.get('EmpGeo'),
        'loginType': 'LDAP',
        'redirectUrl': redirect_url,
    }


def store_login_session(request, employee):
    request.session['LoginID'] = employee.get('EmployeeCode')
    request.session['EmployeeName'] = employee.get('EmployeeName')
    request.session['Supervisor'] = employee.get('SupervisorCode')
    request.session['RoleID'] = employee.get('Role')
    request.session['Grade'] = employee.get('Grade')
    request.session['DomainId'] = employee.get('DOMAIN_ID')
    request.session['EmailId'] = employee.get('EmployeeEmailId')
    request.session['EmpGeo'] = employee.get('EmpGeo')
    request.session['LoginType'] = 'LDAP'
    request.session['RootDir'] = settings.ROOT_DIR


def login_failure(message=LOGIN_FAILURE_MESSAGE, status=401):
    return JsonResponse({'success': False, 'message': message}, status=status)


def api_index(request):
    return JsonResponse(
        {
            'service': 'FirstPay Phase 2 login API',
            'loginEndpoint': '/api/login/',
            'logoutEndpoint': '/api/logout/',
            'dbStatusEndpoint': '/api/db-status/',
            'dashboardEndpoint': '/api/dashboard/',
            'adminReportEndpoint': '/api/admin-report/',
            'method': 'POST',
            'database': settings.PAYROLL_SQL_DATABASE,
            'server': settings.PAYROLL_SQL_SERVER,
            'authMode': (
                'Integrated Security'
                if settings.PAYROLL_SQL_TRUSTED_CONNECTION.lower() == 'yes'
                else 'SQL Login'
            ),
        }
    )


def sample_upload_row(row_id, user_id, document_type, uploaded_date, status, remarks):
    return {
        'id': row_id,
        'userId': user_id,
        'documentType': document_type,
        'uploadedDate': uploaded_date,
        'status': status,
        'remarks': remarks,
        'templateUrl': '#',
        'emailUrl': '#',
    }


def normalize_document_type(value):
    text = str(value or '').strip().lower()
    return DOCUMENT_TYPE_MAP.get(text, DOCUMENT_TYPE_MAP.get(text.replace(' ', ''), str(value or '').strip().upper()))


def safe_text(value, fallback=''):
    if value is None:
        return fallback
    return str(value)


def format_uploaded_date(value):
    if isinstance(value, datetime):
        return value.strftime('%d/%m/%Y - %H:%M')
    if isinstance(value, date):
        return value.strftime('%d/%m/%Y')
    return safe_text(value)


def row_value(row, *names, fallback=''):
    lowered = {str(key).lower(): value for key, value in row.items()}
    for name in names:
        if name in row:
            return row[name]
        value = lowered.get(str(name).lower())
        if value is not None:
            return value
    return fallback


def public_file_url(path):
    text = safe_text(path)
    if not text:
        return '#'
    if text.startswith(('http://', 'https://', '/')):
        return text
    return f'/{text.lstrip("./")}'


def upload_row_from_db(row, fallback_id):
    doc_code = normalize_document_type(row_value(row, 'DocumentType', 'TypeOfDoc', 'DocType'))
    return {
        'id': int(row_value(row, 'LogId', 'MMLogId', 'Id', 'ID', fallback=fallback_id) or fallback_id),
        'mergeId': row_value(row, 'MMLogId', 'MergeId', 'MMId', fallback=''),
        'userId': safe_text(row_value(row, 'UploadedByEmpNo', 'UploadedBy', 'Uploadedby', 'UserID', 'EmpNo')),
        'documentType': safe_text(row_value(row, 'DocumentType', 'TypeOfDoc', fallback=DOCUMENT_LABELS.get(doc_code, doc_code))),
        'documentCode': doc_code,
        'uploadedDate': format_uploaded_date(row_value(row, 'CreatedDate', 'UploadedDate', 'TimeStamp')),
        'status': safe_text(row_value(row, 'State', 'Status', fallback='Pending')),
        'remarks': safe_text(row_value(row, 'Remarks', 'Comments')),
        'templateUrl': public_file_url(row_value(row, 'S3Link', 'FilePath', 'TemplatePath')),
        'emailUrl': public_file_url(row_value(row, 'FilePathEmail', 'EmailPath')),
        'filePath': public_file_url(row_value(row, 'FilePath', 'S3Link', 'TemplatePath')),
    }


def empty_upload_groups(include_consolidated=False):
    groups = {'payroll': [], 'irefer': [], 'transport': []}
    if include_consolidated:
        groups['consolidated'] = []
    return groups


def append_upload_rows(groups, rows, fallback_offset=0):
    for index, row in enumerate(rows, start=1):
        item = upload_row_from_db(row, fallback_offset + index)
        doc_code = item.get('documentCode')
        key = {'PRL': 'payroll', 'IRF': 'irefer', 'TDCT': 'transport'}.get(doc_code, 'payroll')
        groups.setdefault(key, []).append(item)


def execute_dataset_proc(proc_name, params):
    result_sets = []
    conn = get_payroll_connection()
    try:
        cursor = conn.cursor()
        assignments = ', '.join(f'{name}=?' for name, _ in params)
        cursor.execute(f'EXEC {proc_name} {assignments}', [value for _, value in params])
        while True:
            if cursor.description:
                columns = [column[0] for column in cursor.description]
                result_sets.append([dict(zip(columns, row)) for row in cursor.fetchall()])
            if not cursor.nextset():
                break
        return result_sets
    finally:
        conn.close()


def get_uploaded_files_payload(action, request, include_consolidated=False):
    login_id = get_session_login_id(request)
    user_geo = get_session_geo(request)
    result_sets = execute_dataset_proc(
        'SP_GetAllUploadedFiles',
        [('@LoginId', login_id), ('@Action', action), ('@UserGeo', user_geo)],
    )
    groups = empty_upload_groups(include_consolidated)
    if action == 'AdminSelect':
        names = ['payroll', 'irefer', 'transport', 'email', 'payroll', 'irefer', 'transport']
        for set_index, rows in enumerate(result_sets):
            if set_index < 3:
                append_upload_rows({names[set_index]: groups[names[set_index]]}, rows, set_index * 1000)
            elif include_consolidated and set_index >= 4:
                for row_index, row in enumerate(rows, start=1):
                    groups['consolidated'].append(upload_row_from_db(row, 4000 + set_index * 100 + row_index))
    else:
        for set_index, rows in enumerate(result_sets[:3]):
            append_upload_rows(groups, rows, set_index * 1000)
    return groups


def build_dashboard_fixture():
    return {
        'payroll': [
            sample_upload_row(1, '1038798', 'Payroll', '29/06/2025 - 05:08', 'Uploaded', 'Ready for validation'),
            sample_upload_row(2, '1038812', 'Payroll', '30/06/2025 - 10:30', 'Under Review', 'Pending manager review'),
        ],
        'irefer': [
            sample_upload_row(3, '1038877', 'IRefer', '30/06/2025 - 11:20', 'Under Review', 'Pending validation'),
        ],
        'transport': [
            sample_upload_row(4, '1038890', 'TransportDeduction', '01/07/2025 - 09:45', 'Uploaded', 'Processed'),
        ],
    }


def get_session_geo(request):
    return str(request.session.get('EmpGeo') or 'India').strip() or 'India'


def build_templates_fixture(emp_geo):
    templates = [
        {
            'id': 1,
            'code': 'PRL',
            'imgSrc': '/assets/images/templates/payroll.png',
            'title': 'Payroll',
            'desc': (
                'Use this official Payroll Automation Template to fill in all required employee payroll data. '
                'The downloadable format (.xls/.xlsx) includes predefined columns such as Employee ID, Name, '
                'Basic Pay, Allowances, Deductions, and Net Pay. '
            ),
            'fileLink': {
                'India': '/DownloadTemplates/PayrollPANIndia/PayrollFile.xlsx',
                'Philippines': '/DownloadTemplates/PayrollPhp/PayrollPhilippines.xlsx',
            },
        },
        {
            'id': 2,
            'code': 'TDCT',
            'imgSrc': '/assets/images/templates/transport.png',
            'title': 'Transport Deduction',
            'desc': (
                'It allows you to record and submit employee transport-related deductions for the current payroll '
                'cycle. This ensures that any commute or company transport cost recovery is accurately reflected '
                'in the final salary disbursement. '
            ),
            'fileLink': {
                'India': '/DownloadTemplates/TransportDeduction/TransportDeductionFile.xlsx',
            },
        },
        {
            'id': 3,
            'code': 'IRF',
            'imgSrc': '/assets/images/templates/irefer.png',
            'title': 'IRefer',
            'desc': (
                'Use the standardized IRefer Template to upload referral-related information for payroll processing. '
                'This format ensures accurate capture of associate and referral details, along with the eligible '
                'payout amount. Only .xls or .xlsx formats are accepted. ocess.'
            ),
            'fileLink': {
                'India': '/DownloadTemplates/IRefer/IreferFile.xlsx',
                'Philippines': '/DownloadTemplates/IRefer/IreferFile.xlsx',
            },
        },
    ]
    if emp_geo == 'Philippines':
        templates = [template for template in templates if template['id'] != 2]
    return templates


def get_session_login_id(request):
    return str(request.session.get('LoginID') or request.session.get('DomainId') or 'system')


def coerce_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S'):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def freeze_interval_status(start_date, end_date, role_id=None):
    today = timezone.localdate()
    is_between = bool(start_date and end_date and start_date <= today <= end_date)
    return {
        'today': today.isoformat(),
        'isCurrentDateInRange': is_between,
        'isUploadScreenFreezed': is_between and str(role_id or '') == '1',
        'summaryClassName': 'divSummaryFreezeDate bg-success text-white' if is_between else 'divSummaryFreezeDate bg-danger text-white',
        'statusText': '(Upload Screen Freezed !)' if is_between else '(Upload-Screen Not Freeze.)',
    }


def execute_freeze_interval(start_date='', end_date='', login_id='system', action='GET-INTERVAL'):
    with connection.cursor() as cursor:
        cursor.execute(
            'EXEC SP_SetFreezeInterval @StartDt=%s, @EndDt=%s, @LoginId=%s, @Action=%s',
            [start_date, end_date, login_id, action],
        )
        description = cursor.description or []
        columns = [column[0] for column in description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()] if columns else []
    return rows


def build_freeze_interval_payload(row, request):
    start_date = coerce_date(row.get('StartDate') if row else None)
    end_date = coerce_date(row.get('EndDate') if row else None)
    status_payload = freeze_interval_status(start_date, end_date, request.session.get('RoleID'))
    return {
        'success': True,
        'data': {
            'startDate': start_date.isoformat() if start_date else '',
            'endDate': end_date.isoformat() if end_date else '',
            **status_payload,
        },
    }


@api_view(['GET', 'POST'])
def freeze_interval(request):
    login_id = get_session_login_id(request)

    if request.method == 'GET':
        rows = execute_freeze_interval('', '', login_id, 'GET-INTERVAL')
        return Response(build_freeze_interval_payload(rows[0] if rows else None, request))

    serializer = FreezeIntervalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    start_date = serializer.validated_data['startDate']
    end_date = serializer.validated_data['endDate']
    rows = execute_freeze_interval(start_date.isoformat(), end_date.isoformat(), login_id, 'SET-INTERVAL')
    row = rows[0] if rows else {'StartDate': start_date, 'EndDate': end_date}
    return Response(build_freeze_interval_payload(row, request))


@api_view(['GET', 'POST'])
def users_collection(request):
    if request.method == 'GET':
        users = EmployeeMaster.objects.filter(deleted_status=False).order_by('employee_code', 'employee_name')
        serializer = EmployeeMasterSerializer(users, many=True)
        return Response({'success': True, 'totalEmployees': users.count(), 'data': serializer.data})

    serializer = EmployeeMasterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    employee = serializer.save(
        deleted_status=False,
        created_by=get_session_login_id(request),
        created_date=timezone.now(),
    )
    return Response(
        {
            'success': True,
            'message': 'New employee created successfully!',
            'data': EmployeeMasterSerializer(employee).data,
        },
        status=drf_status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def users_detail(request, pk):
    try:
        employee = EmployeeMaster.objects.get(pk=pk, deleted_status=False)
    except EmployeeMaster.DoesNotExist:
        return Response({'success': False, 'message': 'Employee not found.'}, status=drf_status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({'success': True, 'data': EmployeeMasterSerializer(employee).data})

    if request.method in ('PUT', 'PATCH'):
        serializer = EmployeeMasterSerializer(
            employee,
            data=request.data,
            partial=request.method == 'PATCH',
        )
        serializer.is_valid(raise_exception=True)
        employee = serializer.save(
            last_edited_by=get_session_login_id(request),
            last_edited_date=timezone.now(),
        )
        return Response(
            {
                'success': True,
                'message': 'Details Saved Successfully !',
                'data': EmployeeMasterSerializer(employee).data,
            }
        )

    employee.delete()
    return Response({'success': True, 'message': 'Record deleted successfully !'})


@api_view(['GET'])
def users_options(request):
    roles = list(RoleMaster.objects.order_by('role_id'))
    if not roles:
        roles = [
            RoleMaster(role_id=2, role_name='Admin'),
            RoleMaster(role_id=1, role_name='User'),
        ]

    return Response(
        {
            'success': True,
            'roles': RoleMasterSerializer(roles, many=True).data,
            'geos': [{'Value': geo, 'Text': geo} for geo in GEO_OPTIONS],
        }
    )


@require_GET
def templates_report(request):
    emp_geo = get_session_geo(request)
    return JsonResponse({'success': True, 'empGeo': emp_geo, 'data': build_templates_fixture(emp_geo)})


@require_GET
def dashboard_report(request):
    try:
        data = get_uploaded_files_payload('Select', request)
        return JsonResponse({'success': True, 'source': 'database', 'data': data})
    except Exception as exc:
        return JsonResponse({'success': True, 'source': 'fixture', 'warning': str(exc), 'data': build_dashboard_fixture()})


@require_GET
def admin_report(request):
    try:
        data = get_uploaded_files_payload('AdminSelect', request, include_consolidated=True)
        return JsonResponse({'success': True, 'source': 'database', 'data': data})
    except Exception as exc:
        data = build_dashboard_fixture()
        data['payroll'] = [
            sample_upload_row(101, '1038798', 'Payroll', '29/06/2025 - 05:08', 'Pending', 'Waiting for SPOC approval'),
            sample_upload_row(102, '1038812', 'Payroll', '30/06/2025 - 08:18', 'Approved', 'Approved by manager'),
        ]
        data['irefer'] = [
            sample_upload_row(201, '1038877', 'IRefer', '30/06/2025 - 11:20', 'Rejected', 'Incorrect amount'),
        ]
        data['transport'] = [
            sample_upload_row(301, '1038890', 'TransportDeduction', '01/07/2025 - 09:45', 'Pending', 'New request'),
        ]
        data['consolidated'] = [
            sample_upload_row(401, 'Admin', 'Payroll', '02/07/2025 - 16:10', 'Consolidated', 'Monthly payroll consolidated'),
        ]
        return JsonResponse({'success': True, 'source': 'fixture', 'warning': str(exc), 'data': data})


def save_uploaded_file(uploaded_file, folder_name, prefix):
    upload_root = Path(settings.BASE_DIR) / 'UploadFiles'
    target_dir = upload_root / folder_name
    target_dir.mkdir(parents=True, exist_ok=True)
    original_name = get_valid_filename(uploaded_file.name)
    stored_name = f'{prefix}_{uuid.uuid4().hex[:10]}_{original_name}'
    target_path = target_dir / stored_name
    with target_path.open('wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)
    relative_path = f'/UploadFiles/{folder_name}/{stored_name}'
    return relative_path, original_name


@csrf_exempt
@require_POST
def submit_upload(request):
    template_file = request.FILES.get('templateFile')
    email_file = request.FILES.get('emailFile')
    doc_code = normalize_document_type(request.POST.get('documentType'))
    user_geo = request.POST.get('usergeo') or get_session_geo(request)

    if doc_code not in DOCUMENT_LABELS:
        return JsonResponse({'success': False, 'message': 'Please select a valid document type.'}, status=400)
    if template_file is None:
        return JsonResponse({'success': False, 'message': 'Template file is required.'}, status=400)

    extension = os.path.splitext(template_file.name)[1].lower()
    if extension not in ('.xls', '.xlsx'):
        return JsonResponse({'success': False, 'message': 'Upload failure ! only .xls and .xlsx formats allowed !'}, status=400)

    if email_file is not None:
        email_extension = os.path.splitext(email_file.name)[1].lower()
        if email_extension not in ('.msg', '.eml'):
            return JsonResponse({'success': False, 'message': 'Only .msg / .eml message document for email approval are allowed.'}, status=400)

    folder_name = DOCUMENT_FOLDERS[doc_code].get(user_geo, DOCUMENT_FOLDERS[doc_code]['India'])
    login_id = get_session_login_id(request)
    domain_id = str(request.session.get('DomainId') or login_id)
    prefix = f'{domain_id}_{timezone.now().strftime("%d%m%Y%H%M%S")}_{doc_code}'
    file_path, original_name = save_uploaded_file(template_file, folder_name, prefix)
    email_path = ''
    if email_file is not None:
        email_path, _ = save_uploaded_file(email_file, 'Email', f'{domain_id}_{timezone.now().strftime("%d%m%Y%H%M%S")}_EMAIL')

    try:
        rows = execute_dataset_proc(
            'SP_InsertSuccessLog',
            [
                ('@Type', doc_code),
                ('@StrFilePath', file_path),
                ('@StrFileName', original_name),
                ('@UploadBy', domain_id),
                ('@Action', 'Insert'),
                ('@EmpNo', login_id),
                ('@EmailStrFilePath', email_path),
                ('@UserGeo', user_geo),
            ],
        )
        request_id = ''
        if rows and rows[0]:
            request_id = safe_text(row_value(rows[0][0], 'New_ID', 'RequestId', 'Id'))
        return JsonResponse(
            {
                'success': True,
                'source': 'database',
                'message': 'success : Request uploaded successfully',
                'requestId': request_id,
                'filePath': file_path,
                'emailPath': email_path,
            }
        )
    except Exception as exc:
        return JsonResponse(
            {
                'success': True,
                'source': 'local-file',
                'warning': str(exc),
                'message': 'success : Request uploaded locally; database log was not available.',
                'filePath': file_path,
                'emailPath': email_path,
            }
        )


def parse_action_rows(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        payload = {}
    rows = payload.get('rows') or []
    action = normalize_document_type(payload.get('documentType') or payload.get('action'))
    comments = safe_text(payload.get('comments'))
    return payload, rows, action, comments


@csrf_exempt
@require_POST
def admin_approve(request):
    _, rows, action, _ = parse_action_rows(request)
    return JsonResponse({'success': True, 'message': 'Approved', 'documentType': action, 'affected': len(rows)})


@csrf_exempt
@require_POST
def admin_reject(request):
    _, rows, action, comments = parse_action_rows(request)
    if not comments:
        return JsonResponse({'success': False, 'message': 'Comments are required for rejection.'}, status=400)
    return JsonResponse({'success': True, 'message': 'Rejected', 'documentType': action, 'affected': len(rows)})


@csrf_exempt
@require_POST
def admin_consolidate(request):
    _, rows, action, _ = parse_action_rows(request)
    return JsonResponse({'success': True, 'message': 'Consolidated', 'documentType': action, 'affected': len(rows)})


@require_GET
def db_status(request):
    try:
        database_status = check_database_connection()
        return JsonResponse({'success': True, **database_status})
    except DatabaseError as exc:
        return JsonResponse(
            {
                'success': False,
                'connected': False,
                'message': str(exc),
                'configuredServer': settings.PAYROLL_SQL_SERVER,
                'configuredDatabase': settings.PAYROLL_SQL_DATABASE,
            },
            status=503,
        )


@csrf_exempt
@require_POST
def domain_login(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid request payload.'}, status=400)

    domain_name = str(payload.get('domainName', '')).strip()
    domain_id = str(payload.get('domainId', '')).strip()
    password = str(payload.get('password', ''))

    errors = []
    if not domain_name or domain_name == '0':
        errors.append('Please select domain name.')
    if not domain_id:
        errors.append("Domain id can't be blank")
    if not password:
        errors.append("Password can't be blank")

    if errors:
        return JsonResponse({'success': False, 'message': ' '.join(errors)}, status=400)

    try:
        auth_status = auth_service_method(domain_name, domain_id, password)

        if auth_status.upper() == 'FALSE' and is_auth_bypass_user(domain_id):
            auth_status = 'TRUE'

        if auth_status.upper() != 'TRUE' and auth_status != 'abort':
            return login_failure()

        employee = get_employee_by_domain_id(domain_id)
    except DatabaseError:
        return JsonResponse(
            {
                'success': False,
                'message': (
                    f'Unable to connect to {settings.PAYROLL_SQL_DATABASE} '
                    f'on {settings.PAYROLL_SQL_SERVER}.'
                ),
            },
            status=503,
        )
    except Exception:
        return login_failure(status=500)

    if employee is None:
        return login_failure(LOGIN_FAILURE_MESSAGE, status=403)

    store_login_session(request, employee)
    user_payload = build_user_payload(domain_name, employee)

    return JsonResponse(
        {
            'success': True,
            'message': 'Login successful.',
            'user': user_payload,
        }
    )


@csrf_exempt
@require_POST
def sign_out(request):
    request.session.flush()
    return JsonResponse({'success': True, 'message': 'Signed out successfully.'})


@require_GET
def session_info(request):
    if not request.session.get('LoginID'):
        return JsonResponse({'authenticated': False}, status=401)

    return JsonResponse(
        {
            'authenticated': True,
            'user': {
                'employeeCode': request.session.get('LoginID'),
                'employeeName': request.session.get('EmployeeName'),
                'supervisor': request.session.get('Supervisor'),
                'role': request.session.get('RoleID'),
                'grade': request.session.get('Grade'),
                'domainId': request.session.get('DomainId'),
                'emailId': request.session.get('EmailId'),
                'empGeo': request.session.get('EmpGeo'),
                'loginType': request.session.get('LoginType'),
                'rootDir': request.session.get('RootDir'),
            },
        }
    )
