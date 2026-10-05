import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Page, Card } from "../components/ui";

export default function NotFound() {
  return (
    <Page>
      <Card className="text-center py-16">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-3xl bg-primary/10 text-primary"><Compass size={28} /></div>
        </div>
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="text-sm text-gray-500 mt-2">Menu yang Anda tuju belum tersedia.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-5 py-2.5 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          Kembali ke Dashboard
        </Link>
      </Card>
    </Page>
  );
}
