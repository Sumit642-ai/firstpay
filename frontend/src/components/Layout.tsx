import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';


interface SessionUser {
  employeeName?: string;
  role?: number | string;
  emailId?: string;
}

const Layout: React.FC = () => {
  const [user, setUser] = useState<SessionUser>({ employeeName: 'User Name', role: 2 });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch('/api/session/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        setUser({ employeeName: 'User Name', role: 2 });
      });
  }, []);

  const role = String(user.role ?? '');
  useEffect(() => {
    if (user.employeeName !== 'User Name') {
      if (role === '3') {
        if (!['/approver', '/home', '/templates'].includes(location.pathname)) {
          navigate('/approver');
        }
      } else if (role === '2') {
        if (location.pathname === '/approver') {
          navigate('/home');
        }
      } else {
        if (['/approver', '/admin-report', '/user-management', '/freeze-dates'].includes(location.pathname)) {
          navigate('/home');
        }
      }
    }
  }, [user, location.pathname, navigate, role]);

  const logout = async () => {
    try {
      await fetch('/api/logout/', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      navigate('/');
    }
  };

  const isAdmin = role === '2';

  return (
    <div className="w-screen h-screen d-flex payroll-shell">
      <aside className="mainAside">
        <div className="h-auto logoPart">
          <div className="logo">
            <img src="/assets/images/aside/ofs_logo.png" alt="ofs" />
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto customScrollbar optionsPart">
          <div className="w-100 h-100">
            <ul className="aside_options">
              <li>
                <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  <img src="/assets/images/aside/home.png" alt="" />
                  <p>Home</p>
                </NavLink>
              </li>
              <li>
                <NavLink to="/templates" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  <img src="/assets/images/aside/templates.png" alt="" />
                  <p>Templates</p>
                </NavLink>
              </li>
              {(() => {
                const isApprover = role === '3';
                if (isApprover) {
                  return (
                    <li>
                      <NavLink to="/approver" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                        <img src="/assets/images/aside/managers.png" alt="" />
                        <p>
                          Approver/ <br /> Managers
                        </p>
                      </NavLink>
                    </li>
                  );
                }
                if (isAdmin) {
                  return (
                    <>
                      <li>
                        <NavLink to="/admin-report" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                          <img src="/assets/images/aside/managers.png" alt="" />
                          <p>
                            Spoc/ <br /> Managers
                          </p>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/user-management" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                          <img src="/assets/images/aside/managers.png" alt="" />
                          <p>
                            User/ <br /> Management
                          </p>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/freeze-dates" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                          <img src="/assets/images/aside/templates.png" alt="" />
                          <p>Freeze Dates</p>
                        </NavLink>
                      </li>
                    </>
                  );
                }
                return null;
              })()}
            </ul>

            <ul className="profileOptions">
              <li>
                <a target="_blank" href="/assets/docs/sample.pdf" style={{ fontSize: '14px' }} rel="noreferrer">
                  <img src="/assets/images/aside/requests.png" alt="" />
                  <p>faq</p>
                </a>
              </li>
              <li>
                <button className="sidebar-button" type="button" onClick={logout} style={{ fontSize: '14px' }}>
                  <img src="/assets/images/aside/settings.png" alt="" />
                  <p>Logout</p>
                </button>
              </li>
              <li>
                <img src="/assets/images/aside/notify_with_red.png" alt="notification" />
              </li>
            </ul>
          </div>
        </div>

        <div className="h-auto profilePart">
          <img src="/assets/images/aside/managers.png" alt="user" />
          <p>{user.employeeName || 'User Name'}</p>
        </div>
      </aside>

      <main className="flex-grow-1 overflow-auto customScrollbar mainContentWrapper">
        <div className="w-100 h-100 d-flex">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
