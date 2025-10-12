'use client'; 



 import Link from 'next/link'; 

 import MyCoursesCard from './components/MyCoursesCard'; 

 import MyCertificates from './components/MyCertificates'; 

 import MyAnnouncements from './components/MyAnnouncements'; 

 import { t } from '@/lib/i18n'; 



 export default function MeDashboardPage() { 

   // TODO: Có thể gọi /api/me/profile để hiện avatar + tên 

   const user = { name: 'Learner', avatarUrl: '' }; 



   return ( 

     <main className="mx-auto max-w-7xl p-4 md:p-8"> 

       {/* Header */} 

       <header className="mb-6 flex items-center justify-between"> 

         <div className="flex items-center gap-3"> 

           {/* <div 

             className="h-10 w-10 rounded-full bg-gray-200" 

             role="img" 

             aria-label="User avatar" 

             style={{ backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined }} 

           />  */}

           <div> 

             <h1 className="text-lg font-semibold">{t('dashboard')}</h1> 

             <p className="text-sm text-gray-600">{user.name}</p> 

           </div> 

         </div> 

         <Link 

           href="/me/profile" 

           className="text-sm underline focus:outline-none focus:ring-2 focus:ring-offset-2" 

           aria-label="Go to profile" 

         > 

           {t('profile')} 

         </Link> 

       </header> 



       {/* Grid */} 

       <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3"> 

         <div className="xl:col-span-2"> 

           <MyCoursesCard /> 

         </div> 

         <div> 

           <MyAnnouncements /> 

         </div> 

         <div className="xl:col-span-3"> 

           <MyCertificates /> 

         </div> 

       </div> 

     </main> 

   ); 

 }