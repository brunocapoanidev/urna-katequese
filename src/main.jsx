import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App.jsx';
import Admin from './admin/Admin.jsx';

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')).render(isAdmin ? <Admin /> : <App />);
