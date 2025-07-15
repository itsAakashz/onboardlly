import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { db, auth } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const EmployeesTab = ({ employee, employees, setEmployee, setEmployees }) => {
  const companyId = 'hJjKySBXmH9myYcrbYDv'; // TODO: Replace with actual companyId from app state

  // Fetch employees in real-time
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'employees', companyId, 'employees'),
        (snapshot) => {
          const employeeList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate?.() || new Date(doc.data().startDate)
          }));
          setEmployees(employeeList);
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [setEmployees]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee.name || !employee.email || !employee.role || !employee.startDate || !employee.password) {
      alert('Please fill all required fields');
      return;
    }

    try {
      // 1. Create Auth account
      const cred = await createUserWithEmailAndPassword(auth, employee.email, employee.password);
      const { uid } = cred.user;

      // 2. Store user data in Firestore
      const newEmployee = {
        ...employee,
        uid,
        progress: 0,
        startDate: employee.startDate instanceof Date ? employee.startDate : new Date(employee.startDate)
      };

      await addDoc(collection(db, 'employees', companyId, 'employees'), newEmployee);

      // 3. Send onboarding email
      const response = await fetch('/api/sendEmployeeEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: employee.name,
          email: employee.email,
          password: employee.password,
          role: employee.role,
          department: employee.department,
          dashboardLink: 'https://onboardlly.vercel.app/'
        })
      });

      const result = await response.json();
      console.log(result.message);

      // 4. Reset form
      setEmployee({
        name: '',
        email: '',
        role: '',
        department: '',
        startDate: new Date(),
        password: ''
      });

      alert('Employee added successfully!');
    } catch (err) {
      console.error('Error adding employee or sending mail:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handle delete
  const handleDelete = async (emp) => {
    if (!window.confirm(`Are you sure you want to remove ${emp.name}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'employees', companyId, 'employees', emp.id));

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
      alert(`${emp.name} has been removed successfully.`);
    } catch (err) {
      console.error('Error deleting employee or sending mail:', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="mt-6 space-y-8">
      {/* Add Employee Form */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Add New Employee</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={employee.name || ''}
                  onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={employee.email || ''}
                  onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={employee.password || ''}
                  onChange={(e) => setEmployee({ ...employee, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={employee.role || ''}
                  onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Engineering"
                  value={employee.department || ''}
                  onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <DatePicker
                  selected={employee.startDate instanceof Date ? employee.startDate : new Date(employee.startDate)}
                  onChange={(date) => setEmployee({ ...employee, startDate: date })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                  dateFormat="MMMM d, yyyy"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Employee Directory</h3>
        </div>
        <div className="p-6">
          {employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((emp) => (
                    <tr key={emp.id || `${emp.email}-${emp.name}`} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {emp.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.department || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.startDate?.toLocaleDateString?.() || new Date(emp.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(emp)}
                          className="text-red-600 hover:text-red-900 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new employee.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesTab;