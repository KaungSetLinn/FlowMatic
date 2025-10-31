import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/ja'
import dayjs from 'dayjs'

dayjs.locale('ja')

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='ja'>
      <App />
    </LocalizationProvider>
  </AuthProvider>
)
