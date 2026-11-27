import { ItemRow } from "@/types/purchaseOrder/perchaseOrderType";

export function num(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

export function calcLine(item: ItemRow, isInterState: boolean) {
    const qty = num(item.quantity);
    const rate = num(item.purchaseRate);
    const discountPct = num(item.discountPercent);
    const gstPct = num(item.gstPercentage);

    const gross = qty * rate;
    const discountAmt = gross * (discountPct / 100);
    const taxableValue = gross - discountAmt;
    const gstAmount = taxableValue * (gstPct / 100);

    const cgstAmount = isInterState ? 0 : gstAmount / 2;
    const sgstAmount = isInterState ? 0 : gstAmount / 2;
    const igstAmount = isInterState ? gstAmount : 0;

    const totalAmount = taxableValue + gstAmount;

    return { taxableValue, gstAmount, cgstAmount, sgstAmount, igstAmount, totalAmount };
}