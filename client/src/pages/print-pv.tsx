import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface CashItem {
  value: number;
  caisseAmount: number;
  coffreAmount: number;
  type: string;
}

interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  label: string;
  amount: number;
}

export default function PrintPV() {
  const [, setLocation] = useLocation();
  const [pvData, setPvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données du localStorage
    const data = localStorage.getItem('printPVData');
    
    console.log('[DEBUG] PrintPV - raw data from localStorage:', data);
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('[DEBUG] PrintPV - parsed data:', parsed);
        console.log('[DEBUG] PrintPV - billsData:', parsed.billsData);
        console.log('[DEBUG] PrintPV - coinsData:', parsed.coinsData);
        setPvData(parsed);
        setLoading(false);
        
        // Déclencher l'impression automatiquement après le chargement
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (error) {
        console.error('[ERROR] PrintPV - Failed to parse data:', error);
        setLocation("/");
      }
    } else {
      console.log('[DEBUG] PrintPV - NO data in localStorage');
      setLocation("/");
    }
  }, [setLocation]);

  if (loading || !pvData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const items: CashItem[] = [...pvData.billsData, ...pvData.coinsData];
  const operations: Operation[] = pvData.operationsData;
  const transactions: Transaction[] = pvData.transactionsData;

  console.log('[DEBUG] PrintPV - items constructed:', items);
  console.log('[DEBUG] PrintPV - Sample item[0]:', items[0]);
  console.log('[DEBUG] PrintPV - Sample item[0] caisseAmount:', items[0]?.caisseAmount);

  // Calculs
  const denominationOrder = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.01];
  const denominationMap = new Map<number, CashItem>();
  items.forEach(item => {
    console.log(`[DEBUG] PrintPV - Adding to map: ${item.value} MAD, caisse: ${item.caisseAmount}, coffre: ${item.coffreAmount}`);
    denominationMap.set(item.value, item);
  });

  let totalCaisse = 0;
  let totalCoffre = 0;
  let totalCash = 0;

  denominationOrder.forEach(denom => {
    const item = denominationMap.get(denom);
    if (item) {
      totalCaisse += item.caisseAmount || 0;
      totalCoffre += item.coffreAmount || 0;
      totalCash += (item.caisseAmount || 0) + (item.coffreAmount || 0);
    }
  });

  let totalOperationsAmount = 0;
  let totalOperationsCount = 0;

  operations.forEach(op => {
    totalOperationsCount += op.number || 0;
    // Logique identique à cash-register.tsx
    if (op.type === 'OUT') {
      totalOperationsAmount -= op.amount || 0;
    } else {
      // Pour tous les autres cas (IN ou undefined), on additionne le montant
      totalOperationsAmount += op.amount || 0;
    }
  });

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

  const soldeFinal = pvData.soldeDepart + totalOperationsAmount + totalVersements - totalRetraits;
  const ecart = totalCash - soldeFinal;

  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            font-size: 9pt;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 20px auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
        
        .print-container {
          font-family: 'Inter', sans-serif;
          color: #000;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 12px;
          padding: 8px;
          background: #1e293b;
          color: white;
          border-radius: 4px;
        }
        
        .print-header h1 {
          margin: 0;
          font-size: 14pt;
          font-weight: bold;
        }
        
        .print-header .subtitle {
          margin: 4px 0 0 0;
          font-size: 9pt;
          opacity: 0.9;
        }
        
        .print-section {
          margin-bottom: 10px;
        }
        
        .section-title {
          background: #1e3a8a;
          color: white;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 10pt;
          margin-bottom: 4px;
          border-radius: 2px;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          margin-bottom: 4px;
        }
        
        .print-table th {
          background: #f1f5f9;
          padding: 3px 6px;
          text-align: left;
          border: 1px solid #cbd5e1;
          font-weight: 600;
          font-size: 8pt;
        }
        
        .print-table td {
          padding: 2px 6px;
          border: 1px solid #e2e8f0;
        }
        
        .print-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .print-table .text-right {
          text-align: right;
        }
        
        .print-table .text-center {
          text-align: center;
        }
        
        .total-row {
          background: #f1f5f9 !important;
          font-weight: bold;
        }
        
        .important-row {
          background: #fef3c7 !important;
          font-weight: bold;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
          page-break-inside: avoid;
        }
        
        .signature-box {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: center;
          background: #f8fafc;
          border-radius: 4px;
        }
        
        .signature-label {
          font-weight: bold;
          font-size: 8pt;
          margin-bottom: 20px;
        }
        
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 20px;
          padding-top: 4px;
          font-size: 7pt;
        }
        
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .ecart-positive {
          color: #059669;
        }
        
        .ecart-negative {
          color: #dc2626;
        }
      `}</style>

      {/* En-tête */}
      <div className="print-header">
        <h1>PV D'ARRÊTÉ DE CAISSE</h1>
        <div className="subtitle">
          Date: {pvData.date} | Agent: {pvData.userName} | Agence: {pvData.agencyName || 'N/A'}
        </div>
      </div>

      {/* Grille à deux colonnes pour optimiser l'espace */}
      <div className="compact-grid">
        {/* Colonne gauche : Billets et Détail Caisse/Coffre */}
        <div>
          {/* Section Billets */}
          <div className="print-section">
            <div className="section-title">BILLETS ET PIÈCES</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Dénomination</th>
                  <th className="text-center">Nombre</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {denominationOrder.map(denom => {
                  const item = denominationMap.get(denom);
                  const totalAmount = (item?.caisseAmount || 0) + (item?.coffreAmount || 0);
                  const count = totalAmount > 0 ? Math.round(totalAmount / denom) : 0;
                  
                  return (
                    <tr key={denom}>
                      <td className="text-center">{denom} MAD</td>
                      <td className="text-center">{count}</td>
                      <td className="text-right">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td colSpan={2}>TOTAL</td>
                  <td className="text-right">{totalCash.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section Détail Caisse/Coffre */}
          <div className="print-section">
            <div className="section-title">DÉTAIL CAISSE / COFFRE</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Dénomination</th>
                  <th className="text-right">Caisse</th>
                  <th className="text-right">Coffre</th>
                </tr>
              </thead>
              <tbody>
                {denominationOrder.map(denom => {
                  const item = denominationMap.get(denom);
                  const caisseAmount = item?.caisseAmount || 0;
                  const coffreAmount = item?.coffreAmount || 0;
                  
                  return (
                    <tr key={denom}>
                      <td className="text-center">{denom} MAD</td>
                      <td className="text-right">{caisseAmount > 0 ? caisseAmount.toFixed(2) : '0.00'}</td>
                      <td className="text-right">{coffreAmount > 0 ? coffreAmount.toFixed(2) : '0.00'}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td>TOTAL</td>
                  <td className="text-right">{totalCaisse.toFixed(2)}</td>
                  <td className="text-right">{totalCoffre.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite : Opérations et Soldes */}
        <div>
          {/* Section Opérations */}
          <div className="print-section">
            <div className="section-title">OPÉRATIONS</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Opération</th>
                  <th className="text-center">Nombre</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {operations.map(op => (
                  <tr key={op.id}>
                    <td>{op.name}</td>
                    <td className="text-center">{op.number}</td>
                    <td className="text-right">{op.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>TOTAL</td>
                  <td className="text-center">{totalOperationsCount}</td>
                  <td className="text-right">{totalOperationsAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section Récapitulatif Caisse/Coffre */}
          <div className="print-section">
            <div className="section-title">RÉCAPITULATIF</div>
            <table className="print-table">
              <tbody>
                <tr>
                  <td>Total Caisse</td>
                  <td className="text-right font-bold">{totalCaisse.toFixed(2)} DH</td>
                </tr>
                <tr>
                  <td>Total Coffre</td>
                  <td className="text-right font-bold">{totalCoffre.toFixed(2)} DH</td>
                </tr>
                <tr className="total-row">
                  <td>Total Caisse + Coffre</td>
                  <td className="text-right">{totalCash.toFixed(2)} DH</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section Soldes et Transactions */}
          <div className="print-section">
            <div className="section-title">SOLDES ET TRANSACTIONS</div>
            <table className="print-table">
              <tbody>
                <tr className="important-row">
                  <td colSpan={2}>Solde départ</td>
                  <td className="text-right">{pvData.soldeDepart.toFixed(2)} DH</td>
                </tr>
                <tr>
                  <td>Versement banque</td>
                  <td className="text-center">({versementCount})</td>
                  <td className="text-right">{totalVersements.toFixed(2)} DH</td>
                </tr>
                <tr>
                  <td>Retrait banque</td>
                  <td className="text-center">({retraitCount})</td>
                  <td className="text-right">{totalRetraits.toFixed(2)} DH</td>
                </tr>
                <tr>
                  <td colSpan={2}>Total Opérations</td>
                  <td className="text-right">{totalOperationsAmount.toFixed(2)} DH</td>
                </tr>
                <tr className="important-row">
                  <td colSpan={2}>Solde final</td>
                  <td className="text-right">{soldeFinal.toFixed(2)} DH</td>
                </tr>
                <tr className="important-row">
                  <td colSpan={2}>Écart de la caisse</td>
                  <td className={`text-right ${ecart > 0 ? 'ecart-positive' : ecart < 0 ? 'ecart-negative' : ''}`}>
                    {ecart.toFixed(2)} DH
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Détail des Transactions */}
          {transactions.length > 0 && (
            <div className="print-section">
              <div className="section-title">DÉTAIL DES TRANSACTIONS</div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Libellé</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(trans => (
                    <tr key={trans.id}>
                      <td className="text-center">{trans.type === 'versement' ? 'V' : 'R'}</td>
                      <td>{trans.label}</td>
                      <td className="text-right">{trans.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section Signatures */}
      <div className="signature-section">
        <div className="signature-box">
          <div className="signature-label">Responsable Agence</div>
          <div className="signature-line">{pvData.userName || '___________'}</div>
        </div>
        <div className="signature-box">
          <div className="signature-label">Chargé de client 1</div>
          <div className="signature-line">___________</div>
        </div>
        <div className="signature-box">
          <div className="signature-label">Chargé de client 2</div>
          <div className="signature-line">___________</div>
        </div>
      </div>
    </div>
  );
}
