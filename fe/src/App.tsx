import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/SIgnup";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>\
      <Route path="/signup" element={<Signup />}></Route>
      <Route path="*" element={<NotFound />}></Route>
    </Routes>
  );
}

export default App;
