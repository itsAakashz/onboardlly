import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';


const EmployeesTab = ({
  employee,
  employees,
  setEmployee,
  setEmployees
}) => {
  // Fetch real-time employees from Firebase
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
        const employeeList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate?.() || new Date(doc.data().startDate)
        }));
        setEmployees(employeeList);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [setEmployees]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee.name || !employee.email || !employee.role || !employee.startDate || !employee.password) {
      console.error("Missing required fields");
      return;
    }

    try {
      const newEmployee = {
        ...employee,
        startDate: employee.startDate instanceof Date ? employee.startDate : new Date(employee.startDate)
      };

      await addDoc(collection(db, 'employees'), newEmployee);
      console.log("Employee added!");

      // Send email
      const response = await fetch('/api/sendEmployeeEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: employee.name,
          email: employee.email,
          password: employee.password,
          role: employee.role,
          department: employee.department,
          dashboardLink: 'https://onboardlly.vercel.app/dashboard/employee'
        })
      });



      const result = await response.json();
      console.log(result.message);

      setEmployee({
        name: '',
        email: '',
        role: '',
        department: '',
        startDate: new Date(),
        password: ''
      });
    } catch (err) {
      console.error('Error adding employee or sending mail:', err);
    }
  };


   // Handle delete
   const handleDelete = async (emp) => {
    try {
      await deleteDoc(doc(db, 'employees', emp.id));
      console.log(`Deleted ${emp.name}`);

      // Send email notification
      const response = await fetch('/api/sendEmployeeRemovalEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: emp.name,
          email: emp.email,
          role: emp.role,
          department: emp.department
        })
      });

      const result = await response.json();
      console.log(result.message);
    } catch (err) {
      console.error('Error deleting employee or sending mail:', err);
    }
  };


  return (
    <div className="mt-6">
      {/* Add Employee Form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Employee</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={employee.name || ''}
            onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={employee.email || ''}
            onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={employee.password || ''}
            onChange={(e) => setEmployee({ ...employee, password: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Role"
            value={employee.role || ''}
            onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Department"
            value={employee.department || ''}
            onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <DatePicker
            selected={employee.startDate instanceof Date ? employee.startDate : new Date(employee.startDate)}
            onChange={(date) => setEmployee({ ...employee, startDate: date })}
            className="w-full border px-3 py-2 rounded text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dateFormat="MMMM d, yyyy"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Save Employee
          </button>
        </form>
      </div>

      {/* Employees List */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Employees</h3>
        {employees.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <li key={emp.id || `${emp.email}-${emp.name}`} className="py-4">
                <p className="font-medium text-gray-800">{emp.name}</p>
                <p className="text-sm text-gray-500">{emp.email}</p>
                <p className="text-sm text-gray-500">Role: {emp.role}</p>
                {emp.department && <p className="text-sm text-gray-500">Department: {emp.department}</p>}
                <p className="text-sm text-gray-400">
                  Start Date: {emp.startDate?.toLocaleDateString?.() || new Date(emp.startDate).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDelete(emp)}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove Employee
                </button>

              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No employees found</p>
        )}
      </div>
    </div>
  );
};

export default EmployeesTab;