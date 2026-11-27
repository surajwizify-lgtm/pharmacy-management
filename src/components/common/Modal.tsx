import { Button } from "@/components/common/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
type props = {
    children: React.ReactNode;
    onSubmit: () => void
    onClose: () => void
    onClick: () => void;
    buttonTitle: string;
    title: string
}
export function AddEditModel({ children, onSubmit, onClose, onClick, buttonTitle, title }: props) {
    return (
        <Dialog>
            <form>
                <DialogTrigger render={<Button onClick={onClick} variant="outline">{buttonTitle}</Button>} />
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you&apos;re
                            done.
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        {children}
                        {/* <Field>
                            <Label htmlFor="name-1">Name</Label>
                            <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
                        </Field>
                        <Field>
                            <Label htmlFor="username-1">Username</Label>
                            <Input id="username-1" name="username" defaultValue="@peduarte" />
                        </Field> */}
                    </FieldGroup>
                    <DialogFooter>
                        <DialogClose onClick={onClose} render={<Button variant="outline">Cancel</Button>} />
                        <Button onSubmit={onSubmit} type="submit">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
