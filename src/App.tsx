import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TodoList from './pages/TodoList';
import Materials from './pages/Materials';
import Timesheets from './pages/Timesheets';
import JobExecution from './pages/JobExecution';
import Equipment from './pages/Equipment';
import Scanner from './pages/Scanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="todo" element={<TodoList />} />
          <Route path="materials" element={<Materials />} />
          <Route path="timesheets" element={<Timesheets />} />
          <Route path="job/:id" element={<JobExecution />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="scan" element={<Scanner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
