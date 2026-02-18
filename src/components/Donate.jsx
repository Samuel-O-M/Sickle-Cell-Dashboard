// Replace the entire content of components/Donate.jsx with this:

function Donate() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[85vh] border border-[#84b9b6]/20">
        
        {/* Left Side: Visual/Context */}
        <div className="w-full md:w-2/5 bg-[#478c7b] relative p-12 text-white flex flex-col justify-between overflow-hidden">
          
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#84b9b6] rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#c3a86b] rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

          {/* Top Content */}
          <div className="relative z-10">
            <h2 className="text-5xl font-bold leading-tight mb-6 font-serif">
              Make a<br/>Difference<br/>Today
            </h2>
            <p className="text-lg text-blue-50/90 font-light leading-relaxed mb-8">
              Your contribution directly supports life-saving hydroxyurea treatment and clinical care for sickle cell patients in Kalangala.
            </p>
          </div>

          {/* Impact Stats */}
          <div className="relative z-10 space-y-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#c3a86b] flex items-center justify-center font-bold text-xl shadow-lg text-white">
                1
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-75">Impact</p>
                <p className="font-semibold text-lg">100% Direct Aid</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#84b9b6] flex items-center justify-center font-bold text-xl shadow-lg text-white">
                2
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-75">Trust</p>
                <p className="font-semibold text-lg">Duke Audited</p>
              </div>
            </div>
          </div>

          {/* Logos Footer */}
          <div className="relative z-10 mt-auto">
            <div className="h-px w-full bg-white/20 mb-6"></div>
            <div className="flex flex-wrap items-center gap-4 opacity-90">
               {/* Main Logo (Assuming logo.svg is in public folder) */}
               <img src="/logo.svg" alt="Project Logo" className="h-10 brightness-0 invert" />
               
               {/* Duke Logo */}
               <img src="/img/duke_logo.png" alt="Duke University" className="h-8 brightness-0 invert opacity-80" />
               
               {/* UNC Logo */}
               <img src="/img/unc_logo.png" alt="UNC" className="h-8 brightness-0 invert opacity-80" />
               
               {/* Uganda Flag */}
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/320px-Flag_of_Uganda.svg.png" alt="Uganda" className="h-8 rounded shadow-sm opacity-90" />
            </div>
          </div>
        </div>

        {/* Right Side: Action Options */}
        <div className="w-full md:w-3/5 p-8 md:p-12 bg-white flex flex-col justify-center relative">
          
          <div className="space-y-6 max-w-xl mx-auto w-full">
            
            {/* Option 1: Online Donation (Primary) */}
            <a 
              href="https://www.gifts.duke.edu/?designation=391001102" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group relative overflow-hidden rounded-3xl bg-[#c3a86b]/10 border-2 border-[#c3a86b]/20 hover:border-[#c3a86b] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-3 bg-[#c3a86b] text-white text-xs font-bold rounded-bl-2xl">
                MOST IMMEDIATE
              </div>
              <div className="p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#c3a86b] text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#478c7b] mb-1">Donate Online</h3>
                  <p className="text-gray-600 text-sm">Credit Card, PayPal, Venmo</p>
                  <p className="text-[#c3a86b] text-sm font-semibold mt-2 group-hover:translate-x-2 transition-transform">Proceed to Secure Portal &rarr;</p>
                </div>
              </div>
            </a>

            {/* Option 2: Student GoFundMe */}
            <a 
              href="https://www.gofundme.com/f/help-patients-in-uganda-access-lifesaving-medication" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group rounded-3xl bg-orange-50 border-2 border-orange-100 hover:border-orange-300 transition-all duration-300"
            >
              <div className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-orange-400 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Student GoFundMe</h3>
                  <p className="text-gray-500 text-sm">Support student-led initiatives</p>
                </div>
              </div>
            </a>

            {/* Option 3: Check by Mail */}
            <div className="rounded-3xl bg-[#84b9b6]/5 border-2 border-[#84b9b6]/20 p-6">
              <div className="text-center mb-4">
                 <h3 className="text-lg font-bold text-[#478c7b] mb-1">Check by Mail</h3>
              </div>
              <div className="bg-white rounded-xl p-6 text-sm text-gray-600 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#84b9b6]/10 text-[#478c7b] flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                  </div>
                  <p className="mb-2 w-full border-b pb-2"><span className="font-semibold text-[#478c7b]">Pay to:</span> Duke University</p>
                  <p className="mb-4 w-full border-b pb-2"><span className="font-semibold text-[#478c7b]">Memo:</span> DGHI-Sickle Cell Research (Fund: 391001102)</p>
                  <p className="text-xs text-gray-500">
                    Office of Alumni and Development Records<br/>
                    Duke University, Box 90581<br/>
                    Durham, NC 27708-0581
                  </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Donate