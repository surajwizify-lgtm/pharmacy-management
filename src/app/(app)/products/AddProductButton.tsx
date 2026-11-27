'use client'

import { Button } from "@/components/common/button";
import { ProductFormModal } from "@/components/products/ProductFormModal"
import { useState } from "react";

const AddProductButton = () => {
    const [showAddProduct, setShowAddProduct] = useState(false);

    return <div>
        <Button onClick={() => setShowAddProduct(true)}>Add Product</Button>
        <ProductFormModal open={showAddProduct} onClose={() => setShowAddProduct(false)} onSuccess={() => { }} />
    </div>
}

export default AddProductButton;