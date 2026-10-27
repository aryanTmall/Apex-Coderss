import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, Link, Navigate } from 'react-router-dom';
import { DemoBanner } from './components/common/DemoBanner';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { AiChatbot } from './components/chat/AiChatbot';
import { CursorGlow } from './components/common/CursorGlow';
import { GovernmentGuard } from './components/common/GovernmentGuard';
import { LandingPage } from './pages/LandingPage';
import { PublicPortalPage } from './pages/PublicPortalPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { PublicIntelligencePage } from './pages/PublicIntelligencePage';
import { PublicIssueMapPage } from './pages/PublicIssueMapPage';
import { GovernmentLoginPage } from './pages/GovernmentLoginPage';
import { GovernmentFeedPage } from './pages/GovernmentFeedPage';
import { GovernmentProgramsPage } from './pages/GovernmentProgramsPage';
import { GovernmentSettingsPage } from './pages/GovernmentSettingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';
import { TrackPage } from './pages/TrackPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { VerificationPage } from './pages/VerificationPage';
import { SimulationPage } from './pages/SimulationPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { MunicipalFundsPage } from './pages/MunicipalFundsPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { ParticipatoryBudgetingPage } from './pages/ParticipatoryBudgetingPage';
import { CivicRewardsPage } from './pages/CivicRewardsPage';
import { WhistleblowerReportPage } from './pages/WhistleblowerReportPage';
import { WhistleblowerAdminPage } from './pages/WhistleblowerAdminPage';
import { api } from './api/client';

// Layout wrapper for console pages
const AppConsoleLayout: React.FC = () => {
  const [activeCount, setActiveCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    api.getMetrics()
      .then(m => setActiveCount(m.open_cases))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-night text-text-primary flex flex-col font-sans relative selection:bg-civic-blue selection:text-white">
      <CursorGlow />
      <DemoBanner />
      <Sidebar
        activeIncidentsCount={activeCount}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <Header onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
      <main className="md:pl-64 pt-20 px-4 md:px-8 pb-12 min-h-screen">
        <Outlet />
      </main>
      <AiChatbot />
    </div>
  );
};

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-night text-text-primary flex flex-col items-center justify-center p-6 text-center">
    <span className="text-sm font-mono text-alert-red uppercase tracking-wider mb-2">404 // ROUTE NOT FOUND</span>
    <h1 className="font-serif text-3xl font-normal text-white mb-4">Tactical Vector Missing</h1>
    <p className="text-xs text-text-muted mb-6 max-w-sm">
      The requested route does not correspond to an active municipal operational node.
    </p>
    <Link
      to="/public"
      className="px-5 py-2.5 rounded-inner bg-civic-blue text-white text-xs font-semibold hover:bg-civic-blue-hover transition-all"
    >
      Return to Citizen Hub
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Cinematic Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Citizen Hub & Standalone Civic Services */}
      <Route path="/public" element={<AppConsoleLayout />}>
        <Route index element={<PublicPortalPage />} />
        <Route path="map" element={<PublicIssueMapPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="track/:trackingId" element={<TrackPage />} />
        <Route path="intelligence" element={<PublicIntelligencePage />} />
        <Route path="funds" element={<MunicipalFundsPage />} />
        <Route path="participation" element={<ParticipatoryBudgetingPage />} />
        <Route path="rewards" element={<CivicRewardsPage />} />
        <Route path="confidential-report" element={<WhistleblowerReportPage />} />
      </Route>

      {/* Emergency Services Tab */}
      <Route path="/emergency" element={<AppConsoleLayout />}>
        <Route index element={<EmergencyPage />} />
      </Route>

      {/* Government Authentication Gateway */}
      <Route path="/government/login" element={<GovernmentLoginPage />} />

      {/* Protected Government Operations Portal */}
      <Route path="/government" element={<GovernmentGuard />}>
        <Route element={<AppConsoleLayout />}>
          {/* 1. OPERATIONS */}
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<DashboardPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="map" element={<PublicIssueMapPage />} />

          {/* 2. INTELLIGENCE */}
          <Route path="intelligence" element={<GovernmentFeedPage />} />
          <Route path="hotspots" element={<IntelligencePage />} />
          <Route path="audit" element={<VerificationPage />} />

          {/* 3. DEPARTMENTS & VENDORS */}
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="contractors" element={<ContractorsPage />} />

          {/* 4. CITIZEN PROGRAMS */}
          <Route path="funds" element={<GovernmentProgramsPage initialTab="funds" />} />
          <Route path="participation" element={<GovernmentProgramsPage initialTab="voting" />} />
          <Route path="rewards" element={<GovernmentProgramsPage initialTab="rewards" />} />

          {/* 5. PROTECTED CASES */}
          <Route path="whistleblower" element={<WhistleblowerAdminPage />} />

          {/* 6. TOOLS */}
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="settings" element={<GovernmentSettingsPage />} />
        </Route>
      </Route>

      {/* Legacy /app Console Routes Preserved for Seamless Compatibility */}
      <Route path="/app" element={<AppConsoleLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="track/:trackingId" element={<TrackPage />} />
        <Route path="map" element={<PublicIssueMapPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="funds" element={<MunicipalFundsPage />} />
        <Route path="contractors" element={<ContractorsPage />} />
        <Route path="participation" element={<ParticipatoryBudgetingPage />} />
        <Route path="rewards" element={<CivicRewardsPage />} />
        <Route path="whistleblower" element={<WhistleblowerReportPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
