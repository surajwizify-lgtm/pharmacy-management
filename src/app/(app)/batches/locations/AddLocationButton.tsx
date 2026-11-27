'use client'
import { Button } from "@/components/common/button"
import LocationForm from "./LocationForm";
import { useState } from "react";


const AddLocationButton = () => {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div>
            <Button variant="outline" onClick={() => setModalOpen(true)} >Add Location</Button>
            {modalOpen && (
                <LocationForm setModalOpen={setModalOpen} />
            )}
        </div>
    )
}

export default AddLocationButton;