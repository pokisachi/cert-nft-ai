// "use client";
// import Image from "next/image";
// import { motion } from "framer-motion";

// export default function DemoBanner({ content }: any) {
//   return (
//     <section className="py-24 bg-gray-50 text-center">
//       <motion.h3
//         initial={{ opacity: 0 }}
//         whileInView={{ opacity: 1 }}
//         transition={{ duration: 0.6 }}
//         className="text-2xl font-semibold mb-8"
//       >
//         {content.tagline}
//       </motion.h3>
//       <div className="relative w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
//         <Image
//           src="/demo-dashboard.png"
//           alt={content.alt}
//           width={1200}
//           height={600}
//           className="w-full object-cover"
//         />
//       </div>
//     </section>
//   );
// }
