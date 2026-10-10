import { createFileRoute } from "@tanstack/react-router";
import { GratzTune } from "@/components/gratz/gratz-tune";

export const Route = createFileRoute("/tune")({
  component: GratzTune,
});
