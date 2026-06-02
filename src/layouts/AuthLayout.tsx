import { Outlet } from '@tanstack/react-router'
import { useSettings } from '@/hooks/useSettings'
import LoginSidebarImage from '@/assets/images/login_sidbar.png'

export const AuthLayout = () => {
  const { webSetting } = useSettings()
  const sidebarImage = webSetting?.login_sidebar_image_url || LoginSidebarImage

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side: Image (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-3/5 xl:w-2/3 relative">
        <div className="absolute inset-0 bg-black/1 z-10" />
        <img 
          src={sidebarImage} 
          alt="ERP Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* <div className="absolute bottom-8 left-8 z-20 text-white/60 text-xs">
          Photo by <a href="#" className="underline">Alexandr Popadin</a>
        </div> */}
      </div>

      {/* Right Side: Auth Form */}
      <main className="w-full lg:w-2/5 xl:w-1/3 flex flex-col justify-center px-8 sm:px-16 lg:px-12 xl:px-20 py-12 overflow-y-auto max-h-screen">
        <div className="w-full max-w-sm mx-auto my-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
