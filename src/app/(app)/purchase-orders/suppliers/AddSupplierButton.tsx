'use client'

import { AddEditModel } from "@/components/common/Modal"
import NewSupplierPage from "./new/page"
import { useState } from "react"
import { Button } from "@/components/common/button"

const AddSupplierButton = () => {
    const [open, setOpen] = useState(false);
    return <div>
        <AddEditModel title="" buttonTitle="Add Supplier" onSubmit={() => { }} onClose={() => { }} onClick={() => { }}>
            <div className="h-[50vh] overflow-y-auto">
                <NewSupplierPage />
            </div>
        </AddEditModel>
    </div>
}

export default AddSupplierButton;