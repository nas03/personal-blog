import View from '@/components/View';
import appRoutes from '@/routes/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';

function App() {
  // INITIALIZATION
  const queryClient = new QueryClient();
  const routes = [...appRoutes];

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
