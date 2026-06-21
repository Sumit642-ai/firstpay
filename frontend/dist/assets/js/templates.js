const TEMPLATES_DATA = [
    {
        id: 1,
        imgSrc: "../assets/images/templates/payroll.png",
        title: "Payroll",
        desc: "Use this official Payroll Automation Template to fill in all required employee payroll data. The downloadable format (.xls/.xlsx) includes predefined columns such as Employee ID, Name, Basic Pay, Allowances, Deductions, and Net Pay. ",
        /*fileLink: "/DownloadTemplates/PayrollPANIndia/PayrollFile.xlsx"*/
        fileLink: {
            "India": "../DownloadTemplates/PayrollPANIndia/PayrollFile.xlsx",
            "Philippines": "../DownloadTemplates/PayrollPhp/PayrollPhilippines.xlsx"
        }
    },
    {
        id: 2,
        imgSrc: "../assets/images/templates/transport.png",
        title: "Transport Deduction",
        desc: "It allows you to record and submit employee transport-related deductions for the current payroll cycle. This ensures that any commute or company transport cost recovery is accurately reflected in the final salary disbursement. ",
        fileLink: {
            "India": "../DownloadTemplates/TransportDeduction/TransportDeductionFile.xlsx"
        }
    },
    {
        id: 3,
        imgSrc: "../assets/images/templates/irefer.png",
        title: "IRefer",
        desc: "Use the standardized IRefer Template to upload referral-related information for payroll processing. This format ensures accurate capture of associate and referral details, along with the eligible payout amount. Only .xls or .xlsx formats are accepted. ocess.",
        fileLink: {
            "India": "../DownloadTemplates/IRefer/IreferFile.xlsx",
            "Philippines": "../DownloadTemplates/IRefer/IreferFile.xlsx"
        }
    },
]

//document.addEventListener('DOMContentLoaded', () => {
//    const templatesTableBody = document.querySelector('#templatesTableBody');

//    function bindTableData() {
       
//        templatesTableBody.innerHTML = "";

//        for (let index = 0; index < TEMPLATES_DATA.length; index++) {
//            const row = TEMPLATES_DATA[index];
//            templatesTableBody.innerHTML += `
//                <tr>
//                <td>
                   
//                </td>
//                <td>
//                  <div class="templateRowContent">
//                    <img src="${row.imgSrc}" alt="${row.title}">
//                    <div class="detail">
//                      <h3>${row.title}</h3>
//                      <p>${row.desc}</p>
//                    </div>
//                  </div>
//                </td>
//                <td>
//                  <a download href="${row.fileLink.India}" class="downloadBtn">
//                    <img src="../assets/images/templates/download_orange.png" alt="download">
//                    <span>Download</span>
//                  </a>
//                </td>
//              </tr>
//            `;
//        }
//    }
//    bindTableData();
//});
