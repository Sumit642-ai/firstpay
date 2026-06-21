import React, { useEffect, useState } from 'react';

interface TemplateRow {
  id: number;
  imgSrc: string;
  title: string;
  desc: string;
  fileLink: Record<string, string>;
}

const fallbackTemplates: TemplateRow[] = [
  {
    id: 1,
    imgSrc: '/assets/images/templates/payroll.png',
    title: 'Payroll',
    desc: 'Use this official Payroll Automation Template to fill in all required employee payroll data. The downloadable format (.xls/.xlsx) includes predefined columns such as Employee ID, Name, Basic Pay, Allowances, Deductions, and Net Pay. ',
    fileLink: {
      India: '/DownloadTemplates/PayrollPANIndia/PayrollFile.xlsx',
      Philippines: '/DownloadTemplates/PayrollPhp/PayrollPhilippines.xlsx',
    },
  },
  {
    id: 2,
    imgSrc: '/assets/images/templates/transport.png',
    title: 'Transport Deduction',
    desc: 'It allows you to record and submit employee transport-related deductions for the current payroll cycle. This ensures that any commute or company transport cost recovery is accurately reflected in the final salary disbursement. ',
    fileLink: {
      India: '/DownloadTemplates/TransportDeduction/TransportDeductionFile.xlsx',
    },
  },
  {
    id: 3,
    imgSrc: '/assets/images/templates/irefer.png',
    title: 'IRefer',
    desc: 'Use the standardized IRefer Template to upload referral-related information for payroll processing. This format ensures accurate capture of associate and referral details, along with the eligible payout amount. Only .xls or .xlsx formats are accepted. ocess.',
    fileLink: {
      India: '/DownloadTemplates/IRefer/IreferFile.xlsx',
      Philippines: '/DownloadTemplates/IRefer/IreferFile.xlsx',
    },
  },
];

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateRow[]>(fallbackTemplates);
  const [empGeo, setEmpGeo] = useState('India');

  useEffect(() => {
    fetch('/api/templates/', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success) {
          setEmpGeo(payload.empGeo || 'India');
          setTemplates(payload.data || fallbackTemplates);
        }
      })
      .catch(() => {
        setTemplates(fallbackTemplates);
      });
  }, []);

  return (
    <div className="w-100 h-100 templatesContentSection">
      <div className="header">
        <h2 className="mainHeading">Payroll Automation</h2>
        <p className="subHeading">Templates</p>
      </div>
      <div className="templatesTableWrapper">
        <table id="tbltemplate">
          <thead>
            <tr>
              <th />
              <th>Templates</th>
              <th>
                <div className="actionBtnsWrapper" />
              </th>
            </tr>
          </thead>
          <tbody id="templatesTableBody">
            {templates.map((row) => (
              <tr className="templatesection" key={row.id}>
                <td />
                <td>
                  <div className="templateRowContent">
                    <img src={row.imgSrc} alt={row.title} />
                    <div className="detail">
                      <h3>{row.title}</h3>
                      <p>{row.desc}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <a download href={row.fileLink[empGeo] || row.fileLink.India || '#'} className="downloadBtn">
                    <img src="/assets/images/templates/download_orange.png" alt="download" />
                    <span>Download</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <input type="hidden" id="hdnSessionGeo" value={empGeo} />
      </div>
    </div>
  );
};

export default Templates;
