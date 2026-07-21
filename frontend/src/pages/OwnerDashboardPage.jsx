import React, { useState, useEffect } from 'react';
import { Home, Plus, Users, Zap, FileText, Send, CheckCircle2, AlertCircle, DollarSign, Bed, Phone, Trash2, ChevronRight, Share2, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex items-center gap-5 transition-all hover:scale-[1.02]">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} shadow-lg shadow-indigo-500/10`}>
      <Icon size={26} className="text-white drop-shadow-md" />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mt-0.5">{value}</p>
      {subtitle && <p className="text-[11px] text-gray-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const OwnerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({ totalProperties: 0, totalBeds: 0, occupiedBeds: 0, vacantBeds: 0, totalCollected: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  // Forms State
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedRoomForBill, setSelectedRoomForBill] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(null);

  const [propForm, setPropForm] = useState({ name: '', propertyType: 'PG', address: '', city: '', totalRooms: 2, totalBeds: 4, defaultRent: 8000, electricityRate: 10, fixedMaintenance: 1000 });
  const [billForm, setBillForm] = useState({ baseRent: 8000, prevElectricityReading: 120, currElectricityReading: 175, electricityRate: 10, maintenanceAmount: 1000, waterCharge: 200, otherCharges: 0, billingMonth: 'July 2026', dueDate: '10th July 2026', tenantName: '', tenantPhone: '', tenantEmail: '' });
  const [tenantForm, setTenantForm] = useState({ tenantName: '', tenantPhone: '', tenantEmail: '', status: 'OCCUPIED' });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsRes, billsRes, statsRes] = await Promise.all([
        api.get('/owner/properties/my'),
        api.get('/owner/bills/my'),
        api.get('/owner/properties/stats')
      ]);
      setProperties(propsRes.data);
      setBills(billsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Owner dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owner/properties', propForm);
      setShowAddPropertyModal(false);
      fetchData();
      showModal({ type: 'alert', title: 'Success', message: 'Property and initial room/bed units created successfully!', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to create property.', onConfirm: closeModal });
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!showTenantModal) return;
    try {
      await api.put(`/owner/properties/rooms/${showTenantModal.id}/tenant`, tenantForm);
      setShowTenantModal(null);
      fetchData();
      showModal({ type: 'alert', title: 'Success', message: 'Tenant allocation updated successfully!', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to update tenant details.', onConfirm: closeModal });
    }
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!selectedRoomForBill) return;
    try {
      await api.post('/owner/bills/generate', {
        ...billForm,
        roomBedId: selectedRoomForBill.id
      });
      setShowBillModal(false);
      fetchData();
      showModal({ type: 'alert', title: 'Success', message: 'Smart Rent & Electricity Bill generated successfully!', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to generate bill.', onConfirm: closeModal });
    }
  };

  const handleMarkPaid = async (billId) => {
    try {
      await api.put(`/owner/bills/${billId}/mark-paid`);
      fetchData();
      showModal({ type: 'alert', title: 'Payment Confirmed', message: 'Bill has been marked as PAID.', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to update bill payment status.', onConfirm: closeModal });
    }
  };

  const handleSendReminder = async (billId) => {
    try {
      await api.post(`/owner/bills/${billId}/reminder`);
      showModal({ type: 'alert', title: 'Reminder Sent', message: 'In-app payment reminder notification sent to tenant.', onConfirm: closeModal });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: 'Failed to send reminder.', onConfirm: closeModal });
    }
  };

  const openBillGenerator = (room) => {
    setSelectedRoomForBill(room);
    setBillForm({
      baseRent: room.monthlyRent || 8000,
      prevElectricityReading: 100,
      currElectricityReading: 160,
      electricityRate: room.electricityRatePerUnit || 10,
      maintenanceAmount: room.fixedMaintenance || 1000,
      waterCharge: 200,
      otherCharges: 0,
      billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      dueDate: `10th ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      tenantName: room.tenantName || room.tenant?.name || '',
      tenantPhone: room.tenantPhone || room.tenant?.phone || '',
      tenantEmail: room.tenant?.email || ''
    });
    setShowBillModal(true);
  };

  return (
    <div className="min-h-screen bg-mesh-gradient dark:bg-slate-900 pb-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 pt-10 pb-16 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Home size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">PG & Flat Owner Dashboard</h1>
              <p className="text-gray-400 text-sm mt-0.5">Manage PGs, Hostels, Beds & Collect Rent via Razorpay</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddPropertyModal(true)}
            className="bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-primary-500/25 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} /> Add New Property (PG/Flat)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Home} label="Properties Managed" value={stats.totalProperties} color="from-blue-500 to-blue-600" subtitle={`${stats.totalBeds} Total Rooms/Beds`} />
          <StatCard icon={Bed} label="Occupied Units" value={stats.occupiedBeds} color="from-emerald-500 to-teal-600" subtitle={`${stats.vacantBeds} Units Currently Vacant`} />
          <StatCard icon={DollarSign} label="Rent Collected" value={`₹${(stats.totalCollected || 0).toLocaleString('en-IN')}`} color="from-indigo-500 to-purple-600" subtitle="Total Paid Bills" />
          <StatCard icon={AlertCircle} label="Pending Dues" value={`₹${(stats.totalPending || 0).toLocaleString('en-IN')}`} color="from-amber-500 to-orange-600" subtitle="Awaiting Tenant Payment" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 mb-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-2 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'properties' ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <Home size={16} /> My Properties & Beds ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'bills' ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <FileText size={16} /> Bills & Collection Ledger ({bills.length})
          </button>
        </div>

        {/* TAB 1: PROPERTIES & ROOM/BED MATRIX */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {properties.length === 0 ? (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-gray-100 dark:border-white/10 shadow-sm">
                <Home size={48} className="mx-auto text-primary-400 mb-3" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white">No Properties Added Yet</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mt-1 mb-6">Add your PG, Hostel, or Independent Flat to start allocating beds, calculating electricity bills, and collecting rent.</p>
                <button onClick={() => setShowAddPropertyModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all">Add Your First Property</button>
              </div>
            ) : (
              properties.map(({ property, roomsBeds }) => (
                <div key={property.id} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/10 shadow-lg p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">{property.name}</h2>
                        <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-primary-200/50">
                          {property.propertyType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📍 {property.address}, {property.city}</p>
                    </div>
                    <button
                      onClick={() => {
                        const roomNum = prompt('Enter Room Number (e.g. Room 205 or Flat 3A):', 'Room 205');
                        if (roomNum) {
                          const rent = prompt('Enter Monthly Rent (₹):', '8000');
                          if (rent) {
                            api.post(`/owner/properties/${property.id}/rooms`, { roomNumber: roomNum, bedNumber: 'Bed A', monthlyRent: rent })
                              .then(() => fetchData());
                          }
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-4 py-2.5 rounded-xl border border-indigo-200/50 flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Room / Bed Unit
                    </button>
                  </div>

                  {/* Rooms & Beds Matrix */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                      <Bed size={14} /> Room & Bed Occupancy Matrix ({roomsBeds.length} units)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roomsBeds.map(room => (
                        <div
                          key={room.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            room.status === 'OCCUPIED'
                              ? 'bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-teal-950/30 dark:to-slate-800 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-gradient-to-br from-gray-50/50 to-white dark:from-slate-800 dark:to-slate-800/50 border-gray-200 dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-extrabold text-sm text-gray-900 dark:text-white">{room.roomNumber}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">({room.bedNumber})</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              room.status === 'OCCUPIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                            }`}>
                              {room.status}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 mb-4 text-gray-600 dark:text-gray-300">
                            <p><span className="font-semibold text-gray-400">Rent:</span> ₹{room.monthlyRent?.toLocaleString('en-IN')}/mo</p>
                            <p><span className="font-semibold text-gray-400">Power Rate:</span> ₹{room.electricityRatePerUnit}/unit</p>
                            {room.status === 'OCCUPIED' ? (
                              <div className="pt-2 border-t border-gray-200/50 dark:border-white/5">
                                <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  👤 {room.tenantName || room.tenant?.name || 'Tenant Assigned'}
                                </p>
                                {room.tenantPhone && <p className="text-[11px] text-gray-500">📞 {room.tenantPhone}</p>}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-[11px] pt-1">Vacant — Ready for tenant onboarding</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                            <button
                              onClick={() => {
                                setShowTenantModal(room);
                                setTenantForm({
                                  tenantName: room.tenantName || room.tenant?.name || '',
                                  tenantPhone: room.tenantPhone || room.tenant?.phone || '',
                                  tenantEmail: room.tenant?.email || '',
                                  status: room.status
                                });
                              }}
                              className="flex-1 text-[11px] font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 py-1.5 rounded-lg transition-colors"
                            >
                              Assign Tenant
                            </button>
                            <button
                              onClick={() => openBillGenerator(room)}
                              className="flex-1 text-[11px] font-bold text-white bg-primary-600 hover:bg-primary-700 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                            >
                              <Zap size={12} /> Issue Bill
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: BILLS & RAZORPAY COLLECTION LEDGER */}
        {activeTab === 'bills' && (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/10 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Tenant Bills & Razorpay Rent Ledger</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Track monthly Rent + Electricity + Maintenance bills</p>
              </div>
            </div>

            {bills.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText size={40} className="mx-auto mb-2 opacity-50" />
                <p>No bills issued yet. Go to "My Properties" tab and click "Issue Bill" on any room.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700/50 text-left text-[11px] font-black uppercase text-gray-400">
                    <tr>
                      <th className="px-5 py-3">Tenant & Room</th>
                      <th className="px-5 py-3">Month</th>
                      <th className="px-5 py-3">Breakdown (Rent + Power + Maint)</th>
                      <th className="px-5 py-3">Total Amount</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                    {bills.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">{b.tenantName || 'Tenant'}</p>
                          <p className="text-gray-400 text-[11px]">{b.roomBed?.ownerProperty?.name} - {b.roomBed?.roomNumber}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">{b.billingMonth}</td>
                        <td className="px-5 py-4">
                          <div className="space-y-0.5 text-[11px]">
                            <p><span className="text-gray-400">Rent:</span> ₹{b.baseRent?.toLocaleString('en-IN')}</p>
                            <p><span className="text-gray-400">Power:</span> ₹{b.electricityAmount?.toLocaleString('en-IN')} ({b.unitsConsumed} units)</p>
                            <p><span className="text-gray-400">Maint:</span> ₹{b.maintenanceAmount?.toLocaleString('en-IN')}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-black text-base text-primary-600">₹{b.totalAmount?.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            b.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.status !== 'PAID' && (
                              <>
                                <button
                                  onClick={() => handleSendReminder(b.id)}
                                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                >
                                  <Send size={12} /> Remind
                                </button>
                                <button
                                  onClick={() => handleMarkPaid(b.id)}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                >
                                  <CheckCircle2 size={12} /> Mark Paid
                                </button>
                              </>
                            )}
                            {b.status === 'PAID' && (
                              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={14} /> Paid via Razorpay/Cash
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD PROPERTY */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Add New PG / Hostel / Flat</h3>
            <form onSubmit={handleAddProperty} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Name</label>
                <input type="text" required placeholder="e.g. Royal PG for Students" value={propForm.name} onChange={e => setPropForm({ ...propForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Type</label>
                  <select value={propForm.propertyType} onChange={e => setPropForm({ ...propForm, propertyType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white">
                    <option value="PG">PG (Paying Guest)</option>
                    <option value="HOSTEL">Hostel / Co-Living</option>
                    <option value="FLAT">Independent Flat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                  <input type="text" required placeholder="e.g. Pune" value={propForm.city} onChange={e => setPropForm({ ...propForm, city: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Address</label>
                <input type="text" required placeholder="Street address, area" value={propForm.address} onChange={e => setPropForm({ ...propForm, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rooms</label>
                  <input type="number" min="1" value={propForm.totalRooms} onChange={e => setPropForm({ ...propForm, totalRooms: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Beds</label>
                  <input type="number" min="1" value={propForm.totalBeds} onChange={e => setPropForm({ ...propForm, totalBeds: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rent (₹)</label>
                  <input type="number" value={propForm.defaultRent} onChange={e => setPropForm({ ...propForm, defaultRent: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddPropertyModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary-600 text-white shadow-md">Create Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TENANT */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Assign Tenant ({showTenantModal.roomNumber})</h3>
            <form onSubmit={handleUpdateTenant} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tenant Name</label>
                <input type="text" required placeholder="Tenant Full Name" value={tenantForm.tenantName} onChange={e => setTenantForm({ ...tenantForm, tenantName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tenant Phone</label>
                <input type="text" required placeholder="10-digit Phone Number" value={tenantForm.tenantPhone} onChange={e => setTenantForm({ ...tenantForm, tenantPhone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Registered Tenant Email (Optional)</label>
                <input type="email" placeholder="email@domain.com" value={tenantForm.tenantEmail} onChange={e => setTenantForm({ ...tenantForm, tenantEmail: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Status</label>
                <select value={tenantForm.status} onChange={e => setTenantForm({ ...tenantForm, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white">
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="VACANT">VACANT (Clear Tenant)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTenantModal(null)} className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary-600 text-white shadow-md">Save Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SMART RENT + ELECTRICITY BILL GENERATOR */}
      {showBillModal && selectedRoomForBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Smart Bill Calculator</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedRoomForBill.ownerProperty?.name} - {selectedRoomForBill.roomNumber} ({selectedRoomForBill.tenantName || 'Tenant'})</p>

            <form onSubmit={handleGenerateBill} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Monthly Rent (₹)</label>
                  <input type="number" required value={billForm.baseRent} onChange={e => setBillForm({ ...billForm, baseRent: Number(e.target.value) })} className="w-full px-4 py-2 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Maintenance Fee (₹)</label>
                  <input type="number" value={billForm.maintenanceAmount} onChange={e => setBillForm({ ...billForm, maintenanceAmount: Number(e.target.value) })} className="w-full px-4 py-2 rounded-xl border dark:bg-slate-700 dark:border-white/10 dark:text-white" />
                </div>
              </div>

              {/* Electricity Meter Section */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/50 space-y-3">
                <p className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Zap size={14} /> Sub-Meter Electricity Calculator
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prev Reading</label>
                    <input type="number" value={billForm.prevElectricityReading} onChange={e => setBillForm({ ...billForm, prevElectricityReading: Number(e.target.value) })} className="w-full px-3 py-1.5 rounded-lg border text-xs dark:bg-slate-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current Reading</label>
                    <input type="number" value={billForm.currElectricityReading} onChange={e => setBillForm({ ...billForm, currElectricityReading: Number(e.target.value) })} className="w-full px-3 py-1.5 rounded-lg border text-xs dark:bg-slate-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rate (₹/Unit)</label>
                    <input type="number" value={billForm.electricityRate} onChange={e => setBillForm({ ...billForm, electricityRate: Number(e.target.value) })} className="w-full px-3 py-1.5 rounded-lg border text-xs dark:bg-slate-700 dark:text-white" />
                  </div>
                </div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex justify-between pt-1">
                  <span>Units Consumed: {Math.max(0, billForm.currElectricityReading - billForm.prevElectricityReading)} units</span>
                  <span>Power Charge: ₹{Math.max(0, billForm.currElectricityReading - billForm.prevElectricityReading) * billForm.electricityRate}</span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-2xl border border-primary-200/50 flex justify-between items-center">
                <span className="font-bold text-gray-700 dark:text-gray-200">Total Calculated Bill:</span>
                <span className="text-2xl font-black text-primary-700 dark:text-primary-400">
                  ₹{(
                    Number(billForm.baseRent) +
                    Number(billForm.maintenanceAmount) +
                    Number(billForm.waterCharge) +
                    Number(billForm.otherCharges) +
                    (Math.max(0, billForm.currElectricityReading - billForm.prevElectricityReading) * billForm.electricityRate)
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBillModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary-600 text-white shadow-md">Generate & Issue Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Alert Modal */}
      <Modal isOpen={modalConfig.isOpen} onClose={closeModal} title={modalConfig.title} type={modalConfig.type} onConfirm={modalConfig.onConfirm}>
        <p className="text-sm text-gray-600 dark:text-gray-300">{modalConfig.message}</p>
      </Modal>
    </div>
  );
};

export default OwnerDashboardPage;
