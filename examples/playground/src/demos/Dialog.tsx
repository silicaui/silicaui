import {
    Dialog,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogTitle,
    DialogDescription,
    Button,
} from "silicaui-react";
import { Section } from "../lib/Section";

export function DialogDemo() {
    return (
        <Section title="Real use · destructive-action confirmation">
            <Dialog>
                <DialogTrigger>
                    <Button color="error" variant="outline">
                        Delete project…
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Delete project?</DialogTitle>
                    <DialogDescription>
                        This will permanently delete the project and all its data. This
                        can't be undone.
                    </DialogDescription>
                    <div className="mt-4 flex justify-end gap-2">
                        <DialogClose>
                            <Button variant="ghost" color="neutral">
                                Cancel
                            </Button>
                        </DialogClose>
                        <DialogClose>
                            <Button color="error">Delete</Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </Section>
    );
}
