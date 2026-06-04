import ReactDOM from 'react-dom/client';
import App from './App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('Service Worker registered');
    }).catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);