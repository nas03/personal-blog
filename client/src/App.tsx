import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import appRoutes from "./routes/app";

function App() {
  const router = createBrowserRouter([...appRoutes]);
  return (
    <>
      <RouterProvider
        router={router}
        fallbackElement={<p>Initial Load...</p>}
      />
    </>
  );
}

export default App;
