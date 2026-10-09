import { createFileRoute } from "@tanstack/react-router";
import { DeskApp } from "@/components/dtc/desk-app";

export const Route = createFileRoute("/")({
  component: DeskApp,
});
