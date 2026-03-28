import Navbar from "./components/Navbar";
import ConnectPage from "./components/ConnectPage";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ConnectPage />
    </div>
  );
}
