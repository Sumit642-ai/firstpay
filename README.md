# FirstPay Phase 2

React/Django rewrite of the existing `Payroll_Automation_ProdCpy_Phase3` login page.

## Structure

- `frontend/` - React + Vite login UI.
- `backend/` - Django API for login validation.

## Run Backend

```powershell
cd backend
..\..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py runserver 8001
```

The backend uses the same SQL Server connection as `Payroll_Automation_ProdCpy_Phase3` (`Web.config` → `PayrollContext`):

- Server: `LAPTOP-14DRA4H6\TEW_SQLEXPRESS`
- Database: `Payroll_Automation`
- Authentication: Windows Integrated Security

Check DB connectivity at `http://127.0.0.1:8001/api/db-status/`.

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://127.0.0.1:8001/api/login/`.

Open the frontend at `http://127.0.0.1:5180/`.

Open the backend status page at `http://127.0.0.1:8001/`.

## Login Data

The login API reads employees from `dbo.tbl_EmployeeMaster` by `DOMAIN_ID` where `DeletedStatus = 0`.
