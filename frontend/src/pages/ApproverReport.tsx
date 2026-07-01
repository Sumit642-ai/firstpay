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
];

const lockedStatuses = new Set(['Approved', 'Rejected', 'Consolidated', 'Merged', 'Approver Submit', 'Approver Reject', 'Approved by Admin', 'Rejected by Admin']);

const ApproverReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('payroll');
  const [data, setData] = useState<AdminReportData>(fallbackData);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // SPOC Flags States
  const [selectedLogIdForFlags, setSelectedLogIdForFlags] = useState<number | null>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [flagsLoading, setFlagsLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [flagDecisions, setFlagDecisions] = useState<Record<number, { action: string; comment: string }>>({});

  const openFlagsModal = (logId: number) => {
    setSelectedLogIdForFlags(logId);
    setFlagsLoading(true);
    setModalOpen(true);
    fetch(`/api/upload/${logId}/flags/`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFlags(data.flags);
          const initialDecisions: Record<number, { action: string; comment: string }> = {};
          data.flags.forEach((f: any) => {
            initialDecisions[f.flagId] = {
              action: f.spocAction || 'Pending',
              comment: f.spocComment || ''
            };
          });
          setFlagDecisions(initialDecisions);
        } else {
          alert("Error: " + data.message);
        }
        setFlagsLoading(false);
      })
      .catch(() => {
        alert("Failed to fetch flags.");
        setFlagsLoading(false);
      });
  };

  const handleDecisionChange = (flagId: number, action: string, comment: string) => {
    setFlagDecisions(prev => ({
      ...prev,
      [flagId]: { action, comment }
    }));
  };

  const submitDecisions = async () => {
    if (!selectedLogIdForFlags) return;
    const payload = {
      decisions: Object.entries(flagDecisions).map(([flagId, val]) => ({
        flagId: parseInt(flagId),
        action: val.action,
        comment: val.comment
      }))
    };

    try {
      const response = await fetch(`/api/upload/${selectedLogIdForFlags}/flags/decide/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        alert("Flag decisions saved and Excel files updated successfully.");
        setModalOpen(false);
        fetchReport();
      } else {
        alert("Error: " + data.message);
      }
    } catch {
      alert("Failed to submit flag decisions.");
    }
  };

  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const fetchReport = () => {
    fetch('/api/admin-report/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success && payload.data) {
          setData(payload.data);
          setSelectedIds(new Set());
          setCurrentPage(1);
        }
      })
      .catch(() => {
        setData(fallbackData);
        setSelectedIds(new Set());
        setCurrentPage(1);
      });
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleAction = async (action: 'approve' | 'reject' | 'consolidate') => {
    if (selectedIds.size === 0) {
      alert('Please select at least one row.');
      return;
    }

    let comments = '';
    if (action === 'reject') {
      const reason = prompt('Please enter the reason for rejection:');
      if (!reason) {
        return; 
      }
      comments = reason;
    }

    const rowsPayload = Array.from(selectedIds).map(id => {
      return allRows.find(r => r.id === id);
    }).filter(Boolean);

    const payload = {
      action,
      rows: rowsPayload,
      comments,
      documentType: activeTab,
    };

    try {
      const response = await fetch(`/api/admin/${action}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        alert(`${action} successful for ${result.affected} records.`);
        
        const newStatus = action === 'approve' ? 'Approver Submit' : 'Approver Reject';
        setData((prev) => {
          const newData = { ...prev };
          const updatedTabRows = newData[activeTab].map(r => 
            selectedIds.has(r.id) ? { ...r, status: newStatus } : r
          );
          newData[activeTab] = updatedTabRows;
          return newData;
        });
        setSelectedIds(new Set());
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      alert(`Could not process ${action} action.`);
    }
  };

  const allRows = useMemo(() => Object.values(data).flat(), [data]);
  const activeRows = data[activeTab] ?? [];
  const totalPages = Math.ceil(activeRows.length / itemsPerPage);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeRows.slice(startIndex, startIndex + itemsPerPage);
  }, [activeRows, currentPage, itemsPerPage]);

  const selectableRows = useMemo(() => {
    return paginatedRows.filter((row) => row.status === 'Pending / Review');
  }, [paginatedRows]);

  const allSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));

  const counts = useMemo(
    () => ({
      payroll: data.payroll.length,
      irefer: data.irefer.length,
      transport: data.transport.length,
      pending: allRows.filter((row) => row.status === 'Pending / Review').length,
      rejected: allRows.filter((row) => row.status === 'Approver Reject' || row.status === 'Rejected by Admin').length,
      consolidated: allRows.filter((row) => row.status === 'Consolidated' || row.status === 'Merged').length,
      approved: allRows.filter((row) => row.status === 'Approver Submit' || row.status === 'Approved by Admin').length,
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



        <div className="payroll-tabs-card admin-tabs-card">
          <ul className="nav nav-tabs" role="tablist">
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

          <div className="tab-content payroll-tab-content">
            <div className="admin-action-bar">
              <button type="button" onClick={() => handleAction('approve')}>Approve</button>
              <button type="button" onClick={() => handleAction('reject')}>Reject</button>
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
                    <th>Action Replace</th>
                    <th>Validation Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => {
                    const isLocked = row.status !== 'Pending / Review';
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
                        <td>
                          <div className="replace-actions">
                            <button disabled={isLocked} title="replace template" type="button">
                              <img src="/assets/images/icons/templateicon.png" alt="" />
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-warning btn-sm"
                            style={{ 
                              padding: '4px 10px', 
                              fontSize: '12px', 
                              fontWeight: '600',
                              backgroundColor: '#ff8a00', 
                              color: '#ffffff',
                              border: 'none', 
                              borderRadius: '4px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => openFlagsModal(row.id)}
                          >
                            Review Flags
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {activeRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty-table-cell">
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
      </div>

      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff', width: '85%', maxHeight: '85%',
            borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                SPOC Validation Review - Request #{selectedLogIdForFlags}
              </h2>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px' }}>
              {flagsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p style={{ fontSize: '15px' }}>Loading validation flags...</p>
                </div>
              ) : flags.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px dashed #d1d5db' }}>
                  <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>No validation flags found for this upload.</p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#9ca3af' }}>All backend business logic and duplicate checks passed successfully.</p>
                </div>
              ) : (
                <table className="table table-bordered table-striped" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '10px 12px' }}>Sheet Name</th>
                      <th style={{ padding: '10px 12px' }}>Row</th>
                      <th style={{ padding: '10px 12px' }}>Employee ID</th>
                      <th style={{ padding: '10px 12px' }}>Name</th>
                      <th style={{ padding: '10px 12px' }}>Payout Type</th>
                      <th style={{ padding: '10px 12px' }}>Month</th>
                      <th style={{ padding: '10px 12px' }}>Amount</th>
                      <th style={{ padding: '10px 12px' }}>Validation Alert</th>
                      <th style={{ padding: '10px 12px' }}>SPOC Action</th>
                      <th style={{ padding: '10px 12px' }}>SPOC Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flags.map((f) => {
                      const dec = flagDecisions[f.flagId] || { action: 'Pending', comment: '' };
                      return (
                        <tr key={f.flagId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '500' }}>{f.sheetName}</td>
                          <td style={{ padding: '10px 12px' }}>{f.rowIndex}</td>
                          <td style={{ padding: '10px 12px' }}>{f.empNo}</td>
                          <td style={{ padding: '10px 12px' }}>{f.empName}</td>
                          <td style={{ padding: '10px 12px' }}>{f.payoutType}</td>
                          <td style={{ padding: '10px 12px' }}>{f.payoutMonth}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '500' }}>${f.amount.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', color: '#dc2626', fontSize: '12px', lineHeight: '1.4' }}>{f.flagMessage}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <select 
                              value={dec.action} 
                              onChange={(e) => handleDecisionChange(f.flagId, e.target.value, dec.comment)}
                              style={{ 
                                padding: '6px', 
                                borderRadius: '4px', 
                                border: '1px solid #d1d5db',
                                backgroundColor: dec.action === 'Accepted' ? '#fee2e2' : dec.action === 'Declined' ? '#dcfce7' : '#fff',
                                color: dec.action === 'Accepted' ? '#991b1b' : dec.action === 'Declined' ? '#166534' : '#374151',
                                fontWeight: '500',
                                width: '150px'
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Accepted">Accept (Decline Row)</option>
                              <option value="Declined">Decline (Allow Exception)</option>
                            </select>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <input 
                              type="text" 
                              value={dec.comment} 
                              placeholder="Required if decline..."
                              onChange={(e) => handleDecisionChange(f.flagId, dec.action, e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
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
              {flags.length > 0 && (
                <button 
                  type="button" 
                  onClick={submitDecisions}
                  style={{ 
                    padding: '8px 18px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    background: '#ff8a00', 
                    color: '#fff', 
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Submit Decisions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ApproverReport;
