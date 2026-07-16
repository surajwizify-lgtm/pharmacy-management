import Image from "next/image";

interface PharmacyInfo {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    licenseNo?: string;
    gstNo?: string;
    logoUrl?: string | null;
}

interface PrintLayoutProps {
    children: React.ReactNode;
    documentTitle?: string;
    documentNo?: string;
    documentDate?: string;
    pharmacy?: PharmacyInfo;
    footerNote?: string;
    showSignature?: boolean;
}

export default function PrintLayout({
    children,
    documentTitle = "Invoice",
    documentNo,
    documentDate,
    pharmacy = {
        name: "Heleo Pharmacy Simplified",
        address: "123 Main Street, City, State - 000000",
        phone: "+91 7062627101",
        email: "contact@yourpharmacy.com",
        licenseNo: "DL-00-000-000000",
        gstNo: "00AAAAA0000A1Z0",
        logoUrl: '/logo.png', // pass a URL/path to render an actual logo image
    },
    footerNote = "This is a computer-generated document and does not require a physical signature.",
    showSignature = true,
}: PrintLayoutProps) {
    const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <div id="bill-print-area" className="text-neutral-900">
            {/* ---------- Header ---------- */}
            <header className="print-header">
                <div className="flex items-start justify-between gap-6 border-b-2 border-primary-700 pb-3">
                    <div className="flex items-start gap-3">
                        {pharmacy.logoUrl ? (
                            // <img
                            //     src={pharmacy.logoUrl}
                            //     alt={`${pharmacy.name} logo`}
                            //     className="h-14 w-14 object-contain"
                            // />
                            <div className="relative h-[80px] w-[120px] flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
                                <Image
                                    src={pharmacy.logoUrl}
                                    alt="Pharmacy POS Logo"
                                    fill
                                    className="object-cover w-full p-1"
                                    priority
                                />
                            </div>
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary-700 text-sm font-bold text-white">
                                {pharmacy.name
                                    .split(" ")
                                    .map((w) => w[0])
                                    .slice(0, 2)
                                    .join("")}
                            </div>
                        )}

                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-primary-800">
                                {pharmacy.name}
                            </h1>
                            <p className="text-[11px] leading-snug text-neutral-600">
                                {pharmacy.address}
                            </p>
                            <p className="text-[11px] leading-snug text-neutral-600">
                                {pharmacy.phone} &nbsp;·&nbsp; {pharmacy.email}
                            </p>
                            <p className="text-[10px] leading-snug text-neutral-500">
                                Drug License No: {pharmacy.licenseNo} &nbsp;·&nbsp; GSTIN: {pharmacy.gstNo}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-800">
                            {documentTitle}
                        </h2>
                        {documentNo && (
                            <p className="text-[11px] text-neutral-600">
                                No: <span className="font-medium text-neutral-900">{documentNo}</span>
                            </p>
                        )}
                        <p className="text-[11px] text-neutral-600">
                            Date: <span className="font-medium text-neutral-900">{documentDate || today}</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* ---------- Body ---------- */}
            <main className="print-content py-4 text-[12px]">{children}</main>

            {/* ---------- Footer ---------- */}
            <footer className="print-footer">
                <div className="border-t border-neutral-300 pt-2">
                    {showSignature && (
                        <div className="mb-3 flex items-end justify-between">
                            <p className="max-w-[70%] text-[10px] italic text-neutral-500">
                                {footerNote}
                            </p>
                            <div className="text-center">
                                <div className="h-8 w-36 border-b border-neutral-400" />
                                <p className="mt-1 text-[10px] text-neutral-600">
                                    Authorized Signatory
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span>{pharmacy.name} — {pharmacy.phone}</span>
                        <span className="print-page-number" />
                    </div>
                </div>
            </footer>
        </div>
    );
}