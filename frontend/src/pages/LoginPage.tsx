import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/backgroundImage.jpg';
import firstPayTracker from '../assets/FirstPayTracker.png';
import fslLogo from '../assets/fsl-logo.jpg';

const domains = [
  { value: '0', label: 'Select Domain' },
  { value: 'ASG', label: 'ASG' },
  { value: 'Cadomain', label: 'Cadomain' },
  { value: 'EVEREST', label: 'Everest' },
  { value: 'Medassistgroup', label: 'Medassistgroup' },
  { value: 'Medplans', label: 'Medplans' },
  { value: 'MLD.Cadomain.Local', label: 'MLD.Cadomain.Local' },
  { value: 'TKGCorp', label: 'TKGCorp' },
  { value: 'to.ccrs.com', label: 'to.ccrs.com' },
];

const initialForm = {
  domainName: '0',
  domainId: '',
  password: '',
};

export default function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const updateField = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setStatus('');
  };

  const resetForm = () => {
    setForm(initialForm);
    setError('');
    setStatus('');
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Login Failure, Did you forget or misspell your ID or password?');
        return;
      }

      if (data.user?.redirectUrl) {
        navigate(data.user.redirectUrl);
        return;
      }

      setStatus(data.message || 'Login successful.');
    } catch {
      setError('Unable to reach the login service. Please start the Django backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="wrappermaster">
      <div className="leftblock" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="rightblock" style={{ zIndex: 9999, background: '#000000' }} />

      <div className="login_wrapper" aria-label="PayTracker login">
        <table style={{ width: '100%', height: '100%', minHeight: '100%', maxHeight: '100%' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', height: '10%', minHeight: '10%', maxHeight: '10%' }}>
                <h1 className="logounitfsl" style={{ textAlign: 'center' }}>
                  <img
                    src={fslLogo}
                    style={{ height: '75px' }}
                    title="Firstsource Solutions Ltd"
                    alt="Firstsource Solutions Ltd"
                  />
                </h1>
              </td>
            </tr>

            <tr>
              <td style={{ verticalAlign: 'top', height: '50%', minHeight: '50%', maxHeight: '50%', paddingTop: '20px' }}>
                <form onSubmit={submitLogin}>
                  <table style={{ width: '100%', height: '100%' }}>
                    <tbody>
                      <tr>
                        <td>
                          <span style={{ padding: '4px 0', display: 'block' }} />
                          <div className="form-group">
                            <select
                              className="form-control"
                              name="domainName"
                              value={form.domainName}
                              onChange={updateField}
                              aria-label="Domain name"
                            >
                              {domains.map((domain) => (
                                <option key={domain.label} value={domain.value}>
                                  {domain.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <span style={{ padding: '4px 0', display: 'block' }} />
                          <div className="form-group">
                            <input
                              type="text"
                              placeholder="Login Id"
                              className="form-control"
                              name="domainId"
                              value={form.domainId}
                              onChange={updateField}
                            />
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <span style={{ padding: '4px 0', display: 'block' }} />
                          <div className="form-group">
                            <input
                              type="password"
                              placeholder="Password"
                              name="password"
                              className="form-control"
                              value={form.password}
                              onChange={updateField}
                            />
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <div className="form-group" style={{ marginTop: '20px' }}>
                            <table style={{ width: '100%' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '65%' }}>
                                    <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                                      {isSubmitting ? 'Signing in...' : 'Sign me in'}
                                    </button>
                                  </td>
                                  <td style={{ width: '1%' }} />
                                  <td>
                                    <button className="btn btn-primary loginbtn" type="button" onClick={resetForm}>
                                      Reset
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {error && (
                            <div className="text-danger" role="alert">
                              <label>{error}</label>
                            </div>
                          )}
                          {status && (
                            <div className="text-success" role="status">
                              <label>{status}</label>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </form>
              </td>
            </tr>

            <tr>
              <td align="left" style={{ verticalAlign: 'middle', height: '20%' }}>
                <div className="form-group">
                  <img src={firstPayTracker} width="100%" height="80px" alt="First PayTracker" />
                </div>
                <div className="logounit" style={{ textAlign: 'center' }}>
                  <img src="" title="" alt="" />
                </div>
              </td>
            </tr>

            <tr>
              <td style={{ verticalAlign: 'top', height: '10%' }}>
                <div className="form-group error" />
              </td>
            </tr>

            <tr>
              <td align="center" style={{ verticalAlign: 'bottom' }}>
                <p style={{ fontSize: '12px' }}>&copy; Copyright 2021 Firstsource Solutions Ltd., All rights reserved.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
