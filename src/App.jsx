import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  Compass, Plus, LogOut, User, MapPin, Calendar, DollarSign, 
  Briefcase, Bot, Sparkles, Trash2, Check, Send, 
  TrendingUp, Map, Coffee, CheckSquare, Square, ChevronRight
} from 'lucide-react';

function AppContent() {
  const { user, token, loading: authLoading, login, register, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, create, trip-detail, preview
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripsLoading, setTripsLoading] = useState(false);
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Trip Creator Form State
  const [dest, setDest] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [style, setStyle] = useState('Culture');
  const [companion, setCompanion] = useState('Solo');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenError, setAiGenError] = useState('');
  
  // Preview State (before saving)
  const [previewData, setPreviewData] = useState(null);

  // Active Trip Tab
  const [activeTripTab, setActiveTripTab] = useState('itinerary'); // itinerary, hotels, packing, budget, chat

  // Expense Tracker Form
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseError, setExpenseError] = useState('');

  // Chatbot State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch Trips list
  const fetchTrips = async () => {
    if (!token) return;
    setTripsLoading(true);
    try {
      const res = await fetch('/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTripsLoading(false);
    }
  };

  // Fetch Single Trip details
  const fetchTripDetails = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/trips/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTrip(data);
        // Default chatbot starter
        setChatHistory([
          { sender: 'assistant', text: `Hi ${user.name}! I am your AI Travel Guide for your trip to ${data.destination}. Feel free to ask me anything about tipping customs, safety guidelines, weather, or local foods to try!` }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle trip click
  const handleViewTripDetails = (id) => {
    setSelectedTripId(id);
    fetchTripDetails(id);
    setActiveTripTab('itinerary');
    setCurrentView('trip-detail');
  };

  useEffect(() => {
    if (token) {
      fetchTrips();
    }
  }, [token]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (authLoading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    const handleAuthSubmit = async (e) => {
      e.preventDefault();
      setAuthError('');
      try {
        if (isRegister) {
          await register(authName, authEmail, authPassword);
        } else {
          await login(authEmail, authPassword);
        }
      } catch (err) {
        setAuthError(err.message);
      }
    };

    return (
      <div className="auth-container">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo">
              <Compass size={40} style={{ color: '#6366F1', verticalAlign: 'middle', marginRight: '8px' }} />
              Travito
            </div>
            <p className="auth-subtitle">AI-Powered Travel Planning Assistant</p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required 
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required 
              />
            </div>

            {authError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isRegister ? 'Already have an account? ' : 'New to Travito? '}
            </span>
            <button 
              onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
            >
              {isRegister ? 'Sign In' : 'Create an Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate Itinerary AI Request
  const handleGenerateItinerary = async (e) => {
    e.preventDefault();
    setAiGenError('');

    // --- EDGE CASE VALIDATIONS ---
    // 1. Destination must not be blank or only spaces/numbers
    const trimmedDest = dest.trim();
    if (!trimmedDest || trimmedDest.length < 2) {
      setAiGenError('Please enter a valid destination name (at least 2 characters).');
      return;
    }
    if (/^[\d\s\W]+$/.test(trimmedDest)) {
      setAiGenError('Destination cannot be purely numbers or symbols. Enter a real city or country name.');
      return;
    }

    // 2. Dates must be valid
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to midnight

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setAiGenError('Please enter valid start and end dates.');
      return;
    }

    // 3. Start date must not be in the past
    if (start < today) {
      setAiGenError('Start date cannot be in the past. Please select today or a future date.');
      return;
    }

    // 4. End date must be after start date
    if (end <= start) {
      setAiGenError('End date must be after the start date.');
      return;
    }

    // 5. Trip duration must be reasonable (max 30 days)
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 30) {
      setAiGenError(`Trip duration is ${diffDays} days. Please limit trips to 30 days maximum for best AI planning quality.`);
      return;
    }

    // 6. Budget must be a positive number and at minimum $50
    const budget = parseFloat(budgetLimit);
    if (isNaN(budget) || budget <= 0) {
      setAiGenError('Please enter a valid budget amount.');
      return;
    }
    if (budget < 50) {
      setAiGenError('Minimum trip budget is $50. Please enter a realistic budget.');
      return;
    }
    if (budget > 1000000) {
      setAiGenError('Budget seems too high. Please enter a value below $1,000,000.');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: trimmedDest,
          duration: diffDays,
          budget_limit: budget,
          travel_style: style,
          companion_type: companion
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed generating itinerary');

      // Edge case: AI returned empty or malformed itinerary
      if (!data.itinerary || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        throw new Error('The AI could not generate a valid itinerary for this destination. Please try a different location or check the destination name.');
      }

      setPreviewData(data);
      setCurrentView('preview');
    } catch (e) {
      setAiGenError(e.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Save AI Generated Trip to Database
  const handleSaveTrip = async () => {
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: dest,
          start_date: startDate,
          end_date: endDate,
          budget_limit: budgetLimit,
          travel_style: style,
          companion_type: companion,
          itinerary: previewData.itinerary,
          hotels: previewData.hotels,
          packing: previewData.packing
        })
      });

      const data = await res.json();
      if (res.ok) {
        fetchTrips();
        // Reset form
        setDest('');
        setStartDate('');
        setEndDate('');
        setBudgetLimit('');
        setCurrentView('dashboard');
      } else {
        alert(data.error || 'Error saving trip');
      }
    } catch (e) {
      console.error(e);
      alert('Network error saving trip');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');

    // Edge case: amount must be positive and reasonable
    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setExpenseError('Please enter a valid positive amount.');
      return;
    }
    if (parsedAmount > 100000) {
      setExpenseError('Amount seems unusually high. Please verify and re-enter.');
      return;
    }

    // Edge case: description must not be empty or just spaces
    if (!expenseDesc || expenseDesc.trim().length < 2) {
      setExpenseError('Please enter a brief description for the expense.');
      return;
    }

    // Edge case: date must be provided
    if (!expenseDate) {
      setExpenseError('Please select a date for this expense.');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trip_id: selectedTripId,
          category: expenseCategory,
          amount: parsedAmount,
          date: expenseDate,
          description: expenseDesc.trim()
        })
      });

      if (res.ok) {
        fetchTripDetails(selectedTripId);
        setExpenseAmount('');
        setExpenseDesc('');
        setExpenseDate('');
        setExpenseError('');
      } else {
        const data = await res.json();
        setExpenseError(data.error || 'Failed to add expense.');
      }
    } catch (e) {
      console.error(e);
      setExpenseError('Network error. Please try again.');
    }
  };

  // Delete Expense Log
  const handleDeleteExpense = async (expenseId) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTripDetails(selectedTripId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Packing Status
  const handleTogglePacking = async (itemId, currentPacked) => {
    try {
      const res = await fetch(`/api/trips/${selectedTripId}/packing/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packed: !currentPacked })
      });
      if (res.ok) {
        // Optimistic toggle
        setSelectedTrip(prev => {
          const updatedPacking = prev.packing.map(item => {
            if (item.id === itemId) {
              return { ...item, packed: currentPacked ? 0 : 1 };
            }
            return item;
          });
          return { ...prev, packing: updatedPacking };
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this trip and all its itinerary, hotel, budget logs?')) return;
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTrips();
        if (selectedTripId === id) {
          setCurrentView('dashboard');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Chatbot message
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatHistory,
          tripDetails: selectedTrip
        })
      });

      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { sender: 'assistant', text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { sender: 'assistant', text: 'Error: Could not retrieve response.' }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'assistant', text: 'Network connection failure.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Calculations for Expense Metrics
  const getBudgetMetrics = () => {
    if (!selectedTrip || !selectedTrip.expenses) return { totalSpent: 0, percentage: 0, breakdown: {} };
    
    const totalSpent = selectedTrip.expenses.reduce((sum, item) => sum + item.amount, 0);
    const limit = selectedTrip.budget_limit || 1;
    const percentage = Math.min(Math.round((totalSpent / limit) * 100), 100);

    const breakdown = {
      Accommodation: 0,
      Food: 0,
      Transport: 0,
      Activities: 0,
      Miscellaneous: 0
    };

    selectedTrip.expenses.forEach(e => {
      if (breakdown[e.category] !== undefined) {
        breakdown[e.category] += e.amount;
      } else {
        breakdown.Miscellaneous += e.amount;
      }
    });

    return { totalSpent, percentage, breakdown };
  };

  const metrics = getBudgetMetrics();

  // Rendering dashboard statistics
  const dashboardStats = () => {
    const totalBudget = trips.reduce((sum, t) => sum + t.budget_limit, 0);
    return {
      tripsCount: trips.length,
      totalBudget: totalBudget,
      nextDestination: trips[0] ? trips[0].destination : 'None'
    };
  };
  const dStats = dashboardStats();

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Compass size={28} style={{ color: 'var(--color-primary)' }} />
          <span>Travito</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); }}
          >
            <Map size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'create' ? 'active' : ''}`}
            onClick={() => { setCurrentView('create'); }}
          >
            <Plus size={20} />
            <span>Plan New Trip</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button onClick={logout} className="nav-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}>
            <LogOut size={20} style={{ color: 'var(--color-danger)' }} />
            <span style={{ color: 'var(--color-danger)' }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT COMPONENT PANEL */}
      <main className="main-content">
        
        {/* VIEW 1: USER DASHBOARD */}
        {currentView === 'dashboard' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Welcome back, {user.name}!</h1>
                <p className="page-subtitle">Your AI-planned travel portfolio, schedule details, and budgets.</p>
              </div>
              <button onClick={() => setCurrentView('create')} className="btn btn-primary">
                <Plus size={18} />
                Plan a Trip
              </button>
            </div>

            {/* Quick Stat Cards */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h4>Total Planned Trips</h4>
                  <div className="stat-value">{dStats.tripsCount}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)' }}>
                  <Briefcase size={24} />
                </div>
              </div>
              
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h4>Total Estimated Budget</h4>
                  <div className="stat-value">${dStats.totalBudget.toLocaleString()}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)' }}>
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h4>Next Destination</h4>
                  <div className="stat-value" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{dStats.nextDestination}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(217, 70, 239, 0.1)', color: 'var(--color-accent)' }}>
                  <MapPin size={24} />
                </div>
              </div>
            </div>

            {/* Trips List */}
            <div>
              <h2 className="trips-section-title">
                <Compass size={22} style={{ color: 'var(--color-primary)' }} />
                Your Custom Itineraries
              </h2>

              {tripsLoading ? (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p>Loading your travels...</p>
                </div>
              ) : trips.length === 0 ? (
                <div className="empty-state glass-panel">
                  <div className="empty-state-icon">
                    <Compass size={32} />
                  </div>
                  <h3>No trips planned yet</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Let our AI Assistant help you construct the perfect getaway itinerary.</p>
                  <button onClick={() => setCurrentView('create')} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                    Generate First Itinerary
                  </button>
                </div>
              ) : (
                <div className="trips-grid">
                  {trips.map(trip => (
                    <div 
                      key={trip.id} 
                      className="trip-card glass-panel" 
                      onClick={() => handleViewTripDetails(trip.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="trip-card-image">
                        <div className="trip-card-dest">{trip.destination}</div>
                      </div>
                      <div className="trip-card-content">
                        <div className="trip-card-details">
                          <div className="trip-detail-item">
                            <Calendar size={16} />
                            <span>{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</span>
                          </div>
                          <div className="trip-detail-item">
                            <DollarSign size={16} />
                            <span>Budget Limit: ${trip.budget_limit}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span className="badge badge-style">{trip.travel_style}</span>
                            <span className="badge badge-companion">{trip.companion_type}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                            View Itinerary <ChevronRight size={16} />
                          </span>
                          <button 
                            className="btn btn-secondary btn-icon" 
                            style={{ padding: '0.4rem', color: 'var(--color-danger)', border: 'none' }}
                            onClick={(e) => handleDeleteTrip(trip.id, e)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: AI TRIP GENERATOR FORM */}
        {currentView === 'create' && (
          <div className="creator-container">
            <div className="creator-card glass-panel">
              <div className="creator-header">
                <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sparkles size={28} style={{ color: 'var(--color-primary)' }} />
                  AI Travel Itinerary Constructor
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  Feed destination parameters to our Groq Llama AI engine. It will draft a optimized roadmap, hotels, and checklists.
                </p>
              </div>

              {aiGenerating ? (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <h3 style={{ marginBottom: '0.5rem' }}>AI is mapping destination nodes...</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Optimizing routes, checking lodging parameters, and packing lists.</p>
                </div>
              ) : (
                <form onSubmit={handleGenerateItinerary}>
                  <div className="creator-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Where do you want to go?</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Tokyo, Japan / Paris, France / New York City"
                        value={dest}
                        onChange={(e) => { setDest(e.target.value); setAiGenError(''); }}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => { setStartDate(e.target.value); setAiGenError(''); }}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Date <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>(max 30 days trip)</span></label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={endDate}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => { setEndDate(e.target.value); setAiGenError(''); }}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Budget Cap (USD) <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>min $50</span></label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 1500"
                        value={budgetLimit}
                        min="50"
                        max="1000000"
                        onChange={(e) => { setBudgetLimit(e.target.value); setAiGenError(''); }}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Companion Configuration</label>
                      <select 
                        className="form-select" 
                        value={companion} 
                        onChange={(e) => setCompanion(e.target.value)}
                      >
                        <option>Solo</option>
                        <option>Couple</option>
                        <option>Family</option>
                        <option>Friends</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Adventure Style Focus</label>
                      <select 
                        className="form-select" 
                        value={style} 
                        onChange={(e) => setStyle(e.target.value)}
                      >
                        <option>Culture</option>
                        <option>Adventure</option>
                        <option>Relaxation</option>
                        <option>Foodie</option>
                      </select>
                    </div>
                  </div>

                  {aiGenError && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem', margin: '1rem 0', textAlign: 'center' }}>
                      Error generating trip: {aiGenError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                      <Sparkles size={18} />
                      Generate AI Draft
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCurrentView('dashboard')} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: AI DRAFT PREVIEW (BEFORE SAVING) */}
        {currentView === 'preview' && previewData && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Draft Preview: {dest}</h1>
                <p className="page-subtitle">Review the AI itinerary draft before saving it to your portfolio database.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleSaveTrip} className="btn btn-primary">
                  <Check size={18} />
                  Save Trip
                </button>
                <button onClick={() => setCurrentView('create')} className="btn btn-secondary">
                  Back to Settings
                </button>
              </div>
            </div>

            {/* Trip parameters overview */}
            <div className="trip-summary-bar glass-panel">
              <div className="summary-metric">
                <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TIMEFRAME</div>
                  <div className="summary-metric-value">{startDate} to {endDate}</div>
                </div>
              </div>
              <div className="summary-metric">
                <DollarSign size={20} style={{ color: 'var(--color-secondary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BUDGET CAP</div>
                  <div className="summary-metric-value">${budgetLimit}</div>
                </div>
              </div>
              <div className="summary-metric">
                <Compass size={20} style={{ color: 'var(--color-accent)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TRAVEL STYLE</div>
                  <div className="summary-metric-value">{style} ({companion})</div>
                </div>
              </div>
            </div>

            {/* Preview Tabs Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={22} style={{ color: 'var(--color-primary)' }} />
                  Day-by-Day Schedule
                </h2>
                <div className="timeline">
                  {previewData.itinerary.map((day, idx) => (
                    <div key={idx} className="timeline-day">
                      <div className="timeline-day-dot"></div>
                      <div className="timeline-day-card glass-panel">
                        <div className="timeline-day-header">
                          <h3 className="timeline-day-title">Day {day.day_number}</h3>
                        </div>
                        <div className="activity-slot">
                          <div className="activity-time">Morning</div>
                          <div className="activity-desc">{day.morning_act}</div>
                        </div>
                        <div className="activity-slot">
                          <div className="activity-time">Afternoon</div>
                          <div className="activity-desc">{day.afternoon_act}</div>
                        </div>
                        <div className="activity-slot">
                          <div className="activity-time">Evening</div>
                          <div className="activity-desc">{day.evening_act}</div>
                        </div>
                        {day.transport_info && (
                          <div className="transport-tip">
                            <Coffee size={16} />
                            <span><strong>Transit:</strong> {day.transport_info}</span>
                          </div>
                        )}
                        {day.notes && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            * {day.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Hotels preview */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Hotel Suggestions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {previewData.hotels.map((hotel, idx) => (
                      <div key={idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{hotel.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                          <span>★ {hotel.rating}</span>
                          <span className="badge badge-style" style={{ padding: '0.1rem 0.3rem' }}>{hotel.price_level}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{hotel.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Packing preview */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-accent)' }}>Packing Suggestions</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {previewData.packing.map((item, idx) => (
                      <span key={idx} className="badge badge-companion" style={{ fontSize: '0.8rem' }}>
                        {item.item_name || item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ACTIVE TRIP PORTFOLIO DETAILS */}
        {currentView === 'trip-detail' && selectedTrip && (
          <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h1 className="page-title">{selectedTrip.destination}</h1>
                <p className="page-subtitle">
                  {new Date(selectedTrip.start_date).toLocaleDateString()} - {new Date(selectedTrip.end_date).toLocaleDateString()} &bull; {selectedTrip.travel_style} Trip &bull; {selectedTrip.companion_type}
                </p>
              </div>
              <button onClick={() => setCurrentView('dashboard')} className="btn btn-secondary">
                Back to Dashboard
              </button>
            </div>

            {/* Detail Navigation Tabs */}
            <div className="trip-tabs">
              <button 
                className={`tab-btn ${activeTripTab === 'itinerary' ? 'active' : ''}`}
                onClick={() => setActiveTripTab('itinerary')}
              >
                <Map size={18} /> Itinerary
              </button>
              <button 
                className={`tab-btn ${activeTripTab === 'hotels' ? 'active' : ''}`}
                onClick={() => setActiveTripTab('hotels')}
              >
                <Home size={18} /> Hotels
              </button>
              <button 
                className={`tab-btn ${activeTripTab === 'packing' ? 'active' : ''}`}
                onClick={() => setActiveTripTab('packing')}
              >
                <Briefcase size={18} /> Packing List
              </button>
              <button 
                className={`tab-btn ${activeTripTab === 'budget' ? 'active' : ''}`}
                onClick={() => setActiveTripTab('budget')}
              >
                <DollarSign size={18} /> Expenses & Budget
              </button>
              <button 
                className={`tab-btn ${activeTripTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTripTab('chat')}
              >
                <Bot size={18} /> AI Travel Guide
              </button>
            </div>

            {/* TAB CONTENT: ITINERARY TIMELINE */}
            {activeTripTab === 'itinerary' && (
              <div>
                {selectedTrip.itinerary && selectedTrip.itinerary.length > 0 ? (
                  <div className="timeline">
                    {selectedTrip.itinerary.map(day => (
                      <div key={day.id} className="timeline-day">
                        <div className="timeline-day-dot"></div>
                        <div className="timeline-day-card glass-panel">
                          <div className="timeline-day-header">
                            <h3 className="timeline-day-title">Day {day.day_number}</h3>
                          </div>
                          <div className="activity-slot">
                            <div className="activity-time">Morning</div>
                            <div className="activity-desc">{day.morning_act}</div>
                          </div>
                          <div className="activity-slot">
                            <div className="activity-time">Afternoon</div>
                            <div className="activity-desc">{day.afternoon_act}</div>
                          </div>
                          <div className="activity-slot">
                            <div className="activity-time">Evening</div>
                            <div className="activity-desc">{day.evening_act}</div>
                          </div>
                          {day.transport_info && (
                            <div className="transport-tip">
                              <Coffee size={16} />
                              <span><strong>Transit:</strong> {day.transport_info}</span>
                            </div>
                          )}
                          {day.notes && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              * {day.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state glass-panel">
                    <p>No itinerary nodes recorded.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: HOTEL LIST */}
            {activeTripTab === 'hotels' && (
              <div className="hotels-grid">
                {selectedTrip.hotels && selectedTrip.hotels.map(hotel => (
                  <div key={hotel.id} className="hotel-card glass-panel">
                    <div>
                      <h3 className="hotel-title">{hotel.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <span className="hotel-rating">★ {hotel.rating || 'N/A'}</span>
                        <span className="badge badge-style" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>{hotel.price_level}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{hotel.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: PACKING CHECKLIST */}
            {activeTripTab === 'packing' && (
              <div className="packing-grid">
                {/* Organize packing items by category */}
                {['Documents', 'Clothing', 'Electronics', 'Toiletries', 'Other'].map(category => {
                  const items = selectedTrip.packing ? selectedTrip.packing.filter(i => i.category === category) : [];
                  if (items.length === 0) return null;
                  return (
                    <div key={category} className="packing-category-card glass-panel">
                      <h3 className="packing-category-title">
                        <Briefcase size={18} />
                        {category}
                      </h3>
                      <div className="packing-list-items">
                        {items.map(item => (
                          <div 
                            key={item.id} 
                            className={`packing-item ${item.packed ? 'checked' : ''}`}
                            onClick={() => handleTogglePacking(item.id, item.packed === 1)}
                          >
                            {item.packed === 1 ? (
                              <CheckSquare size={18} style={{ color: 'var(--color-primary)' }} />
                            ) : (
                              <Square size={18} style={{ color: 'var(--text-secondary)' }} />
                            )}
                            <span className="packing-item-text">{item.item_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: BUDGET TRACKER & LOGS */}
            {activeTripTab === 'budget' && (
              <div className="budget-dashboard">
                {/* Visual SVG Chart Card */}
                <div className="expenses-chart-card glass-panel">
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Expense Composition</h3>
                  
                  {/* Gauge Display */}
                  <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="16" />
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="80" 
                        fill="none" 
                        stroke="url(#budget-grad)" 
                        strokeWidth="16" 
                        strokeDasharray={2 * Math.PI * 80}
                        strokeDashoffset={2 * Math.PI * 80 * (1 - metrics.percentage / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                      />
                      <defs>
                        <linearGradient id="budget-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-primary)" />
                          <stop offset="100%" stopColor="var(--color-secondary)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>{metrics.percentage}%</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BUDGET EXHAUSTED</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL SPENT</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-primary)' }}>${metrics.totalSpent.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL BUDGET</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-secondary)' }}>${selectedTrip.budget_limit.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Horizontal Category Progress Bars */}
                  <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.keys(metrics.breakdown).map(cat => {
                      const amount = metrics.breakdown[cat];
                      const maxAmount = Math.max(...Object.values(metrics.breakdown), 1);
                      const barWidth = Math.round((amount / maxAmount) * 100);
                      const color = {
                        Accommodation: 'var(--color-primary)',
                        Food: 'var(--color-secondary)',
                        Transport: 'var(--color-accent)',
                        Activities: 'var(--color-success)',
                        Miscellaneous: 'var(--text-muted)'
                      }[cat];

                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                            <span style={{ fontWeight: '600' }}>${amount.toFixed(2)}</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${barWidth}%`, height: '100%', background: color, borderRadius: '3px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expense Logs Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Log new expense form */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Log Expense Node</h3>
                    <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Dinner at bistro" 
                          value={expenseDesc}
                          onChange={(e) => { setExpenseDesc(e.target.value); setExpenseError(''); }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Amount (USD)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0.01"
                          max="100000"
                          className="form-input" 
                          placeholder="e.g. 45.50" 
                          value={expenseAmount}
                          onChange={(e) => { setExpenseAmount(e.target.value); setExpenseError(''); }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Category</label>
                        <select 
                          className="form-select" 
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                        >
                          <option>Accommodation</option>
                          <option>Food</option>
                          <option>Transport</option>
                          <option>Activities</option>
                          <option>Miscellaneous</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Date</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={expenseDate}
                          onChange={(e) => { setExpenseDate(e.target.value); setExpenseError(''); }}
                          required
                        />
                      </div>

                      {expenseError && (
                        <div style={{ gridColumn: 'span 2', color: 'var(--color-danger)', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                          ⚠ {expenseError}
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '0.5rem 1rem' }}>
                        Add Expense
                      </button>
                    </form>
                  </div>


                  {/* Logged items table */}
                  <div className="expenses-list-card glass-panel" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Expense History Log</h3>
                    {selectedTrip.expenses && selectedTrip.expenses.length > 0 ? (
                      <div>
                        {selectedTrip.expenses.map(expense => (
                          <div key={expense.id} className="expense-item">
                            <div>
                              <div className="expense-name">{expense.description}</div>
                              <div className="expense-meta">
                                <span className="badge badge-style" style={{ padding: '0.05rem 0.25rem', fontSize: '0.65rem', marginRight: '0.5rem' }}>{expense.category}</span>
                                {expense.date}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No expenses logged yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CHATBOT ASYNC INTERACTION */}
            {activeTripTab === 'chat' && (
              <div className="chatbot-panel glass-panel">
                <div className="chatbot-header">
                  <Bot size={24} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <h3 style={{ fontSize: '1rem' }}>AI Destination Guide</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Powered by Groq Llama-3.3-70b-versatile</span>
                  </div>
                </div>

                <div className="chatbot-messages">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble ${msg.sender}`}>
                      {msg.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble assistant" style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem' }}>
                      <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', margin: 0 }}></span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChatMessage} className="chatbot-input-area">
                  <input 
                    type="text" 
                    className="chatbot-input" 
                    placeholder="Ask about local customs, safe water, packing tips, translations..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={chatLoading}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

// Wrap inside AuthProvider for state bindings
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
