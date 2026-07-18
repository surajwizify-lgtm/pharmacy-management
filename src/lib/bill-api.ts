import { apiFetch } from "@/lib/api-client";


export function searchProducts(search: string) {
    return apiFetch(
        `/api/products?search=${encodeURIComponent(search)}&status=ACTIVE`
    );
}

export function getBills() {
    return apiFetch("/api/bills");
}

export function getBill(id: number) {
    return apiFetch(`/api/bills/${id}`);
}

export function createBill(data: any) {
    return apiFetch("/api/bills", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateBill(id: number, data: any) {
    return apiFetch(`/api/bills/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteBill(id: number) {
    return apiFetch(`/api/bills/${id}`, {
        method: "DELETE",
    });
}