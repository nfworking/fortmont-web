import { DashboardHero, DashboardPage, DashboardSection } from "@/components/dashboard/page-shell";

export default function ServerSettingsPage() {
    return (
        <DashboardPage>
            <DashboardHero
                eyebrow="Fortmont API"
                title="Server settings"
                description="Configuration and registry tools for the Fortmont platform."
            />

            <DashboardSection title="Coming soon">
                <p className="text-sm text-muted-foreground">
                    This dashboard area is not wired up yet, but it now follows the same page chrome as the rest of the dashboard.
                </p>
            </DashboardSection>
        </DashboardPage>
    );
}