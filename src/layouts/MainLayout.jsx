import { Outlet } from 'react-router-dom';
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/shared/Footer";
import ThemeManager from "../components/shared/ThemeManager";

export default function MainLayout() {
  return (
    <>
      <ThemeManager />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}