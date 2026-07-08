import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
    Button,
} from "@wizeworks/silicaui-react";
import { Section, Row } from "../lib/Section";

export function AlertDialogDemo() {
    return (
        <Section title="Real use · Cancel/Action, header + footer">
            <Row>
                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button color="error" variant="outline">
                            Delete account…
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently removes your data. This can't be undone.
                        </AlertDialogDescription>
                        <div className="mt-4 flex justify-end gap-2">
                            <AlertDialogCancel>
                                <Button variant="ghost" color="neutral">
                                    Cancel
                                </Button>
                            </AlertDialogCancel>
                            <AlertDialogAction
                                color="error"
                                onClick={() => console.log("account deleted")}
                            >
                                Delete
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button variant="outline">Header/Footer variant</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                            You have unsaved changes that will be lost.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                <Button variant="ghost" color="neutral">
                                    Keep editing
                                </Button>
                            </AlertDialogCancel>
                            <AlertDialogAction color="error">Discard</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Row>
        </Section>
    );
}
