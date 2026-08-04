import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/hrm/employee')({
  component: () => (
    <div className="p-6 bg-white rounded-xl shadow border border-gray-50 max-w-[1600px] mx-auto">
      <h1 className="text-[20px] font-medium text-primary tracking-tight mb-4">Employee Management</h1>
      <p className="text-[13px] text-gray-500 font-poppins">This module is under construction.</p>
    </div>
  ),
})
