'use client'

import { Button } from "@/components/ui/button"
import AddUser from "./AddUser";
import { useState } from "react";

const AddUserButton = () => {
    const [showForm, setShowForm] = useState(false);


    return <div>
        <Button onClick={() => setShowForm(true)} variant={'primary'}>Add User</Button>
        {showForm && <AddUser onClose={() => { setShowForm(false) }} />}
    </div>
}

export default AddUserButton;