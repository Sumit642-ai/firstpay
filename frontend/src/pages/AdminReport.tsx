import React, { useEffect, useMemo, useState } from 'react';

type AdminTab = 'payroll' | 'irefer' | 'transport' | 'consolidated';

interface AdminUploadRow {
  id: number;
  selected?: boolean;
  userId: string;
  documentType: string;
  uploadedDate: string;
  status: string;
  remarks: string;
  templateUrl: string;
  emailUrl: string;
}

interface AdminReportData {
  payroll: AdminUploadRow[];
  irefer: AdminUploadRow[];
  transport: AdminUploadRow[];
  consolidated: AdminUploadRow[];
}

const fallbackData: AdminReportData = {
  payroll: [
    {
      id: 101,
      userId: '1038798',
      documentType: 'Payroll',
      uploadedDate: '29/06/2025 - 05:08',
      status: 'Pending',
      remarks: 'Waiting for SPOC approval',
      templateUrl: '#',
      emailUrl: '#',
    },
    {
      id: 102,
      userId: '1038812',
      documentType: 'Payroll',
      uploadedDate: '30/06/2025 - 08:18',
      status: 'Approved',
      remarks: 'Approved by manager',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
  irefer: [
    {
      id: 201,
      userId: '1038877',
      documentType: 'IRefer',
      uploadedDate: '30/06/2025 - 11:20',
      status: 'Rejected',
      remarks: 'Incorrect amount',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
  transport: [
    {
      id: 301,
      userId: '1038890',
      documentType: 'TransportDeduction',
      uploadedDate: '01/07/2025 - 09:45',
      status: 'Pending',
      remarks: 'New request',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
  consolidated: [
    {
      id: 401,
      userId: 'Admin',
      documentType: 'Payroll',
      uploadedDate: '02/07/2025 - 16:10',
      status: 'Consolidated',
      remarks: 'Monthly payroll consolidated',
      templateUrl: '#',
      emailUrl: '#',
    },
  ],
};

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'payroll', label: 'Payroll' },
  { id: 'irefer', label: 'Irefer' },
  { id: 'transport', label: 'TransportDeduction' },
  { id: 'consolidated', label: 'Consolidated' },
];

const lockedStatuses = new Set(['Approved', 'Rejected', 'Consolidated', 'Merged']);

const AdminReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('payroll');
  const [data, setData] = useState<AdminReportData>(fallbackData);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/admin-report/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success && payload.data) {
          setData(payload.data);
        }
      })
      .catch(() => {
        setData(fallbackData);
      });
  }, []);

  const allRows = useMemo(() => Object.values(data).flat(), [data]);
  const activeRows = data[activeTab] ?? [];
  const selectableRows = activeRows.filter((row) => !lockedStatuses.has(row.status));
  const allSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));

  const counts = useMemo(
    () => ({
      payroll: data.payroll.length,
      irefer: data.irefer.length,
      transport: data.transport.length,
      pending: allRows.filter((row) => row.status === 'Pending').length,
      rejected: allRows.filter((row) => row.status === 'Rejected').length,
      consolidated: allRows.filter((row) => row.status === 'Consolidated').length,
      approved: allRows.filter((row) => row.status === 'Approved').length,
    }),
    [allRows, data],
  );

  const toggleRow = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) {
        selectableRows.forEach((row) => next.delete(row.id));
      } else {
        selectableRows.forEach((row) => next.add(row.id));
      }
      return next;
    });
  };

  return (
    <section className="h-100 documentsTableSection payroll-dashboard admin-dashboard">
      <div className="h-100 d-flex flex-column">
        <div className="h-auto header">
          <div className="left">
            <h2 className="mainHeading">FirstPay Automation</h2>
            <p className="subHeading">Dashboard</p>
          </div>
        </div>

        <div className="h-auto detailContainer">
          <h2>Payroll</h2>
          <div className="detailsWrapper">
            <div className="left">
              <div className="det">
                <h3>{counts.payroll}</h3>
                <p>Payroll</p>
              </div>
              <div className="det">
                <h3>{counts.irefer}</h3>
                <p>IRefer</p>
              </div>
              <div className="det">
                <h3>{counts.transport}</h3>
                <p>Transport Deduction</p>
              </div>
            </div>
            <div className="seperator" />
            <div className="right">
              <div className="det">
                <h3>{counts.pending}</h3>
                <p>Pending</p>
              </div>
              <div className="det">
                <h3>{counts.rejected}</h3>
                <p>Rejected</p>
              </div>
              <div className="det">
                <h3>{counts.consolidated}</h3>
                <p>Consolidated</p>
              </div>
              <div className="det">
                <h3>{counts.approved}</h3>
                <p>Approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="payroll-tabs-card admin-tabs-card">
          <ul className="nav nav-tabs" role="tablist">
            {tabs.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <button
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="tab-content payroll-tab-content">
            <div className="admin-action-bar">
              <button type="button">Approve</button>
              <button type="button">Reject</button>
              <button type="button" className="consolidateBtn">
                Consolidate
              </button>
            </div>

            <div className="table-responsive">
              <table className="table jambo_table table-striped AdminTables">
                <thead>
                  <tr>
                    <th>
                      <label className="select-all-label">
                        <input checked={allSelected} type="checkbox" onChange={toggleAll} />
                        select all
                      </label>
                    </th>
                    <th>UserID</th>
                    <th>Document Type</th>
                    <th>Uploaded Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Template</th>
                    <th>Email</th>
                    <th>Action Replace</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row) => {
                    const isLocked = lockedStatuses.has(row.status);
                    return (
                      <tr className="trChkTickData" key={row.id}>
                        <td>
                          <input
                            checked={selectedIds.has(row.id)}
                            disabled={isLocked}
                            type="checkbox"
                            onChange={() => toggleRow(row.id)}
                          />
                        </td>
                        <td>{row.userId}</td>
                        <td className="doctypo">{row.documentType}</td>
                        <td>{row.uploadedDate}</td>
                        <td>
                          <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <img
                            src="/Content/images/comments2.jpg"
                            data-comm={row.remarks}
                            title={row.remarks}
                            alt="Comments"
                            className="comment-trigger"
                          />
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
                        <td>
                          <div className="replace-actions">
                            <button disabled={isLocked} title="replace template" type="button">
                              <img src="/assets/images/icons/templateicon.png" alt="" />
                            </button>
                            <button disabled={isLocked} title="replace email" type="button">
                              <img src="/assets/images/icons/emailAttachicon.png" alt="" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {activeRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-table-cell">
                        No uploads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminReport;
