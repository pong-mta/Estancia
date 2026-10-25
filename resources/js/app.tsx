import { createInertiaApp } from "@inertiajs/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "@/layouts/settings/layout";

const appName = import.meta.env.VITE_APP_NAME || "Estancia";

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    layout: (name) => {
        switch (true) {
            // Public pages: no application sidebar or layout.
            case name === "welcome":
            case name === "public/tracking":
                return null;

            // Authentication pages.
            case name.startsWith("auth/"):
                return AuthLayout;

            // Settings pages.
            case name.startsWith("settings/"):
                return [AppLayout, SettingsLayout];

            // All remaining pages retain the existing application layout.
            default:
                return AppLayout;
        }
    },

    strictMode: true,

    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },

    progress: {
        color: "#4B5563",
    },
});

// Initialize light/dark appearance.
initializeTheme();
