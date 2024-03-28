import Cookies from 'universal-cookie';

const cookies = new Cookies();

export const setAuthToken = (token) => {
    // TODO: when deploy turn secure & httpOnly to true
    cookies.set('authToken', token, { path: '/', secure: false, httpOnly: false });
};

export const getAuthToken = () => {
    return cookies.get('authToken');
};

export const removeAuthToken = () => {
    cookies.remove('authToken', { path: '/' });
};