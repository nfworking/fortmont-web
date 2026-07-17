import { DashboardHero, DashboardPage, DashboardSection } from "@/components/dashboard/page-shell";
import { UnifiDashboard } from "@/components/unifi/dashboard";

export default function ServerSettingsPage() {
    return (
        <DashboardPage>
            <DashboardHero
                eyebrow="Fortmont Unifi"
                title="Unifi integration"
                description="Configuration and registry tools for the Fortmont Unifi integration."
            />
            
                <UnifiDashboard />
   
        </DashboardPage>
    );
}