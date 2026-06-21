from rest_framework import serializers

from .models import EmployeeMaster, FreezeInterval, RoleMaster


class RoleMasterSerializer(serializers.ModelSerializer):
    RoleID = serializers.IntegerField(source='role_id', read_only=True)
    RoleName = serializers.CharField(source='role_name', read_only=True)

    class Meta:
        model = RoleMaster
        fields = ('RoleID', 'RoleName')


class EmployeeMasterSerializer(serializers.ModelSerializer):
    Id = serializers.IntegerField(source='id', read_only=True)
    EmployeeCode = serializers.CharField(source='employee_code', allow_blank=True, allow_null=True, required=True)
    DOMAIN_ID = serializers.CharField(source='domain_id', allow_blank=True, allow_null=True, required=True)
    EmployeeName = serializers.CharField(source='employee_name', allow_blank=True, allow_null=True, required=True)
    EmployeeEmailId = serializers.EmailField(source='employee_email_id', allow_blank=True, allow_null=True, required=True)
    Role = serializers.IntegerField(source='role', allow_null=True, required=True)
    EmpGeo = serializers.CharField(source='emp_geo', allow_blank=True, allow_null=True, required=True)
    DeletedStatus = serializers.BooleanField(source='deleted_status', read_only=True)
    RoleName = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeMaster
        fields = (
            'Id',
            'EmployeeCode',
            'DOMAIN_ID',
            'EmployeeName',
            'EmployeeEmailId',
            'Role',
            'RoleName',
            'EmpGeo',
            'DeletedStatus',
        )

    def get_RoleName(self, obj):
        if str(obj.role) == '1':
            return 'User'
        if str(obj.role) == '2':
            return 'Admin'
        return obj.role or 'N/A'

    def validate(self, attrs):
        required_fields = {
            'employee_code': 'Employee code is required.',
            'domain_id': 'Domain ID is required.',
            'employee_name': 'Employee name is required.',
            'employee_email_id': 'Employee email is required.',
            'role': 'Role is required.',
            'emp_geo': 'Employee geo is required.',
        }

        for field, message in required_fields.items():
            if attrs.get(field) in (None, ''):
                raise serializers.ValidationError({field: message})

        if attrs.get('role') not in (1, 2):
            raise serializers.ValidationError({'role': 'Role must be 1 or 2.'})

        if attrs.get('emp_geo') not in ('India', 'Philippines'):
            raise serializers.ValidationError({'emp_geo': 'Employee geo must be India or Philippines.'})

        return attrs


class FreezeIntervalSerializer(serializers.Serializer):
    startDate = serializers.DateField(required=True)
    endDate = serializers.DateField(required=True)

    def validate(self, attrs):
        if attrs['startDate'] > attrs['endDate']:
            raise serializers.ValidationError({'endDate': 'End date must be greater than or equal to start date.'})
        return attrs


class FreezeIntervalReadSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date', read_only=True)
    endDate = serializers.DateField(source='end_date', read_only=True)

    class Meta:
        model = FreezeInterval
        fields = ('startDate', 'endDate')
