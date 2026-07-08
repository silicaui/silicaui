import {
    Dialog,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    Button,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function DialogDemo() {
    return (
        <>
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

            <Section title="Header + Footer · placeable docking bars, sticky footer">
                <Row>
                    <Dialog>
                        <DialogTrigger>
                            <Button variant="outline">Header/Footer</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite teammates</DialogTitle>
                                <DialogClose>
                                    <Button variant="ghost" shape="circle" size="sm">
                                        ✕
                                    </Button>
                                </DialogClose>
                            </DialogHeader>
                            <DialogDescription>
                                Send an invite by email — they'll get access once they accept.
                            </DialogDescription>
                            <DialogFooter>
                                <DialogClose>
                                    <Button variant="ghost" color="neutral">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <DialogClose>
                                    <Button>Send invite</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger>
                            <Button variant="outline">Sticky footer (scrolling content)</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[70dvh]">
                            <DialogHeader sticky>
                                <DialogTitle>Terms of service</DialogTitle>
                            </DialogHeader>
                            <DialogDescription>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <p key={i} className="mb-3">
                                        Section {i + 1} — placeholder legal text to force this
                                        dialog to scroll so the sticky footer below stays pinned.
                                    </p>
                                ))}
                            </DialogDescription>
                            <DialogFooter sticky>
                                <DialogClose>
                                    <Button variant="ghost" color="neutral">
                                        Decline
                                    </Button>
                                </DialogClose>
                                <DialogClose>
                                    <Button>Accept</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </Row>
            </Section>
        </>
    );
}
