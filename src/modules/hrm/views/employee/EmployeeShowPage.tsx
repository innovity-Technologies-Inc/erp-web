import { useNavigate, useParams } from '@tanstack/react-router'
import { 
  ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, 
  DollarSign, Award, Droplets, Clock, User, Briefcase, Info 
} from 'lucide-react'
import { useMemo } from 'react'
import { useEmployee } from '../../hooks/useEmployees'

export const EmployeeShowPage = () => {
  const { uuid } = useParams({ from: '/_authenticated/hrm/employee/show/$uuid' })
  const navigate = useNavigate()

  // API Data
  const { data: employeeData, isLoading: isLoadingEmployee } = useEmployee(uuid)

  const employee = useMemo(() => employeeData?.data, [employeeData])

  const imagePreview = useMemo(() => {
    if (!employee?.image) return null
    if (employee.image.startsWith('http')) return employee.image
    const backendUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${backendUrl}/storage/${employee.image}`
  }, [employee])

  if (isLoadingEmployee) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 border border-gray-100 shadow-sm">
          <Info className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Employee Not Found</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            The employee details could not be retrieved. The record may have been deleted or moved.
          </p>
          <button
            onClick={() => navigate({ to: '/hrm/employee' })}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-[12px] transition-all hover:bg-primary/95 active:scale-95"
          >
            Go to List
          </button>
        </div>
      </div>
    )
  }

  const fullName = `${employee.first_name} ${employee.last_name}`

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-12 font-poppins text-[#475569]">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/hrm/employee' })}
              className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </button>
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Employee Profile</h1>
          </div>
          
          <button
            type="button"
            onClick={() => navigate({ to: `/hrm/employee/edit/${employee.uuid}` })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[12px] font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Profile Banner Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
          {/* Header Banner Background */}
          <div className="h-40 md:h-48 bg-gradient-to-r from-slate-800 via-[#1E3A5F] to-indigo-950 relative overflow-hidden">
            {/* Absolute decorative glow balls */}
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl" />
          </div>

          {/* Profile Details Bar */}
          <div className="px-6 pb-6 pt-20 md:pt-6 relative flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            {/* Avatar container */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-6 -translate-y-1/2 w-32 h-32 md:w-36 md:h-36 rounded-3xl border-4 border-white bg-slate-50 overflow-hidden shadow-md shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <User className="h-14 w-14" />
                </div>
              )}
            </div>

            {/* Profile Meta details */}
            <div className="flex-grow md:ml-40 space-y-1">
              <h2 className="text-[24px] font-bold text-slate-800 tracking-tight leading-tight">{fullName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[13px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5 text-primary">
                  <Award className="h-4 w-4 text-primary/70" />
                  {employee.designation_name || 'No Designation'}
                </span>
                <span className="hidden md:inline text-gray-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  ID: #{employee.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left Column: Sidebar Cards */}
          <div className="space-y-6">
            
            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-[14px] font-bold text-slate-800 tracking-tight pb-3 border-b border-gray-50">
                Employment Status
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Salary Type</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-bold">
                    {employee.rate_type === 1 ? 'Hourly Rate' : 'Monthly Salary'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Pay Rate</span>
                  <span className="text-[16px] font-bold text-slate-800 flex items-center gap-0.5">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    {employee.hrate}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Blood Group</span>
                  <span className="flex items-center gap-1.5 text-rose-600 font-bold text-[13px] bg-rose-50 px-2.5 py-0.5 rounded-lg">
                    <Droplets className="h-4 w-4 text-rose-500" />
                    {employee.blood_group || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-[14px] font-bold text-slate-800 tracking-tight pb-3 border-b border-gray-50">
                Contact Details
              </h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Phone</p>
                    <p className="text-[13px] font-bold text-slate-700">{employee.phone}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                    <p className="text-[13px] font-bold text-slate-700 truncate">{employee.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">City/Country</p>
                    <p className="text-[13px] font-bold text-slate-700">
                      {employee.city || 'N/A'}, {employee.country || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Main Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Detailed Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              
              <div className="pb-3 border-b border-gray-50">
                <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">Full Information</h3>
              </div>

              {/* Personal Information Grid */}
              <div className="space-y-4">
                <h4 className="text-[12px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">First Name</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5">{employee.first_name}</span>
                  </div>
                  
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Last Name</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5">{employee.last_name}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Blood Group</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5">{employee.blood_group || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Joined Date</span>
                    <span className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address Details Block */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[12px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address & Location
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="md:col-span-3">
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Address Line 1</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5 leading-relaxed">
                      {employee.address_line_1 || 'N/A'}
                    </span>
                  </div>

                  <div className="md:col-span-3">
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Address Line 2</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5 leading-relaxed">
                      {employee.address_line_2 || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">City</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5">{employee.city || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Zip Code</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5">{employee.zip || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Country</span>
                    <span className="text-[13px] font-bold text-slate-700 block mt-0.5">{employee.country || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
