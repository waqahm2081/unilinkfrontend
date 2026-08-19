import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DateRangeFilter from '../components/DateRangeFilter';
import { startOfMonthYMD, todayYMD } from '../utils/dateRange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faArrowDown, faArrowUp, faBuilding,
  faUniversity, faBalanceScale, faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const fmtPKR = (n) =>
  `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const THIS_MONTH = { from: startOfMonthYMD(new Date()), to: todayYMD() };

function StatCard({ icon, iconBg, iconColor, title, value, subtitle, valueColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: iconBg }}>
        <FontAwesomeIcon icon={icon} style={{ color: iconColor }} />
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-number" style={{ fontSize: '16px', color: valueColor }}>{value}</p>
        {subtitle && <span style={{ fontSize: '12px', color: '#666' }}>{subtitle}</span>}
      </div>
    </div>
  );
}

function AccountCard({ title, subtitle, stats, accent }) {
  const rows = [
    { label: 'Period Opening', value: stats.periodOpening, color: '#374151' },
    { label: 'Amount Credit', value: stats.periodCredit, color: '#2E7D32' },
    { label: 'Amount Debit', value: stats.periodDebit, color: '#C62828' },
    { label: 'Current Balance', value: stats.currentBalance, color: '#1565C0' },
  ];
  return (
    <div style={{
      background: '#fff', borderRadius: '14px', padding: '18px',
      border: `1px solid ${accent || '#e5e7eb'}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a' }}>{title}</div>
        {subtitle && <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{row.label}</div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: row.color }}>{fmtPKR(row.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinanceOverview() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(THIS_MONTH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [cashOpeningInput, setCashOpeningInput] = useState('');
  const [savingCash, setSavingCash] = useState(false);
  const [editingCash, setEditingCash] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('dateFrom', dateRange.from);
      if (dateRange.to) params.append('dateTo', dateRange.to);
      const res = await fetch(`${API_URL}/finance/overview?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        setCashOpeningInput(String(json.cash?.openingBalance ?? 0));
      } else {
        setError(json.message || 'Failed to load finance overview');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const saveCashOpening = async () => {
    setSavingCash(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/finance/cash-opening`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashOpeningBalance: cashOpeningInput })
      });
      const json = await res.json();
      if (json.success) {
        setEditingCash(false);
        fetchOverview();
      } else {
        setError(json.message || 'Failed to update cash opening balance');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSavingCash(false);
    }
  };

  const totals = data?.totals;
  const cash = data?.cash;
  const banks = data?.bankAccounts || [];

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="leads-container">
          <div className="leads-header">
            <div className="header-left">
              <h1><FontAwesomeIcon icon={faWallet} className="page-icon" />Finance Overview</h1>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <DateRangeFilter
                label="Date range"
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading overview...</div>
          ) : (
            <>
              {totals && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
                  <StatCard
                    icon={faUniversity}
                    iconBg="#FFF8E1"
                    iconColor="#F57F17"
                    title="Period Opening"
                    value={fmtPKR(totals.periodOpening)}
                    subtitle="Start of selected range"
                    valueColor="#E65100"
                  />
                  <StatCard
                    icon={faArrowDown}
                    iconBg="#E8F5E9"
                    iconColor="#4CAF50"
                    title="Amount Credit"
                    value={fmtPKR(totals.periodCredit)}
                    subtitle="Money in during range"
                    valueColor="#2E7D32"
                  />
                  <StatCard
                    icon={faArrowUp}
                    iconBg="#FFEBEE"
                    iconColor="#F44336"
                    title="Amount Debit"
                    value={fmtPKR(totals.periodDebit)}
                    subtitle="Expenses & payouts"
                    valueColor="#C62828"
                  />
                  <StatCard
                    icon={faBalanceScale}
                    iconBg="#E3F2FD"
                    iconColor="#1565C0"
                    title="Current Balance"
                    value={fmtPKR(totals.currentBalance)}
                    subtitle="All banks + cash"
                    valueColor="#1565C0"
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Cash
                </h3>
                {!editingCash ? (
                  <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => setEditingCash(true)}>
                    Set cash opening
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field"
                      value={cashOpeningInput}
                      onChange={(e) => setCashOpeningInput(e.target.value)}
                      style={{ width: '160px', margin: 0 }}
                    />
                    <button className="btn-primary" onClick={saveCashOpening} disabled={savingCash} style={{ fontSize: '12px' }}>
                      <FontAwesomeIcon icon={faSave} /> {savingCash ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn-secondary" onClick={() => setEditingCash(false)} style={{ fontSize: '12px' }}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}
              </div>

              {cash && (
                <div style={{ marginBottom: '24px' }}>
                  <AccountCard
                    title="Cash in Hand"
                    subtitle={`Opening balance: ${fmtPKR(cash.openingBalance)}`}
                    stats={cash}
                    accent="#C8E6C9"
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Bank Accounts
                </h3>
                <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => navigate('/finance/bank-accounts')}>
                  <FontAwesomeIcon icon={faBuilding} /> Manage Bank Accounts
                </button>
              </div>

              {banks.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {banks.map((bank) => (
                    <AccountCard
                      key={bank.id}
                      title={bank.accountName}
                      subtitle={`${bank.bankName} · ${bank.accountNumber} · ${bank.currency}`}
                      stats={bank}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#888' }}>
                  No bank accounts yet. Add one from Manage Bank Accounts.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
