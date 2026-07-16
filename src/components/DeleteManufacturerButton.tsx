"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteManufacturerButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete manufacturer "${name}"? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/manufacturers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:underline text-sm disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
