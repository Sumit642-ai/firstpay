from django.db import models


class EmployeeMaster(models.Model):
    id = models.AutoField(db_column='Id', primary_key=True)
    employee_code = models.CharField(db_column='EmployeeCode', max_length=255, blank=True, null=True)
    domain_id = models.CharField(db_column='DOMAIN_ID', max_length=255, blank=True, null=True)
    employee_name = models.CharField(db_column='EmployeeName', max_length=255, blank=True, null=True)
    grade = models.CharField(db_column='Grade', max_length=255, blank=True, null=True)
    designation = models.CharField(db_column='Designation', max_length=255, blank=True, null=True)
    employee_email_id = models.CharField(db_column='EmployeeEmailId', max_length=255, blank=True, null=True)
    gender = models.CharField(db_column='Gender', max_length=255, blank=True, null=True)
    employee_mobile = models.CharField(db_column='EmployeeMobile', max_length=255, blank=True, null=True)
    location = models.CharField(db_column='Location', max_length=255, blank=True, null=True)
    debit_cost_code_id = models.CharField(db_column='DebitCostCodeID', max_length=255, blank=True, null=True)
    cost_center = models.CharField(db_column='CostCenter', max_length=255, blank=True, null=True)
    department = models.CharField(db_column='Department', max_length=255, blank=True, null=True)
    bussiness_unit = models.CharField(db_column='BussinessUnit', max_length=255, blank=True, null=True)
    role = models.IntegerField(db_column='Role', blank=True, null=True)
    country = models.CharField(db_column='Country', max_length=255, blank=True, null=True)
    supervisor_code = models.CharField(db_column='SupervisorCode', max_length=255, blank=True, null=True)
    supervisor_name = models.CharField(db_column='SupervisorName', max_length=255, blank=True, null=True)
    supervisor_email_id = models.CharField(db_column='SupervisorEmailId', max_length=255, blank=True, null=True)
    manager_code = models.CharField(db_column='ManagerCode', max_length=255, blank=True, null=True)
    manager_name = models.CharField(db_column='ManagerName', max_length=255, blank=True, null=True)
    manager_email_id = models.CharField(db_column='ManagerEmailID', max_length=255, blank=True, null=True)
    emp_geo = models.CharField(db_column='EmpGeo', max_length=255, blank=True, null=True)
    created_by = models.CharField(db_column='CreatedBy', max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(db_column='CreatedDate', blank=True, null=True)
    last_edited_by = models.CharField(db_column='LastEditedBy', max_length=255, blank=True, null=True)
    last_edited_date = models.DateTimeField(db_column='LastEditedDate', blank=True, null=True)
    deleted_by = models.CharField(db_column='DeletedBy', max_length=255, blank=True, null=True)
    deleted_date = models.DateTimeField(db_column='DeletedDate', blank=True, null=True)
    deleted_status = models.BooleanField(db_column='DeletedStatus', default=False)

    class Meta:
        managed = False
        db_table = 'tbl_EmployeeMaster'


class RoleMaster(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    role_id = models.IntegerField(db_column='RoleID')
    role_name = models.CharField(db_column='RoleName', max_length=255, blank=True, null=True)
    role_description = models.CharField(db_column='RoleDescription', max_length=255, blank=True, null=True)
    created_by = models.CharField(db_column='CreatedBy', max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(db_column='CreatedDate', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_RoleMaster'


class FreezeInterval(models.Model):
    id = models.AutoField(db_column='Id', primary_key=True)
    start_date = models.DateField(db_column='StartDate')
    end_date = models.DateField(db_column='EndDate')
    created_by = models.CharField(db_column='CreatedBy', max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(db_column='CreatedDate', blank=True, null=True)
    last_edited_by = models.CharField(db_column='LastEditedBy', max_length=255, blank=True, null=True)
    last_edited_date = models.DateTimeField(db_column='LastEditedDate', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_FreezeInterval'


class PayrollTemplate(models.Model):
    code = models.CharField(max_length=16, primary_key=True)
    title = models.CharField(max_length=64)
    description = models.TextField()
    image_url = models.CharField(max_length=255)
    india_file_url = models.CharField(max_length=255, blank=True)
    philippines_file_url = models.CharField(max_length=255, blank=True)

    class Meta:
        managed = False
