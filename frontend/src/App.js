import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import TimelineCollection from './TimelineCollection/TimelineCollection';
import Timeline from './Timeline/Timeline';
import Login from './Login/Login';
import Registration from './Registration/Registration';
import { getAuthToken, removeAuthToken } from './utilities/authentication'
import Button from '@mui/material/Button';
import { showError } from './utilities/helping_functions';
import axios from 'axios';
import { useLoader } from './LoaderContext';
import CircleLoader from "react-spinners/CircleLoader";
import logo from './logo.png';
import Analytics from './Analytics/Analytics';
import ForgetPassword from './ForgetPassword/ForgetPassword';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getAuthToken() ? true : false);
  const { isLoading, showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();

  const loaderOverlay = {
    borderColor: "red",
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };


  return (
    <div>
      {
        isAuthenticated && <header className="App-header" >
          {/* <h1 className="title" onClick={() => {
            navigate("/timeline-collection");
          }}>Anno-Historia</h1> */}
          <img src={logo} alt="Anno-Historia" style={{ width: '180px', height: 'auto' }} />
          <div className="title" style={{ width: '110px', height: '50px', position: 'fixed', left: 35 }}
            onClick={() => {
              navigate("/timeline-collection");
            }}
          />

          <Button variant="contained" style={{ marginRight: 20 }} onClick={async () => {
            try {
              showLoader();
              const response = await axios.post(
                process.env.REACT_APP_SERVER_URL + '/user/logout',
                {},
                {
                  headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                  },
                }
              );
              if (response.status === 200) {
                removeAuthToken();
                setIsAuthenticated(false);
              }
            } catch (error) {
              showError('Error Occured', error.message);
            }
            finally {
              hideLoader();
            }

          }} >Logout</Button>
        </header>
      }
      {
        isLoading && (
          <div style={loaderOverlay}>
            <CircleLoader
              color={'#36d7b7'}
              loading={true}
              size={200}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        )
      }
      <Routes>
        <Route path='/timeline-collection' element={isAuthenticated ? <TimelineCollection /> : <Navigate to="/login" replace />} />
        <Route path='/timeline/:timelineId/:timelineName' element={isAuthenticated ? <Timeline /> : <Navigate to="/login" replace />} />
        <Route path='/analytics/:timelineId/:timelineName' element={isAuthenticated ? <Analytics /> : <Navigate to="/login" replace />} />
        <Route path='/login' element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        <Route path='/' element={<Registration onSignup={() => setIsAuthenticated(true)} />} />
        <Route path='/forget-password' element={<ForgetPassword />} />
        <Route path='/forget-password/:forgetPasswordToken' element={<ForgetPassword />} />
      </Routes>
    </div>
  );
}

export default App;
