import ExcelJS from 'exceljs';

interface CashData {
  date: string;
  billsData: string;
  coinsData: string;
  operationsData: string;
  transactionsData: string;
  soldeDepart: number;
  userName?: string;
  agencyName?: string;
}

interface OperationData {
  id: string;
  name: string;
  number: number;
  amount: number;
  type?: string;
}

interface TransactionData {
  id: string;
  type: string;
  label: string;
  amount: number;
  description?: string;
}

export async function exportToExcel(data: CashData) {
  // Parse des données
  const billsArray: any[] = data.billsData ? JSON.parse(data.billsData) : [];
  const coinsArray: any[] = data.coinsData ? JSON.parse(data.coinsData) : [];
  const operations: OperationData[] = data.operationsData ? JSON.parse(data.operationsData) : [];
  const transactions: TransactionData[] = data.transactionsData ? JSON.parse(data.transactionsData) : [];
  
  // Combine bills and coins into a map by denomination
  const allItems = [...billsArray, ...coinsArray];
  const denominationMap = new Map();
  allItems.forEach(item => {
    denominationMap.set(item.value, item);
  });
  
  const denominationOrder = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.01];
  
  // Créer le workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('PV de Caisse');
  
  // Définir les largeurs de colonnes
  worksheet.columns = [
    { width: 35 },
    { width: 15 },
    { width: 25 }
  ];
  
  let currentRow = 1;
  
  // ===== EN-TÊTE PRINCIPAL =====
  const titleRow = worksheet.getRow(currentRow);
  titleRow.getCell(1).value = `PV D'ARRÊTÉ DE CAISSE : ${data.date}`;
  worksheet.mergeCells(currentRow, 1, currentRow, 3);
  titleRow.getCell(1).style = {
    font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }, // Slate-800
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  titleRow.height = 25;
  currentRow += 2;
  
  // ===== SECTION 1: BILLETS =====
  // En-tête
  const billsHeaderRow = worksheet.getRow(currentRow);
  billsHeaderRow.values = ['Billets', 'NBB', 'caisse-et-coffre-Agence'];
  billsHeaderRow.eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }, // Blue-900
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  });
  currentRow++;
  
  // Données billets
  let totalCash = 0;
  denominationOrder.forEach((denom, index) => {
    const item = denominationMap.get(denom);
    const caisseAmount = item?.caisseAmount || 0;
    const coffreAmount = item?.coffreAmount || 0;
    const totalAmount = caisseAmount + coffreAmount;
    const count = totalAmount > 0 ? Math.round(totalAmount / denom) : 0;
    
    totalCash += totalAmount;
    
    const row = worksheet.getRow(currentRow);
    row.values = [denom, count, totalAmount];
    
    // Style alterné
    const fillColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF'; // Slate-50 / White
    row.eachCell((cell, colNumber) => {
      cell.style = {
        font: { size: 10, bold: colNumber === 1 || colNumber === 3 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        alignment: { horizontal: colNumber === 1 ? 'center' : colNumber === 2 ? 'center' : 'right', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        },
        numFmt: colNumber === 3 ? '#,##0.00' : undefined
      };
    });
    currentRow++;
  });
  
  // Total billets
  const billsTotalRow = worksheet.getRow(currentRow);
  billsTotalRow.values = ['Total', '', totalCash];
  billsTotalRow.eachCell((cell, colNumber) => {
    cell.style = {
      font: { bold: true, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }, // Slate-100
      alignment: { horizontal: colNumber === 3 ? 'right' : 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      },
      numFmt: colNumber === 3 ? '#,##0.00' : undefined
    };
  });
  currentRow += 2;
  
  // ===== SECTION 2: OPÉRATIONS =====
  const opsHeaderRow = worksheet.getRow(currentRow);
  opsHeaderRow.values = ['Opérations', 'NOMBRE', 'MONTANT'];
  opsHeaderRow.eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  });
  currentRow++;
  
  let totalOperationsCount = 0;
  let totalOperationsAmount = 0;
  
  operations.forEach((op, index) => {
    const count = op.number || 0;
    const amount = op.amount || 0;
    totalOperationsCount += count;
    
    if (op.type === 'IN') {
      totalOperationsAmount += amount;
    } else if (op.type === 'OUT') {
      totalOperationsAmount -= amount;
    }
    
    const row = worksheet.getRow(currentRow);
    row.values = [op.name, count, amount];
    
    const fillColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
    row.eachCell((cell, colNumber) => {
      cell.style = {
        font: { size: 10, bold: colNumber === 3 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        alignment: { horizontal: colNumber === 1 ? 'left' : colNumber === 2 ? 'center' : 'right', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        },
        numFmt: colNumber === 3 ? '#,##0.00' : undefined
      };
    });
    currentRow++;
  });
  
  // Total opérations
  const opsTotalRow = worksheet.getRow(currentRow);
  opsTotalRow.values = ['TOTAL', totalOperationsCount, totalOperationsAmount];
  opsTotalRow.eachCell((cell, colNumber) => {
    cell.style = {
      font: { bold: true, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
      alignment: { horizontal: colNumber === 1 ? 'left' : colNumber === 2 ? 'center' : 'right', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      },
      numFmt: colNumber === 3 ? '#,##0.00' : undefined
    };
  });
  currentRow += 2;
  
  // ===== SECTION 3: SOLDES ET TRANSACTIONS =====
  let totalVersements = 0;
  let versementCount = 0;
  let totalRetraits = 0;
  let retraitCount = 0;
  
  transactions.forEach(trans => {
    if (trans.type === 'versement') {
      totalVersements += trans.amount || 0;
      versementCount++;
    } else if (trans.type === 'retrait') {
      totalRetraits += trans.amount || 0;
      retraitCount++;
    }
  });
  
  const soldeFinal = data.soldeDepart + totalOperationsAmount + totalVersements - totalRetraits;
  const ecart = totalCash - soldeFinal;
  
  const soldeData = [
    { label: 'Solde départ', count: '', value: data.soldeDepart, important: true },
    { label: 'Versement banque', count: versementCount, value: totalVersements, important: false },
    { label: 'Retrait banque', count: retraitCount, value: totalRetraits, important: false },
    { label: 'Versement STE', count: '', value: '', important: false },
    { label: 'Retrait confrére STE', count: '', value: '', important: false },
    { label: 'Solde final', count: '', value: soldeFinal, important: true },
    { label: 'Ecart de la caisse', count: totalOperationsCount, value: ecart, important: true }
  ];
  
  soldeData.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    row.values = [item.label, item.count, item.value];
    
    const fillColor = item.important ? 'FFF1F5F9' : (index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF');
    row.eachCell((cell, colNumber) => {
      cell.style = {
        font: { size: 10, bold: item.important },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        alignment: { horizontal: colNumber === 1 ? 'left' : colNumber === 2 ? 'center' : 'right', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        },
        numFmt: colNumber === 3 && typeof item.value === 'number' ? '#,##0.00' : undefined
      };
    });
    currentRow++;
  });
  
  currentRow++;
  
  // ===== SECTION 4: SIGNATURES =====
  const sigHeaderRow = worksheet.getRow(currentRow);
  sigHeaderRow.values = ['Responsable-Agence', 'Chargé-de-client-1', 'Chargé-de-client-2'];
  sigHeaderRow.eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }, // Slate-200
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  });
  currentRow++;
  
  const sigDataRow = worksheet.getRow(currentRow);
  sigDataRow.values = [data.userName || '___', '___', '___'];
  sigDataRow.eachCell((cell) => {
    cell.style = {
      font: { size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  });
  sigDataRow.height = 25;
  currentRow += 2;
  
  // ===== SECTION 5: DÉTAIL CAISSE/COFFRE =====
  const detailHeaderRow = worksheet.getRow(currentRow);
  detailHeaderRow.values = ['Billets', 'caisse', 'coffre'];
  detailHeaderRow.eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  });
  currentRow++;
  
  let totalCaisseDetail = 0;
  let totalCoffreDetail = 0;
  
  denominationOrder.forEach((denom, index) => {
    const item = denominationMap.get(denom);
    const caisseAmount = item?.caisseAmount || 0;
    const coffreAmount = item?.coffreAmount || 0;
    
    totalCaisseDetail += caisseAmount;
    totalCoffreDetail += coffreAmount;
    
    const row = worksheet.getRow(currentRow);
    row.values = [denom, caisseAmount > 0 ? caisseAmount : '', coffreAmount > 0 ? coffreAmount : ''];
    
    const fillColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
    row.eachCell((cell, colNumber) => {
      cell.style = {
        font: { size: 10, bold: colNumber === 1 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        alignment: { horizontal: colNumber === 1 ? 'center' : 'right', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        },
        numFmt: colNumber > 1 ? '#,##0.00' : undefined
      };
    });
    currentRow++;
  });
  
  // Total détail
  const detailTotalRow = worksheet.getRow(currentRow);
  detailTotalRow.values = ['Total', totalCaisseDetail, totalCoffreDetail];
  detailTotalRow.eachCell((cell, colNumber) => {
    cell.style = {
      font: { bold: true, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
      alignment: { horizontal: colNumber === 1 ? 'center' : 'right', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      },
      numFmt: colNumber > 1 ? '#,##0.00' : undefined
    };
  });
  
  // Télécharger le fichier
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PV_${data.date}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
