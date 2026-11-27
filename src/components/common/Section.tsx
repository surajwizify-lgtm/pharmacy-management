import React from "react";

export default function Section({ children }: { children: React.ReactNode }) {
    return (
        <section className="mt-5">
            {children}
        </section>
    )
}