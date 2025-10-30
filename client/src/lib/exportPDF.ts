import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function exportToPDF(data: CashData) {
  const doc = new jsPDF();
  
  // Configuration des polices et styles
  doc.setFont('helvetica');
  
  // En-tête : PV D'ARRETER DE CAISSE : [date]
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const title = `PV D'ARRETER DE CAISSE : ${data.date}`;
  const titleWidth = doc.getTextWidth(title);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, (pageWidth - titleWidth) / 2, 15);
  
  let yPos = 25;
  
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
  
  // Section 1: Billets (caisse + coffre combinés)
  const billsRows: any[] = [];
  const denominationOrder = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.01];
  
  let totalCash = 0;
  denominationOrder.forEach(denom => {
    const count = allDenominations[denom.toString()] || 0;
    const amount = count * denom;
    totalCash += amount;
    billsRows.push([
      denom.toString().replace('.', ','),
      count.toString(),
      amount.toFixed(2).replace('.', ',')
    ]);
  });
  
  // Ajouter la ligne Total
  billsRows.push([
    { content: 'Total', colSpan: 2, styles: { fontStyle: 'bold' } },
    { content: totalCash.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } }
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Billets', 'NBB', 'caisse-et-coffre-Agence']],
    body: billsRows,
    theme: 'grid',
    styles: { fontSize: 9, halign: 'right' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'right' }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 2: Opérations
  const operationsRows: any[] = [];
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
    
    operationsRows.push([
      op.name,
      count.toString(),
      amount.toFixed(2).replace('.', ',')
    ]);
  });
  
  // Ajouter la ligne TOTAL
  operationsRows.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    { content: totalOperationsCount.toString(), styles: { fontStyle: 'bold' } },
    { content: totalOperationsAmount.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } }
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Opérations', 'NOMBRE', 'MONTANT']],
    body: operationsRows,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 3: Soldes et Transactions
  const soldeRows: any[] = [];
  
  // Solde départ
  soldeRows.push([
    { content: 'Solde départ', colSpan: 2, styles: { fontStyle: 'bold' } },
    { content: data.soldeDepart.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } }
  ]);
  
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
  
  // Versement banque
  soldeRows.push([
    'Versement banque',
    versementCount.toString(),
    totalVersements.toFixed(2).replace('.', ',')
  ]);
  
  // Retrait banque
  soldeRows.push([
    'Retrait banque',
    retraitCount.toString(),
    totalRetraits.toFixed(2).replace('.', ',')
  ]);
  
  // Versement STE (placeholder - pas encore implémenté dans les données)
  soldeRows.push(['Versement STE', '', '']);
  
  // Retrait confrère STE (placeholder)
  soldeRows.push(['Retrait confrére STE', '', '']);
  
  // Solde final = Solde départ + Opérations + Versements - Retraits
  const soldeFinal = data.soldeDepart + totalOperationsAmount + totalVersements - totalRetraits;
  soldeRows.push([
    { content: 'Solde final', colSpan: 2, styles: { fontStyle: 'bold' } },
    { content: soldeFinal.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } }
  ]);
  
  // Ecart de la caisse
  const ecart = totalCash - soldeFinal;
  soldeRows.push([
    { content: 'Ecart de la caisse', styles: { fontStyle: 'bold' } },
    { content: totalOperationsCount.toString(), styles: { fontStyle: 'bold' } },
    { content: ecart.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } }
  ]);
  
  autoTable(doc, {
    startY: yPos,
    body: soldeRows,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 50 }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Section 4: Signatures
  const signaturesRows = [
    ['Responsable-Agence', 'Charge-de-client-1', 'Charge-de-client-2'],
    [data.userName || '___', '___', '___']
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: signaturesRows,
    theme: 'grid',
    styles: { fontSize: 9, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 5: Détail caisse/coffre
  // Note: Pour l'instant, on affiche tout dans "caisse", mais cette logique peut être affinée
  const detailRows: any[] = [];
  let totalCaisseDetail = 0;
  let totalCoffreDetail = 0;
  
  denominationOrder.forEach(denom => {
    const count = allDenominations[denom.toString()] || 0;
    const amount = count * denom;
    
    // Pour simplifier, on met tout dans la caisse pour le moment
    // Dans une version future, on pourrait avoir une distinction caisse/coffre
    detailRows.push([
      denom.toString().replace('.', ','),
      amount > 0 ? amount.toFixed(2).replace('.', ',') : '',
      ''
    ]);
    
    totalCaisseDetail += amount;
  });
  
  detailRows.push([
    { content: 'Total', styles: { fontStyle: 'bold' } },
    { content: totalCaisseDetail.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } },
    { content: totalCoffreDetail.toFixed(2).replace('.', ','), styles: { fontStyle: 'bold' } }
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Billets', 'caisse', 'coffre']],
    body: detailRows,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 },
      1: { halign: 'right', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 40 }
    }
  });
  
  // Télécharger le PDF
  doc.save(`PV_${data.date}.pdf`);
}
