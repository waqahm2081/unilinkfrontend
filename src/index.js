import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import './styles/style.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgetPassword from "./pages/ForgetPassword";
import LeadForm from "./pages/LeadForm";

// Protected Pages
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import CreateStudent from "./pages/CreateStudent";
import EditStudent from "./pages/EditStudent";
import Applications from "./pages/Applications";
import CreateApplication from "./pages/CreateApplication";
import EditApplication from "./pages/EditApplication";
import Visa from "./pages/Visa";
import CreateVisa from "./pages/CreateVisa";
import Leads from "./pages/Leads";
import EditLead from "./pages/EditLead";
import Counslors from "./pages/Counslors";
import CreateCounselor from "./pages/CreateCounselor";
import EditCounslor from "./pages/EditCounslor";
import VisitorLogs from "./pages/VisitorLogs";
import AddLog from "./pages/AddLog";
import EditLog from "./pages/EditLog";
import Followups from "./pages/Followups";
import Countries from "./pages/Countries";
import Universities from "./pages/Universities";
import Intakes from "./pages/Intakes";
import EditVisa from "./pages/EditVisa";
import ViewStudentApplications from './pages/ViewStudentApplications';

import Finance from "./pages/Finance";
import CreateInvoice from "./pages/CreateInvoice";
import BankAccounts from "./pages/BankAccounts";
import InvoicePdf from "./pages/InvoicePdf";
import PaymentReceipt from "./pages/PaymentReceipt";

// New Modules
import Employees from "./pages/Employees";
import Expenses from "./pages/Expenses";

// Calendar
import MeetingsCalendar from "./pages/MeetingsCalendar";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/lead-form" element={<LeadForm />} />

          {/* Protected Routes - All authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-student"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <CreateStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-student/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <EditStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-applications/:studentId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <ViewStudentApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-application"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <CreateApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-application/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visa"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Visa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-visa"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <CreateVisa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-visa/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditVisa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Leads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow-ups"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Followups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-lead/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <EditLead />
              </ProtectedRoute>
            }
          />
          <Route
            path="/counselors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Counslors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-counselor"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateCounselor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-counselor/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditCounslor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitor-logs"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <VisitorLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-log"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <AddLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-log/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <EditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/countries"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Countries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/universities"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Universities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intakes"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Intakes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <Finance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/bank-accounts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BankAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-invoice"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <CreateInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice-pdf/:invoiceId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <InvoicePdf />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-receipt/:invoiceId/:paymentId?"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <PaymentReceipt />
              </ProtectedRoute>
            }
          />

          {/* HR Module */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Employees />
              </ProtectedRoute>
            }
          />

          {/* Expense Management Module */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Expenses />
              </ProtectedRoute>
            }
          />

          {/* Meetings Calendar */}
          <Route
            path="/meetings-calendar"
            element={
              <ProtectedRoute allowedRoles={['admin', 'consultant']}>
                <MeetingsCalendar />
              </ProtectedRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);

reportWebVitals();