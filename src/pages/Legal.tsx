import { useNavigate } from "react-router-dom";
import { ScrollText, Shield } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

type Variant = "tos" | "dmca";

const CONTENT: Record<Variant, { title: string; icon: JSX.Element; body: { h: string; p: string }[] }> = {
  tos: {
    title: "Syarat & Ketentuan",
    icon: <ScrollText className="h-7 w-7 text-primary" />,
    body: [
      { h: "Penggunaan Layanan", p: "NexaPlay menyediakan agregasi tautan streaming anime dari sumber publik. Layanan ini ditujukan untuk hiburan pribadi dan tidak boleh digunakan untuk tujuan komersial." },
      { h: "Akun Pengguna", p: "Kamu bertanggung jawab menjaga kerahasiaan akunmu. Aktivitas yang melanggar hukum atau hak pihak lain dapat menyebabkan akun ditangguhkan." },
      { h: "Konten", p: "NexaPlay tidak menghosting file media. Semua konten ditampilkan melalui pemutar pihak ketiga. Hak cipta tetap berada pada pemegang lisensi resmi." },
      { h: "Perubahan", p: "Syarat ini dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan dianggap sebagai persetujuan terhadap versi terbaru." },
    ],
  },
  dmca: {
    title: "Kebijakan DMCA",
    icon: <Shield className="h-7 w-7 text-primary" />,
    body: [
      { h: "Tentang DMCA", p: "NexaPlay menghormati hak kekayaan intelektual dan menanggapi laporan pelanggaran sesuai prinsip Digital Millennium Copyright Act (DMCA)." },
      { h: "Tidak Menghosting Konten", p: "Kami hanya menampilkan tautan publik dari pemutar pihak ketiga. Permintaan penghapusan harus diajukan kepada penyedia hosting asli." },
      { h: "Mengirim Laporan", p: "Kirim laporan ke kanal Discord resmi kami dengan menyertakan: identifikasi karya berhak cipta, tautan yang dilaporkan, dan pernyataan iktikad baik." },
      { h: "Tindak Lanjut", p: "Setelah memverifikasi laporan, kami akan menonaktifkan tautan terkait dari indeks dalam waktu 1×24 jam kerja." },
    ],
  },
};

export const Legal = ({ variant }: { variant: Variant }) => {
  const nav = useNavigate();
  const { title, icon, body } = CONTENT[variant];
  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />
      <main className="max-w-3xl mx-auto px-3 sm:px-5 mt-6 space-y-6">
        <header className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="display text-3xl sm:text-4xl font-black">{title}</h1>
            <p className="text-xs text-muted-foreground mt-1 mono">Diperbarui: 2026</p>
          </div>
        </header>
        <article className="bg-card-grad rounded-2xl border border-border p-5 sm:p-7 space-y-5">
          {body.map((s) => (
            <section key={s.h}>
              <h2 className="font-extrabold text-lg mb-1">{s.h}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.p}</p>
            </section>
          ))}
        </article>
      </main>
    </div>
  );
};

export const TOS = () => <Legal variant="tos" />;
export const DMCA = () => <Legal variant="dmca" />;
