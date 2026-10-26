import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/SIgnup";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/Profile";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/signup" element={<Signup />}></Route>
      <Route path="/forgot-password" element={<ForgotPassword />}></Route>
      <Route path="/reset-password" element={<ResetPassword />}></Route>
      <Route path="/reset-password/:token" element={<ResetPassword />}></Route>
      <Route path="/chat" element={<ChatPage />}></Route>
      <Route path="/profile" element={<ProfilePage />}></Route>
      <Route path="/invite/:token" element={<AcceptInvitePage />}></Route>
      <Route path="*" element={<NotFound />}></Route>
    </Routes>
  );
}

export default App;
