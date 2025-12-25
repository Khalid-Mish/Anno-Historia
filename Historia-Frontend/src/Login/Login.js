import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { isValidEmail, showError } from '../utilities/helping_functions';
import axios from 'axios';
import { setAuthToken } from '../utilities/authentication';
import { useNavigate } from "react-router-dom";
import { useLoader } from '../LoaderContext';
import logo from '../logo.png';

const LoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();

    const handleLogin = async () => {
        try {
            if (!email || !password) {
                showError('Please fill all the fields')
                return;
            }
            if (!isValidEmail(email)) {
                showError('Email is not valid')
                return;
            }
            const url = process.env.REACT_APP_SERVER_URL + '/user/signin';
            const data = {
                email: email.toLowerCase(),
                password,
            };

            showLoader();
            const response = await axios.post(url, data);
            setAuthToken(response.data.authToken);
            onLogin();
            navigate('/timeline-collection', { replace: true });
        }
        catch (error) {
            showError('Error Occured', error?.response?.data?.message || error.message);
        }
        finally {
            hideLoader()
        }
    };

    const handleForgetPassword = async () => {
        navigate('/forget-password');
    }

    return (
        <div style={styles.container}>
            <div style={{ width: '50%' }}>
                <p style={styles.title}>Login</p>
                <Card sx={{ minWidth: 275, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <img src={logo} alt="Anno-Historia" style={{ width: '180px', height: 'auto', marginTop: -50, marginBottom: -50 }} />
                    <CardContent style={{ display: 'flex', flexDirection: 'column', width: '80%' }} >
                        <TextField
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}

                        />
                        <TextField
                            style={styles.input}
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                    </CardContent>
                    <CardActions sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Button variant="contained" onClick={handleLogin} >Login</Button>
                        <Button variant="text" onClick={handleForgetPassword} >Forget Password</Button>
                    </CardActions>
                </Card>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <p style={styles.loginLink}>
                    Don't have an account?
                </p>
                <Button variant="text" style={styles.linkText} onClick={() => {
                    navigate('/', { replace: true });
                }}>Sign up</Button>
            </div>
        </div>
    );
};


const styles = {
    container: {
        padding: 15,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    input: {
        height: 40,
        marginBottom: 16,
        padding: 10,
        fontSize: 50
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    loginLink: {
        display: 'flex',
        marginTop: 16,
        alignSelf: 'center',
        fontSize: 16
    },
    linkText: {
        color: '#007bff',
        marginLeft: '5px'
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#007bff',
        marginTop: 80,
    },

};

export default LoginScreen;
