import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-col items-center justify-center flex-1 bg-gray-50">
      </main>
    </div>
  );
}
