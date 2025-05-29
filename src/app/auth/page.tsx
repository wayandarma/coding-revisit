import Auth from "../../components/Auth";

export default function AuthPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Autentikasi</h1>
        <Auth />
      </div>
    </div>
  );
}
