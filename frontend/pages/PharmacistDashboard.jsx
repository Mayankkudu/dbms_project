import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, LoadingState, EmptyState } from '../components/Common';
import StatusBadge from '../components/StatusBadge';
import { pharmacistAPI } from '../services/api';

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prescriptions');
  
  // State for single-click row highlighting toggle
  const [highlightedRow, setHighlightedRow] = useState(null);
  
  const [updatingId, setUpdatingId] = useState(null);
  const [newStockValues, setNewStockValues] = useState({});

  async function loadData() {
    setLoading(true);
    try {
      const [rxRes, invRes] = await Promise.all([
        pharmacistAPI.getPrescriptions(),
        pharmacistAPI.getInventory()
      ]);
      setPrescriptions(rxRes.data.data || []);
      setInventory(invRes.data.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpdateStock(medicineId) {
    const newStock = newStockValues[medicineId];
    if (newStock === undefined || newStock === '') return;
    
    setUpdatingId(medicineId);
    try {
      await pharmacistAPI.updateStock(medicineId, parseInt(newStock, 10));
      await loadData();
      setNewStockValues(prev => ({ ...prev, [medicineId]: '' }));
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setUpdatingId(null);
    }
  }

  const toggleHighlight = (id) => {
    setHighlightedRow(prev => prev === id ? null : id);
  };

  const handleStockChange = (id, val) => {
    setNewStockValues(prev => ({ ...prev, [id]: val }));
  };

  return (
    <DashboardLayout title="Pharmacist Dashboard">
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <button 
          onClick={() => setActiveTab('prescriptions')} 
          style={tabBtn(activeTab === 'prescriptions')}
        >
          Prescriptions
        </button>
        <button 
          onClick={() => setActiveTab('inventory')} 
          style={tabBtn(activeTab === 'inventory')}
        >
          Inventory Management
        </button>
      </div>

      {loading ? (
        <Card><LoadingState /></Card>
      ) : activeTab === 'prescriptions' ? (
        <Card title={`Pending Prescriptions (${prescriptions.length})`}>
          {prescriptions.length === 0 ? <EmptyState message="No prescriptions found." /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Rx ID</Th>
                  <Th>Medicine</Th>
                  <Th>Dosage</Th>
                  <Th>Current Stock</Th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((it) => (
                  <tr 
                    key={`${it.prescription_id}-${it.item_id}`} 
                    onClick={() => toggleHighlight(`${it.prescription_id}-${it.item_id}`)}
                    style={{ 
                      backgroundColor: highlightedRow === `${it.prescription_id}-${it.item_id}` ? 'rgba(0, 123, 255, 0.1)' : 'transparent', 
                      cursor: 'pointer', 
                      transition: 'background-color 0.2s' 
                    }}
                  >
                    <Td>{new Date(it.prescription_date).toLocaleDateString()}</Td>
                    <Td>#{it.prescription_id}</Td>
                    <Td>{it.medicine_name}</Td>
                    <Td>{it.prescribed_dosage}</Td>
                    <Td>
                      <StatusBadge status={it.stock_quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'} /> 
                      <span style={{marginLeft: 8, fontSize: 12}}>({it.stock_quantity})</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <Card title={`Medicine Inventory (${inventory.length})`}>
          {inventory.length === 0 ? <EmptyState message="No medicines in inventory." /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <Th>Medicine Name</Th>
                  <Th>Dosage Form</Th>
                  <Th>Current Stock</Th>
                  <Th>Update Stock</Th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((it) => (
                  <tr 
                    key={it.medicine_id}
                    onClick={() => toggleHighlight(it.medicine_id)}
                    style={{ 
                      backgroundColor: highlightedRow === it.medicine_id ? 'rgba(0, 123, 255, 0.1)' : 'transparent', 
                      cursor: 'pointer', 
                      transition: 'background-color 0.2s' 
                    }}
                  >
                    <Td>{it.name}</Td>
                    <Td>{it.dosage}</Td>
                    <Td>{it.stock_quantity}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <input 
                          type="number" 
                          style={{ width: 70, padding: 4, borderRadius: 4, border: '1px solid var(--color-border)' }}
                          placeholder="New"
                          value={newStockValues[it.medicine_id] || ''}
                          onChange={(e) => handleStockChange(it.medicine_id, e.target.value)}
                        />
                        <button 
                          disabled={updatingId === it.medicine_id || !newStockValues[it.medicine_id]} 
                          onClick={() => handleUpdateStock(it.medicine_id)} 
                          style={smallBtn('var(--color-primary)')}
                        >
                          Update
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}

function tabBtn(active) {
  return {
    padding: '8px 16px',
    borderRadius: 8,
    border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
    background: active ? 'var(--color-primary-light, #e6f0ff)' : '#fff',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : 'normal'
  };
}
function smallBtn(color) {
  return { fontSize: 12, padding: '5px 10px', borderRadius: 6, border: `1px solid ${color}`, background: '#fff', color, cursor: 'pointer' };
}
function Th({ children }) { return <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 8px 8px 0' }}>{children}</th>; }
function Td({ children }) { return <td style={{ fontSize: 13, padding: '8px 8px 8px 0', borderTop: '1px solid var(--color-border)' }}>{children}</td>; }
