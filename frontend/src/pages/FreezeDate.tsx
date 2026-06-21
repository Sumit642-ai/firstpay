import React, { FormEvent, useEffect, useState } from 'react';

interface FreezeIntervalPayload {
  startDate: string;
  endDate: string;
  isCurrentDateInRange: boolean;
  isUploadScreenFreezed: boolean;
  summaryClassName: string;
  statusText: string;
}

const emptyInterval: FreezeIntervalPayload = {
  startDate: '',
  endDate: '',
  isCurrentDateInRange: false,
  isUploadScreenFreezed: false,
  summaryClassName: 'divSummaryFreezeDate bg-danger text-white',
  statusText: '(Upload-Screen Not Freeze.)',
};

const FreezeDate: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interval, setInterval] = useState<FreezeIntervalPayload>(emptyInterval);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadInterval = () => {
    fetch('/api/freeze-interval/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((payload) => {
        if (payload?.success) {
          setInterval(payload.data || emptyInterval);
        }
      })
      .catch(() => {
        setInterval(emptyInterval);
      });
  };

  useEffect(() => {
    loadInterval();
  }, []);

  const submitInterval = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/freeze-interval/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ startDate, endDate }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.endDate?.[0] || payload.startDate?.[0] || payload.detail || 'Unable to save freeze interval.');
      }

      setInterval(payload.data || emptyInterval);
      setMessage('Freeze interval saved successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save freeze interval.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="step1" className="upload-step inputContainer">
      <style>
        {`
          .divSummaryFreezeDate {
            text-align: center;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            transition: box-shadow 0.3s ease;
            width:100%;
          }

          .divSummaryFreezeDate:hover {
            box-shadow: 0 0 30px rgba(0, 123, 255, 0.7);
          }
        `}
      </style>
      <div className="w-screen h-screen d-flex">
        <main className="flex-grow-1 overflow-auto customScrollbar mainContentWrapper">
          <div className="w-100 h-100 d-flex">
            <section className="h-100 documentsTableSection pull-left">
              <div className="h-100 d-flex flex-column">
                <div className="h-auto header">
                  <div className="left">
                    <h2 className="mainHeading">FirstPay Automation</h2>
                    <p className="subHeading">Freeze Date Range Selection</p>
                  </div>
                </div>

                <div className="h-auto detailContainer">
                  <div className="detailsWrapper">
                    <div className="left">
                      <form onSubmit={submitInterval}>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="form-group">
                              <label htmlFor="startDate">Start</label>
                              <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                className="form-control"
                                required
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="form-group">
                              <label htmlFor="endDate">End</label>
                              <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                className="form-control"
                                required
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-3 d-flex align-items-end">
                            <div className="col-md-3">
                              <button type="submit" className="btn btn-primary mt-0" disabled={isSaving}>
                                Submit
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {message && <div className="text-danger">{message}</div>}

                  <div className="mt-4">
                    <h4 className="mb-3">Last Saved Interval by Admin:</h4>
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        {interval.startDate && interval.endDate ? (
                          <div>
                            <div className={interval.summaryClassName} style={{ textAlign: 'center' }}>
                              From : <label id="StrtDateId">{interval.startDate}</label>
                              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; To :{' '}
                              <label id="EndDateId">{interval.endDate}</label>
                              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              <label id="status">{interval.statusText}</label>
                            </div>
                          </div>
                        ) : (
                          <div className="">
                            <label>No Data available</label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FreezeDate;
