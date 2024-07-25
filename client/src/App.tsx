import View from "@/components/View";
import appRoutes from "@/routes/app";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

function App() {
  const routes = [...appRoutes];
  // axios.defaults.headers['Authorization'] =
  return (
    // <AuthProvider></AuthProvider>
    <BrowserRouter>
      <Routes>
        {routes.map((route) => {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <View
                  component={route.component}
                  layout={route.layout}
                  title={route.title}
                />
              }
            />
          );
        })}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
