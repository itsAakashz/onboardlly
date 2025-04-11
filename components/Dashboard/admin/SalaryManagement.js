import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

const SalaryManagementTab = ({ employees }) => {
  const [salaryData, setSalaryData] = useState({ employeeId: '', amount: '', month: '', year: '' });
  const [salaries, setSalaries] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'salaries'), (snapshot) => {
      const salaryList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSalaries(salaryList);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { employeeId, amount, month, year } = salaryData;
    if (!employeeId || !amount || !month || !year) return;

    try {
      await addDoc(collection(db, 'salaries'), {
        employeeId,
        amount: parseFloat(amount),
        month,
        year: parseInt(year)
      });
      setSalaryData({ employeeId: '', amount: '', month: '', year: '' });
    } catch (err) {
      console.error("Error saving salary record:", err);
    }
  };

  return (
    <div className="mt-6">
      {/* Add Salary Form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Record Salary Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={salaryData.employeeId}
            onChange={(e) => setSalaryData({ ...salaryData, employeeId: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount (INR)"
            value={salaryData.amount}
            onChange={(e) => setSalaryData({ ...salaryData, amount: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Month (e.g., April)"
            value={salaryData.month}
            onChange={(e) => setSalaryData({ ...salaryData, month: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Year (e.g., 2025)"
            value={salaryData.year}
            onChange={(e) => setSalaryData({ ...salaryData, year: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Save Record
          </button>
        </form>
      </div>

      {/* Salary Records List */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Records</h3>
        {salaries.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {salaries.map((salary) => {
              const employee = employees.find(e => e.id === salary.employeeId);
              return (
                <li key={salary.id} className="py-4">
                  <p className="text-gray-800 font-medium">{employee ? employee.name : 'Unknown Employee'}</p>
                  <p className="text-sm text-gray-500">Amount: ₹{salary.amount}</p>
                  <p className="text-sm text-gray-500">Month: {salary.month}, Year: {salary.year}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500">No salary records found.</p>
        )}
      </div>
    </div>
  );
};

export default SalaryManagementTab;
