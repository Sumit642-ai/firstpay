import React, { useEffect, useMemo, useRef, useState } from 'react';

type UploadTab = 'payroll' | 'irefer' | 'transport';

interface UploadTabConfig {
  id: UploadTab;
  label: string;
  documentType: string;
  acceptedExtensions: string;
  processes: string[];
}

interface ValidationItem {
  label: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

interface UploadState {
  file: File | null;
  emailFile: File | null;
  approver: string;
  process: string;
  message: string;
  validationChecklist: Record<string, ValidationItem> | null;
  isValidated: boolean;
}

interface UploadRow {
  id: number;
  documentType: string;
  uploadedDate: string;
  status: string;
  remarks: string;
  templateUrl: string;
  emailUrl: string;
  approverName?: string;
  approvalDate?: string;
}

const tabs: UploadTabConfig[] = [
  {
    id: 'payroll',
    label: 'Payroll',
    documentType: 'Payroll',
    acceptedExtensions: '.xls,.xlsx',
    processes: ['CORPORATE', 'SKY', 'COMCAST', 'AMHERST'],
  },
  {
    id: 'irefer',
    label: 'I Refer',
    documentType: 'IRefer',
    acceptedExtensions: '.xls,.xlsx',
    processes: ['CORPORATE', 'SKY', 'COMCAST', 'AMHERST'],
  },
  {
    id: 'transport',
    label: 'Transport',
    documentType: 'Transport Deduction',
    acceptedExtensions: '.xls,.xlsx',
    processes: ['CORPORATE', 'SKY', 'COMCAST', 'AMHERST'],
  },
];



const approvers = [
  { value: 'vinay.soni@firstsource.com', label: 'Vinay Soni - vinay.soni@firstsource.com' },
  { value: 'Ratheesh.Unnikrishnan@firstsource.com', label: 'Ratheesh - Ratheesh.Unnikrishnan@firstsource.com' },
  { value: 'Jebaraj.Ponniah@firstsource.com', label: 'jebaraj - Jebaraj.Ponniah@firstsource.com' },
  { value: 'Sumit.Raut@firstsource.com', label: 'Sumit - Sumit.Raut@firstsource.com' },
];

const initialUploadState: UploadState = {
  file: null,
  emailFile: null,
  approver: '',
  process: '',
  message: '',
  validationChecklist: null,
  isValidated: false,
};

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UploadTab>('payroll');
  const [isFreezed, setIsFreezed] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [uploads, setUploads] = useState<Record<UploadTab, UploadState>>({
    payroll: initialUploadState,
    irefer: initialUploadState,
    transport: initialUploadState,
  });
  const [tableData, setTableData] = useState<Record<UploadTab, UploadRow[]>>({
    payroll: [],
    irefer: [],
    transport: [],
  });
  const [autoReload, setAutoReload] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [dynamicApprovers, setDynamicApprovers] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/users/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          const fetchedApprovers = payload.data
            .filter((u: any) => String(u.Role) === '3' || u.RoleName === 'Approver')
            .map((u: any) => ({
              value: u.EmployeeEmailId,
              label: `${u.EmployeeName} - ${u.EmployeeEmailId}`
            }));
          setDynamicApprovers(fetchedApprovers);
        }
      })
      .catch((err) => console.error('Failed to fetch users list', err));
  }, []);

  // Declines summary modal states
  const [selectedLogIdForDeclines, setSelectedLogIdForDeclines] = useState<number | null>(null);
  const [declinesModalOpen, setDeclinesModalOpen] = useState<boolean>(false);
  const [declinedRows, setDeclinedRows] = useState<any[]>([]);
  const [declinesLoading, setDeclinesLoading] = useState<boolean>(false);

  const openDeclinesModal = (logId: number) => {
    setSelectedLogIdForDeclines(logId);
    setDeclinesLoading(true);
    setDeclinesModalOpen(true);
    fetch(`/api/upload/${logId}/flags/declined-summary/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDeclinedRows(data.declinedRows);
        } else {
          alert("Error: " + data.message);
        }
        setDeclinesLoading(false);
      })
      .catch(() => {
        alert("Failed to fetch declined rows.");
        setDeclinesLoading(false);
      });
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDashboardData = () => {
    fetch('/api/dashboard/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success && payload.data) {
          setTableData(payload.data);
        }
      })
      .catch((err) => console.error('Failed to fetch dashboard data', err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetch('/api/freeze-interval/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success && payload.data) {
          setIsFreezed(payload.data.isUploadScreenFreezed);
        }
      })
      .catch((err) => console.error('Failed to fetch freeze interval', err));
  }, []);

  useEffect(() => {
    if (!autoReload) return;
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [autoReload]);

  const activeConfig = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);
  const activeUpload = uploads[activeTab];
  const rows = tableData[activeTab] ?? [];

  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return rows.slice(startIndex, startIndex + itemsPerPage);
  }, [rows, currentPage, itemsPerPage]);

  const updateActiveUpload = (changes: Partial<UploadState>) => {
    setUploads((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        ...changes,
      },
    }));
  };

  const handleTabChange = (tabId: UploadTab) => {
    setActiveTab(tabId);
    setStep(1);
    setCurrentPage(1);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateActiveUpload({
      file: event.target.files?.[0] ?? null,
      validationChecklist: null,
      isValidated: false,
      message: '',
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    updateActiveUpload({
      file: event.dataTransfer.files?.[0] ?? null,
      validationChecklist: null,
      isValidated: false,
      message: '',
    });
  };

  const handleValidate = async () => {
    if (!activeUpload.file) {
      updateActiveUpload({ message: 'Please attach the template file.' });
      return;
    }
    
    updateActiveUpload({ message: 'Running validation checklist...' });
    
    const formData = new FormData();
    formData.append('templateFile', activeUpload.file);
    formData.append('documentType', activeTab);
    
    try {
      const response = await fetch('/api/validate-upload/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      updateActiveUpload({
        validationChecklist: data.checklist,
        isValidated: data.success,
        message: data.success 
          ? 'Validation checks passed successfully! Next button is now enabled.' 
          : 'Validation failed. Please correct the highlighted errors.'
      });
      if (!data.success && data.checklist) {
        const failedItems = Object.values(data.checklist)
          .filter((item: any) => item.status === 'fail')
          .map((item: any) => `${item.label}: ${item.message}`);
        if (failedItems.length > 0) {
          alert(`Excel Validation Failed:\n\n${failedItems.join('\n')}`);
        }
      }
    } catch (err) {
      updateActiveUpload({
        message: 'Could not connect to backend validation service.',
        isValidated: false
      });
    }
  };

  const goNext = () => {
    if (!activeUpload.isValidated) {
      updateActiveUpload({ message: 'Please run and pass the validation check before continuing.' });
      return;
    }
    setStep(2);
  };

  const submitUpload = async () => {
    if (!activeUpload.approver) {
      updateActiveUpload({ message: 'Approver List is mandatory.' });
      return;
    }
    const formData = new FormData();
    formData.append('templateFile', activeUpload.file!);
    formData.append('documentType', activeTab);
    formData.append('approver', activeUpload.approver);
    formData.append('process', activeUpload.process);
    
    updateActiveUpload({ message: 'Submitting request...' });

    try {
      const response = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        updateActiveUpload({
          message: 'success : Request uploaded successfully',
          file: null,
          emailFile: null,
          approver: '',
          process: '',
          validationChecklist: null,
          isValidated: false
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (emailInputRef.current) {
          emailInputRef.current.value = '';
        }
        setStep(1);
        fetchDashboardData();
        setTimeout(() => {
          updateActiveUpload({ message: '' });
        }, 3000);
      } else {
        updateActiveUpload({ message: data.message || 'Upload failed.' });
      }
    } catch (err) {
      updateActiveUpload({ message: 'Could not connect to submit service.' });
    }
  };

  return (
    <section className="h-100 dashboardSection payroll-dashboard home-dashboard">
      <div className="h-100 d-flex flex-column">
        <div className="h-auto header">
          <div className="left">
            <h2 className="mainHeading">FirstPay Automation</h2>
            <p className="subHeading">Dashboard</p>
          </div>
        </div>

        <div className="home-workspace">
          <div className="home-table-area">
            <div className="table-header-bar">
              <ul className="nav nav-tabs" role="tablist" aria-label="Upload document type" style={{ borderBottom: 'none' }}>
                {tabs.map((tab) => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="auto-reload-control">
                <span className={`pulse-indicator ${autoReload ? 'active' : ''}`}></span>
                <label>
                  <input
                    type="checkbox"
                    checked={autoReload}
                    onChange={(event) => setAutoReload(event.target.checked)}
                  />
                  Auto Refresh (10s)
                </label>
              </div>
            </div>

            <div className="tab-content payroll-tab-content home-table-content">
              <div className="table-responsive">
                <table className="table jambo_table table-striped AdminTables">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Uploaded Date</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>Template</th>
                      <th>Approver</th>
                      <th>Approved Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr className="trChkTickData" key={row.id}>
                        <td>{row.documentType}</td>
                        <td>{row.uploadedDate}</td>
                        <td>
                          <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src="/Content/images/comments2.jpg"
                              title={row.remarks}
                              alt="Comments"
                              className="comment-trigger"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (row.remarks) {
                                  alert(`Remarks:\n${row.remarks}`);
                                } else {
                                  alert("No remarks found.");
                                }
                              }}
                            />
                            {row.remarks && row.remarks.toLowerCase().includes("declined") && (
                              <button
                                type="button"
                                onClick={() => openDeclinesModal(row.id)}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#ffffff',
                                  backgroundColor: '#d9534f',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                View Declined Rows
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="tdChkTickData">
                          <a download href={row.templateUrl} className="downloadBtn">
                            <img src="/assets/images/templates/download_orange.png" className="dload" alt="" />
                            <span>Download</span>
                          </a>
                        </td>
                        <td>{row.approverName || 'N/A'}</td>
                        <td>{row.approvalDate || 'N/A'}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          No uploads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <button
                    className="pagination-btn"
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    &laquo; Prev
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    className="pagination-btn"
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Next &raquo;
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className={`home-upload-section ${isFreezed ? 'greyout' : ''}`} aria-label="Upload section">
            <div className="upload-section-header">
              <h2>Upload</h2>
              <p>{activeConfig.documentType}</p>
            </div>

            <div className="upload-stepper-part" aria-label="Upload progress">
              <div className={`upload-step ${step === 1 ? 'active' : 'complete'}`}>
                <h3>01</h3>
                <p>File Upload Path</p>
              </div>
              <div className={`upload-step ${step === 2 ? 'active' : ''}`}>
                <h3>02</h3>
                <p>Approver & Process</p>
              </div>
            </div>

            <div className="upload-panel">
              {step === 1 && (
                <div className="stepperContent active">
                  <div className="upload-field">
                    <label htmlFor="uploadDocument">Upload Document</label>
                    <select id="uploadDocument" value={activeConfig.id} onChange={(event) => handleTabChange(event.target.value as UploadTab)}>
                      {tabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>
                          {tab.documentType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="upload-field">
                    <label>1. Attach Excel Template (.xls/.xlsx) <span style={{ color: 'red' }}>*</span></label>
                    <button
                      className="inputBox upload-dropzone"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <span className="uploadIcon">
                        <img src="/assets/images/dashboard/upload.png" alt="" />
                      </span>
                      <span className="upload-dropzone-title">
                        <strong>Choose Excel Template</strong> or drag and drop it here.
                      </span>
                      <span className="upload-dropzone-help">.xls / .xlsx formats accepted only</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      className="d-none"
                      type="file"
                      accept={activeConfig.acceptedExtensions}
                      onChange={handleFileChange}
                    />

                    {activeUpload.file && (
                      <div className="upload-selected-file">
                        <span>Selected Template:</span>
                        <strong>{activeUpload.file.name}</strong>
                      </div>
                    )}
                  </div>



                  <button
                    className="validate-btn"
                    type="button"
                    disabled={!activeUpload.file}
                    onClick={handleValidate}
                  >
                    Validate Upload
                  </button>

                  {activeUpload.validationChecklist && (
                    <div className="validation-checklist">
                      <h3>Validation Checks Checklist</h3>
                      <div className="checklist-items">
                        {Object.entries(activeUpload.validationChecklist)
                          .filter(([_, val]) => val.status !== 'pass')
                          .map(([key, val]) => (
                            <div className="checklist-item" key={key}>
                              <span className={`checklist-icon ${val.status}`}>
                                {val.status === 'pass' ? '✓' : val.status === 'fail' ? '✗' : '•'}
                              </span>
                              <div className="checklist-details">
                                <span className="checklist-label">{val.label}</span>
                                <span className="checklist-msg">{val.message}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="stepperContent active">
                  <div className="upload-form-grid">
                    <div className="upload-field">
                      <label htmlFor="approverList">
                        Approver List <span>*</span>
                      </label>
                      <select
                        id="approverList"
                        value={activeUpload.approver}
                        required
                        onChange={(event) => updateActiveUpload({ approver: event.target.value, message: '' })}
                      >
                        <option value="">--Select Approver--</option>
                        {(dynamicApprovers.length > 0 ? dynamicApprovers : approvers).map((approver) => (
                          <option key={approver.value} value={approver.label}>
                            {approver.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="upload-field">
                      <label htmlFor="processList">Process List</label>
                      <select
                        id="processList"
                        value={activeUpload.process}
                        onChange={(event) => updateActiveUpload({ process: event.target.value, message: '' })}
                      >
                        <option value="">--Select Process--</option>
                        {activeConfig.processes.map((process) => (
                          <option key={process} value={process}>
                            {process}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>


 
                  <div className="upload-review">
                    <p>
                      <span>Document Type</span>
                      <strong>{activeConfig.documentType}</strong>
                    </p>
                    <p>
                      <span>File Upload Path</span>
                      <strong>{activeUpload.file?.name || 'No file chosen.'}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {activeUpload.message && <div className="upload-message">{activeUpload.message}</div>}

            <div className="upload-actions">
              <button className="secondary-btn" type="button" onClick={() => setStep(1)} disabled={step === 1}>
                Prev
              </button>
              {step === 1 ? (
                <button
                  className="orange-btn"
                  type="button"
                  onClick={goNext}
                  disabled={!activeUpload.isValidated}
                  style={!activeUpload.isValidated ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Next
                </button>
              ) : (
                <button className="orange-btn" type="button" onClick={submitUpload}>
                  Submit
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {declinesModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff', width: '80%', maxHeight: '80%',
            borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                SPOC Declined Rows Summary - Request #{selectedLogIdForDeclines}
              </h2>
              <button 
                type="button" 
                onClick={() => setDeclinesModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px' }}>
              {declinesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p style={{ fontSize: '14px' }}>Loading declined rows...</p>
                </div>
              ) : declinedRows.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No declined rows found.
                </div>
              ) : (
                <table className="table table-bordered table-striped" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '8px 10px' }}>Sheet Name</th>
                      <th style={{ padding: '8px 10px' }}>Row Index</th>
                      <th style={{ padding: '8px 10px' }}>Employee ID</th>
                      <th style={{ padding: '8px 10px' }}>Employee Name</th>
                      <th style={{ padding: '8px 10px' }}>Payout Type</th>
                      <th style={{ padding: '8px 10px' }}>Month</th>
                      <th style={{ padding: '8px 10px' }}>Amount</th>
                      <th style={{ padding: '8px 10px' }}>Decline Reason</th>
                      <th style={{ padding: '8px 10px' }}>SPOC Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {declinedRows.map((r) => (
                      <tr key={r.flagId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '500' }}>{r.sheetName}</td>
                        <td style={{ padding: '8px 10px' }}>{r.rowIndex}</td>
                        <td style={{ padding: '8px 10px' }}>{r.empNo}</td>
                        <td style={{ padding: '8px 10px' }}>{r.empName}</td>
                        <td style={{ padding: '8px 10px' }}>{r.payoutType}</td>
                        <td style={{ padding: '8px 10px' }}>{r.payoutMonth}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '500' }}>${r.amount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', color: '#dc2626' }}>{r.reason}</td>
                        <td style={{ padding: '8px 10px', fontStyle: 'italic', color: '#4b5563' }}>{r.spocComment || 'No comment provided'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setDeclinesModalOpen(false)}
                style={{ 
                  padding: '8px 18px', 
                  borderRadius: '6px', 
                  border: '1px solid #d1d5db', 
                  background: '#fff', 
                  color: '#374151',
                  fontWeight: '500',
                  cursor: 'pointer' 
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
