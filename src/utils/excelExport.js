/**
 * Reusable utility to export table data to an Excel-compatible CSV file.
 * Handles escaping, quotes, formatting booleans, and includes the UTF-8 BOM for MS Excel compatibility.
 */
export const exportToCSV = (data, filename, headersMap) => {
  const headers = Object.keys(headersMap);
  const headerLabels = Object.values(headersMap);
  
  const csvRows = [];
  
  // 1. Headers Row
  csvRows.push(headerLabels.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  
  // 2. Data Rows
  data.forEach(row => {
    const rowValues = headers.map(field => {
      let val = row[field];
      if (val === undefined || val === null) {
        val = '';
      }
      
      // Formatting boolean values to readable strings
      if (typeof val === 'boolean') {
        val = val ? 'True' : 'False';
      }
      
      const strVal = String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(rowValues.join(','));
  });
  
  const csvString = csvRows.join('\r\n');
  
  // Prefix UTF-8 Byte Order Mark (BOM) so Excel decodes cell values correctly (e.g. Indian Rupee symbol)
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
