import View from '@/components/View';
import appRoutes from '@/routes/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';

function App() {
  // INITIALIZATION
  const queryClient = new QueryClient();
  const routes = [...appRoutes];

  // SESSION HANDLING
  // const [auth, setAuth] = useState(false);
  const access_token = localStorage.getItem('auth._token._local');
  const session_id = localStorage.getItem('__SSID__');
  const exp = localStorage.getItem('auth._token_exp._local');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isAuth =
    (access_token && session_id && Number(exp) > Math.floor(Date.now() / 1000)) || false;

  // const
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {routes.map((route) => {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <View component={route.component} layout={route.layout} title={route.title} />
                }
              />
            );
          })}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
