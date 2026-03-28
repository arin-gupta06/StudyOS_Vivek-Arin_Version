import React, { useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useThemeStore } from "./store/themeStore";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load pages to decrease initial bundle size
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Subjects = React.lazy(() => import("./pages/Subjects"));
const CalendarPage = React.lazy(() => import("./pages/Calendar"));
const Calculator = React.lazy(() => import("./pages/Calculator"));
const StickyNotes = React.lazy(() => import("./pages/StickyNotes"));
const Notepad = React.lazy(() => import("./pages/Notepad"));
const TodoList = React.lazy(() => import("./pages/TodoList"));
const DrawingPad = React.lazy(() => import("./pages/DrawingPad"));
const SharedNotebook = React.lazy(() => import("./pages/SharedNotebook"));
const EditProfile = React.lazy(() => import("./pages/EditProfile"));

// Fallback loader component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-[#1C1C1E]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shared/:id" element={<SharedNotebook />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/sticky-notes" element={<StickyNotes />} />
              <Route path="/notes" element={<Notepad />} />
              <Route path="/todos" element={<TodoList />} />
              <Route path="/drawing-pad" element={<DrawingPad />} />
              <Route path="/edit-profile" element={<EditProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
