import React, { useState, useEffect } from 'react';
import EvidenceBot from './components/EvidenceBot';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [requests, setRequests] = useState([{ name: 'Request 1', messages: [] }]);
  const [selectedRequest, setSelectedRequest] = useState(0);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('eod-user');
    const savedShowLanding = localStorage.getItem('eod-showLanding');
    const tourShown = localStorage.getItem('eod-tourShown');

    if (savedUser) setUser(savedUser);
    if (savedShowLanding !== null) setShowLanding(savedShowLanding === 'true');

    if (savedUser && !tourShown) {
      setShowTour(true);
      localStorage.setItem('eod-tourShown', 'true');
    }
  }, []);

  const selectRequest = (idx) => setSelectedRequest(idx);
  const newRequest = () => {
    const newReq = { name: `Request ${requests.length + 1}`, messages: [] };
    setRequests([...requests, newReq]);
    setSelectedRequest(requests.length);
  };
  const updateRequest = (updatedRequest) => {
    const updated = [...requests];
    updated[selectedRequest] = updatedRequest;
    setRequests(updated);
  };
  const deleteRequest = (idx) => {
    const updated = requests.filter((_, i) => i !== idx);
    setRequests(updated);
    if (selectedRequest === idx) setSelectedRequest(0);
    else if (selectedRequest > idx) setSelectedRequest(selectedRequest - 1);
  };
  const goBack = () => {
    setShowLanding(true);
    localStorage.setItem('eod-showLanding', 'true');
  };

  const handleLogin = (username) => {
    localStorage.setItem('eod-user', username);
    setUser(username);
    setShowTour(true);
    setTourStep(0);
    localStorage.setItem('eod-tourShown', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('eod-user');
    localStorage.removeItem('eod-showLanding');
    localStorage.removeItem('eod-tourShown');
    setUser(null);
  };

  const tourSteps = [
    { target: '.sidebar', message: 'This is your sidebar where you manage requests.' },
    { target: '.chat-area', message: 'This area shows your conversation with the AI.' },
    { target: '.form-control-chat', message: 'Type your query here and click Send.' },
    { target: '.logout-btn-bot', message: 'Click Logout to exit the app.' },
  ];

  const getTourPosition = () => {
    const element = document.querySelector(tourSteps[tourStep]?.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
    }
    return { top: 100, left: 100 };
  };

  if (!user) return <Login onLogin={handleLogin} />;

  if (showLanding) {
    return (
      <div className="landing-container">
        <h1>AI-Powered Evidence-on-Demand Bot</h1>
        <p>Welcome, {user}!</p>
        <div className="landing-buttons">
          <button className="landing-btn" onClick={() => alert('Agent AI coming soon')}>
            Use Agent AI
          </button>
          <button
            className="landing-btn"
            onClick={() => {
              setShowLanding(false);
              localStorage.setItem('eod-showLanding', 'false');
            }}
          >
            Check Existing Evidence
          </button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  const tourPosition = getTourPosition();

  return (
    <div className="app-container">
      {showTour && (
        <div
          className="custom-tour"
          style={{
            top: `${tourPosition.top + 30}px`,
            left: `${tourPosition.left}px`,
          }}
        >
          <div className="custom-tour-arrow"></div>
          <p>{tourSteps[tourStep].message}</p>
          <div className="tour-buttons">
            <button
              onClick={() => {
                if (tourStep > 0) setTourStep(tourStep - 1);
              }}
              disabled={tourStep === 0}
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
                else setShowTour(false);
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Sidebar
        chats={requests}
        selectChat={selectRequest}
        newChat={newRequest}
        deleteChat={deleteRequest}
        goBack={goBack}
      />
      <EvidenceBot chatData={requests[selectedRequest]} updateChat={updateRequest} />
      <button className="logout-btn-bot" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default App;
