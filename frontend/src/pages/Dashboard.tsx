import React, { useMemo, useRef, useState } from 'react';

type UploadTab = 'payroll' | 'irefer' | 'transport';

interface UploadTabConfig {
  id: UploadTab;
  label: string;
  documentType: string;
  acceptedExtensions: string;
  processes: string[];
}

interface UploadState {
  file: File | null;
  approver: string;
  process: string;
  message: string;
}

interface UploadRow {
  id: number;
  documentType: string;
  uploadedDate: string;
  status: string;
  remarks: string;
  templateUrl: string;
  emailUrl: string;
}

const tabs: UploadTabConfig[] = [
  {
    id: 'payroll',
    label: 'Payroll',
    documentType: 'Payroll',
    acceptedExtensions: '.xls,.xlsx',
    processes: ['Monthly Payroll', 'Arrears', 'Incentives', 'Other Allowances'],
  },
  {
    id: 'irefer',
    label: 'I Refer',
    documentType: 'IRefer',
    acceptedExtensions: '.xls,.xlsx',
    processes: ['Referral Payout', 'Referral Arrears', 'Candidate Correction'],
  },
  {
    id: 'transport',
    label: 'Transport',
    documentType: 'Transport Deduction',
    acceptedExtensions: '.xls,.xlsx',
    processes: ['Transport Deduction', 'VP Arrears', 'Monthly Recovery'],
  },
];

const tableData: Record<UploadTab, UploadRow[]> = {
  payroll: [
    {
      id: 1,
      documentType: 'Payroll',
      uploadedDate: '29/06/2025 - 05:08',
      status: 'Uploaded',
      remarks: 'Ready for validation',
      templateUrl: '#',
      emailUrl: '#',
    },
    {
      id: 2,
      documentType: 'Payroll',
      uploadedDate: '30/06/2025 - 10:30',
      status: 'Under Review',
      remarks: 'Pending manager review',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
  irefer: [
    {
      id: 3,
      documentType: 'IRefer',
      uploadedDate: '30/06/2025 - 11:20',
      status: 'Under Review',
      remarks: 'Pending validation',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
  transport: [
    {
      id: 4,
      documentType: 'TransportDeduction',
      uploadedDate: '01/07/2025 - 09:45',
      status: 'Uploaded',
      remarks: 'Processed',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
};

const approvers = [
  { value: 'spoc-manager', label: 'SPOC Manager' },
  { value: 'payroll-approver', label: 'Payroll Approver' },
  { value: 'finance-controller', label: 'Finance Controller' },
  { value: 'hr-operations', label: 'HR Operations' },
];

const initialUploadState: UploadState = {
  file: null,
  approver: '',
  process: '',
  message: '',
};

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UploadTab>('payroll');
  const [step, setStep] = useState<1 | 2>(1);
  const [uploads, setUploads] = useState<Record<UploadTab, UploadState>>({
    payroll: initialUploadState,
    irefer: initialUploadState,
    transport: initialUploadState,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConfig = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);
  const activeUpload = uploads[activeTab];
  const rows = tableData[activeTab] ?? [];

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
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateActiveUpload({
      file: event.target.files?.[0] ?? null,
      message: '',
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    updateActiveUpload({
      file: event.dataTransfer.files?.[0] ?? null,
      message: '',
    });
  };

  const goNext = () => {
    if (!activeUpload.file) {
      updateActiveUpload({ message: 'Please select a file upload path before continuing.' });
      return;
    }
    setStep(2);
  };

  const submitUpload = () => {
    if (!activeUpload.approver) {
      updateActiveUpload({ message: 'Approver List is mandatory.' });
      return;
    }
    updateActiveUpload({
      message: `${activeConfig.documentType} request is ready for ${activeUpload.approver}.`,
    });
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
            <ul className="nav nav-tabs" role="tablist" aria-label="Upload document type">
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
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr className="trChkTickData" key={row.id}>
                        <td>{row.documentType}</td>
                        <td>{row.uploadedDate}</td>
                        <td>
                          <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <img src="/Content/images/comments2.jpg" title={row.remarks} alt="Comments" className="comment-trigger" />
                        </td>
                        <td className="tdChkTickData">
                          <a download href={row.templateUrl} className="downloadBtn">
                            <img src="/assets/images/templates/download_orange.png" className="dload" alt="" />
                            <span>Download</span>
                          </a>
                        </td>
                        <td className="tdChkTickData">
                          <a download href={row.emailUrl} className="downloadBtn">
                            <img src="/assets/images/templates/download_orange.png" className="dload" alt="" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          No uploads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="home-upload-section" aria-label="Upload section">
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
                      <strong>Choose a file</strong> or drag and drop it here.
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

                  <div className="upload-selected-file">
                    <span>File Upload Path</span>
                    <strong>{activeUpload.file?.name || 'No file chosen.'}</strong>
                  </div>
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
                        {approvers.map((approver) => (
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
                <button className="orange-btn" type="button" onClick={goNext}>
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
    </section>
  );
};

export default Dashboard;
