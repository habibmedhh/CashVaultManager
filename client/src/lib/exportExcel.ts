import * as XLSX from 'xlsx';

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

interface BillData {
  [key: string]: number;
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

export function exportToExcel(data: CashData) {
  // Parse des données
  const billsData: BillData = data.billsData ? JSON.parse(data.billsData) : {};
  const coinsData: BillData = data.coinsData ? JSON.parse(data.coinsData) : {};
  const operations: OperationData[] = data.operationsData ? JSON.parse(data.operationsData) : [];
  const transactions: TransactionData[] = data.transactionsData ? JSON.parse(data.transactionsData) : [];
  
  // Combine bills and coins
  const allDenominations = {
    ...billsData,
    ...coinsData
  };
  
  const denominationOrder = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.01];
  
  // Créer les données pour Excel
  const excelData: any[] = [];
  
  // En-tête
  excelData.push([`PV D'ARRETER DE CAISSE : ${data.date}`]);
  excelData.push([]);
  
  // Section 1: Billets
  excelData.push(['Billets', 'NBB', 'caisse-et-coffre-Agence']);
  
  let totalCash = 0;
  denominationOrder.forEach(denom => {
    const count = allDenominations[denom.toString()] || 0;
    const amount = count * denom;
    totalCash += amount;
    excelData.push([denom, count, amount]);
  });
  
  excelData.push(['Total', '', totalCash]);
  excelData.push([]);
  
  // Section 2: Opérations
  excelData.push(['Opérations', 'NOMBRE', 'MONTANT']);
  
  let totalOperationsCount = 0;
  let totalOperationsAmount = 0;
  
  operations.forEach(op => {
    const count = op.number || 0;
    const amount = op.amount || 0;
    totalOperationsCount += count;
    
    // Les opérations IN ajoutent, les OUT soustraient
    if (op.type === 'IN') {
      totalOperationsAmount += amount;
    } else if (op.type === 'OUT') {
      totalOperationsAmount -= amount;
    }
    
    excelData.push([op.name, count, amount]);
  });
  
  excelData.push(['TOTAL', totalOperationsCount, totalOperationsAmount]);
  excelData.push([]);
  
  // Section 3: Soldes et Transactions
  // Traiter les transactions
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
  
  excelData.push(['Solde départ', '', data.soldeDepart]);
  excelData.push(['Versement banque', versementCount, totalVersements]);
  excelData.push(['Retrait banque', retraitCount, totalRetraits]);
  excelData.push(['Versement STE', '', '']);
  excelData.push(['Retrait confrére STE', '', '']);
  
  const soldeFinal = data.soldeDepart + totalOperationsAmount + totalVersements - totalRetraits;
  excelData.push(['Solde final', '', soldeFinal]);
  
  const ecart = totalCash - soldeFinal;
  excelData.push(['Ecart de la caisse', totalOperationsCount, ecart]);
  excelData.push([]);
  
  // Section 4: Signatures
  excelData.push(['Responsable-Agence', 'Charge-de-client-1', 'Charge-de-client-2']);
  excelData.push([data.userName || '___', '___', '___']);
  excelData.push([]);
  
  // Section 5: Détail caisse/coffre
  excelData.push(['Billets', 'caisse', 'coffre']);
  
  let totalCaisseDetail = 0;
  let totalCoffreDetail = 0;
  
  denominationOrder.forEach(denom => {
    const count = allDenominations[denom.toString()] || 0;
    const amount = count * denom;
    
    excelData.push([
      denom,
      amount > 0 ? amount : '',
      ''
    ]);
    
    totalCaisseDetail += amount;
  });
  
  excelData.push(['Total', totalCaisseDetail, totalCoffreDetail]);
  
  // Créer le workbook et la feuille
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 25 }
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PV de Caisse');
  
  // Télécharger le fichier Excel
  XLSX.writeFile(wb, `PV_${data.date}.xlsx`);
}
