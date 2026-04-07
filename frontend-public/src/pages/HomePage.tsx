import { Link2 } from 'lucide-react'

export function HomePage() {
    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] px-4 py-8 sm:px-6">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
                <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="bg-[linear-gradient(145deg,#0f766e_0%,#15803d_100%)] p-8 text-white sm:p-10">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white/12 p-1.5">
                            <img src="/logo.png" alt="Logo BPKH XI" className="h-full w-full object-contain rounded-xl" />
                        </div>
                        <h1 className="mt-8 text-4xl font-semibold tracking-tight">SIHUMAS</h1>
                        <p className="mt-3 max-w-md text-base leading-7 text-white/80">
                            Sistem Informasi Humas untuk berbagi dokumentasi kegiatan dengan tampilan yang lebih bersih dan mudah dibaca.
                        </p>
                    </section>

                    <section className="flex items-center p-8 sm:p-10">
                        <div>
                            <p className="text-sm font-medium text-emerald-700">Akses publik</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                Gunakan tautan yang sudah dibagikan
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                Halaman ini dipakai sebagai pintu masuk. Untuk melihat dokumentasi, buka link share yang Anda terima dari admin SIHUMAS.
                            </p>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Link2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">Format tautan</span>
                                </div>
                                <code className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                                    /s/token
                                </code>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
