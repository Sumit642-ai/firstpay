import React, { FormEvent, useEffect, useMemo, useState } from 'react';

interface Employee {
  Id?: number;
  EmployeeCode: string;
  DOMAIN_ID: string;
  EmployeeName: string;
  EmployeeEmailId: string;
  Role: number | '';
  RoleName?: string;
  EmpGeo: string;
}

interface RoleOption {
  RoleID: number;
  RoleName: string;
}

interface GeoOption {
  Value: string;
  Text: string;
}

const emptyEmployee: Employee = {
  EmployeeCode: '',
  DOMAIN_ID: '',
  EmployeeName: '',
  EmployeeEmailId: '',
  Role: '',
  EmpGeo: '',
};

const fallbackRoles: RoleOption[] = [
  { RoleID: 2, RoleName: 'Admin' },
  { RoleID: 1, RoleName: 'User' },
];

const fallbackGeos: GeoOption[] = [
  { Value: 'India', Text: 'India' },
  { Value: 'Philippines', Text: 'Philippines' },
];

const UserManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>(fallbackRoles);
  const [geos, setGeos] = useState<GeoOption[]>(fallbackGeos);
  const [formData, setFormData] = useState<Employee>(emptyEmployee);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalEmployees = useMemo(() => employees.length, [employees]);

  const loadEmployees = () => {
    fetch('/api/users/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((payload) => {
        setEmployees(payload.data || []);
      })
      .catch(() => {
        setEmployees([]);
      });
  };

  useEffect(() => {
    loadEmployees();
    fetch('/api/users/options/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success) {
          setRoles(payload.roles?.length ? payload.roles : fallbackRoles);
          setGeos(payload.geos?.length ? payload.geos : fallbackGeos);
        }
      })
      .catch(() => {
        setRoles(fallbackRoles);
        setGeos(fallbackGeos);
      });
  }, []);

  const showList = () => {
    setMode('list');
    setFormData(emptyEmployee);
  };

  const showCreate = () => {
    setMode('create');
    setFormData(emptyEmployee);
    setAlertMessage('');
  };

  const showEdit = (employee: Employee) => {
    setMode('edit');
    setFormData({
      ...employee,
      Role: employee.Role || '',
      EmpGeo: employee.EmpGeo || '',
    });
    setAlertMessage('');
  };

  const updateField = (field: keyof Employee, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: field === 'Role' ? (value ? Number(value) : '') : value,
    }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setAlertMessage('');

    const url = mode === 'edit' ? `/api/users/${formData.Id}/` : '/api/users/';
    const method = mode === 'edit' ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Error saving the details !');
      }

      setAlertMessage(payload.message || 'Details Saved Successfully !');
      loadEmployees();
      showList();
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Error saving the details !');
    } finally {
      setIsSaving(false);
    }
  };

  const disableUser = async (id?: number) => {
    if (!id || !window.confirm('Are you sure you want to disable this user?')) {
      return;
    }

    const response = await fetch(`/api/users/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const payload = await response.json().catch(() => null);
    setAlertMessage(payload?.message || 'Record deleted successfully !');
    if (response.ok) {
      loadEmployees();
    }
  };

  const exportExcel = () => {
    const headers = ['Employee Code', 'Employee Name', 'Employee EmailId', 'Role', 'Employee Geo'];
    const rows = employees.map((employee) => [
      employee.EmployeeCode || 'N/A',
      employee.EmployeeName || 'N/A',
      employee.EmployeeEmailId || 'N/A',
      employee.RoleName || roleLabel(employee.Role),
      employee.EmpGeo || 'N/A',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'UserData.xls';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const roleLabel = (role: number | '') => {
    if (String(role) === '1') {
      return 'User';
    }
    if (String(role) === '2') {
      return 'Admin';
    }
    return role || 'N/A';
  };

  if (mode !== 'list') {
    const isEdit = mode === 'edit';

    return (
      <form onSubmit={submitForm}>
        <div className="w-screen h-screen d-flex">
          <main className="flex-grow-1 overflow-auto customScrollbar mainContentWrapper">
            <div className="w-100 h-100 d-flex">
              <section className="h-100 documentsTableSection pull-left">
                <div className="h-100 d-flex flex-column">
                  <div className="h-auto header">
                    <div className="left">
                      <h2 className="mainHeading">FirstPay Automation</h2>
                      <p className="subHeading">{isEdit ? 'FirstPay Edit User' : 'FirstPay New User'}</p>
                    </div>
                    <hr />
                  </div>

                  {alertMessage && <div className="text-danger">{alertMessage}</div>}
                  <input type="hidden" value={formData.Id || ''} />

                  <div className="row" style={{ padding: '15px 0' }}>
                    <div className="col-sm-6">
                      <label className="control-label col-md-2">EmployeeCode</label>
                      <div className="col-md-10">
                        <input
                          className="form-control"
                          readOnly={isEdit}
                          value={formData.EmployeeCode}
                          onChange={(event) => updateField('EmployeeCode', event.target.value)}
                        />
                        <span className="text-danger" />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ padding: '15px 0' }}>
                    <div className="col-sm-6">
                      <label className="control-label col-md-2">DOMAIN_ID</label>
                      <div className="col-md-10">
                        <input
                          className="form-control"
                          readOnly={isEdit}
                          value={formData.DOMAIN_ID}
                          onChange={(event) => updateField('DOMAIN_ID', event.target.value)}
                        />
                        <span className="text-danger" />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ padding: '15px 0' }}>
                    <div className="col-sm-6">
                      <label className="control-label col-md-2">EmployeeName</label>
                      <div className="col-md-10">
                        <input
                          className="form-control"
                          value={formData.EmployeeName}
                          onChange={(event) => updateField('EmployeeName', event.target.value)}
                        />
                        <span className="text-danger" />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ padding: '15px 0' }}>
                    <div className="col-sm-6">
                      <label className="control-label col-md-2">EmployeeEmailId</label>
                      <div className="col-md-10">
                        <input
                          className="form-control"
                          value={formData.EmployeeEmailId}
                          onChange={(event) => updateField('EmployeeEmailId', event.target.value)}
                        />
                        <span className="text-danger" />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ padding: '15px 0' }}>
                    <div className="col-sm-6">
                      <label className="control-label col-md-2">Role</label>
                      <div className="col-md-10">
                        <select
                          className="form-control"
                          value={formData.Role}
                          onChange={(event) => updateField('Role', event.target.value)}
                        >
                          <option value="">{isEdit ? 'Select Role' : '--Select-- '}</option>
                          {roles.map((role) => (
                            <option key={role.RoleID} value={role.RoleID}>
                              {role.RoleName}
                            </option>
                          ))}
                        </select>
                        <span className="text-danger" />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ padding: '15px 0' }}>
                    <div className="col-sm-6">
                      <label className="control-label col-md-2">EmpGeo</label>
                      <div className="col-md-10">
                        <select
                          className="form-control"
                          value={formData.EmpGeo}
                          onChange={(event) => updateField('EmpGeo', event.target.value)}
                        >
                          <option value="">{isEdit ? '-- Select Geo --' : '--Select-- '}</option>
                          {geos.map((geo) => (
                            <option key={geo.Value} value={geo.Value}>
                              {geo.Text}
                            </option>
                          ))}
                        </select>
                        <span className="text-danger" />
                      </div>
                    </div>
                  </div>

                  <br />
                  <div className="row">
                    <div className="col-md-3" />
                    <div className="col-md-3" />
                    <div className="col-md-3" />
                    <div className="col-md-3">
                      <input
                        type="submit"
                        value={isEdit ? 'Save Details' : 'Create New User'}
                        className={isEdit ? 'btn btn-default btn-sm btn-outline-info' : 'btn btn-default btn-outline-info'}
                        style={isEdit ? { width: '95px' } : undefined}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <button type="button" className="btn btn-link" onClick={showList}>
                    Back to List
                  </button>
                </div>
              </section>
            </div>
          </main>
        </div>
      </form>
    );
  }

  return (
    <div className="w-screen h-screen d-flex">
      <main className="flex-grow-1 overflow-auto customScrollbar mainContentWrapper">
        <div className="w-100 h-100 d-flex">
          <section className="h-100 documentsTableSection pull-left">
            <div className="h-100 d-flex flex-column">
              <div className="h-auto header">
                <div className="left">
                  <h2 className="mainHeading">FirstPay Automation</h2>
                  <p className="subHeading">Employee Management</p>
                </div>
                <hr />
                {alertMessage && <div className="text-danger">{alertMessage}</div>}
                <div className="d-flex justify-content-between mb-3">
                  <div>
                    <span className="fw-bold">Total Employees: </span> {totalEmployees}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div>
                      <button id="btnExportExcel" className="btn btn-success" type="button" onClick={exportExcel}>
                        <i className="fas fa-file-excel" /> Export to Excel
                      </button>
                    </div>
                    <div>
                      <button type="button" className="btn btn-primary mb-3" onClick={showCreate}>
                        Create New User
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <table id="tbluser" className="table table-bordered table-hover table-striped align-middle shadow-sm">
                <thead className="">
                  <tr>
                    <th>Employee Code</th>
                    <th>Employee Name</th>
                    <th>Employee EmailId</th>
                    <th>Role</th>
                    <th>Employee Geo</th>
                    <th style={{ textAlign: 'center' }}>Edit Action</th>
                    <th style={{ textAlign: 'center' }}>Delete Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!employees.length ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.Id || emp.EmployeeCode}>
                        <td>{emp.EmployeeCode || 'N/A'}</td>
                        <td>{emp.EmployeeName || 'N/A'}</td>
                        <td>{emp.EmployeeEmailId || 'N/A'}</td>
                        <td>{emp.RoleName || roleLabel(emp.Role)}</td>
                        <td>{emp.EmpGeo || 'N/A'}</td>
                        <td>
                          <div className="btn-group d-flex justify-content-between" role="group" style={{ width: '100%' }}>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => showEdit(emp)}>
                              Edit Details
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group d-flex justify-content-between" role="group" style={{ width: '100%' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary alert-danger"
                              onClick={() => disableUser(emp.Id)}
                            >
                              Remove User
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div />
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
